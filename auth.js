const querystring = require('node:querystring')
const { IAMCredentialsClient } = require('@google-cloud/iam-credentials').v1

const unpad = (input) => input.replace(/=*$/, '')

const unpaddedB64encode = (input) => unpad(Buffer.from(input).toString('base64'))

function getPayload(email, subject, scopes) {
    const now = Math.floor(new Date().getTime() / 1000)
    const expiry = now + 3600
    return unpaddedB64encode(JSON.stringify({
        aud: 'https://accounts.google.com/o/oauth2/token',
        exp: expiry,
        iat: now,
        iss: email,
        scope: scopes.join(' '),
        sub: subject,
    }))
}

const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' })

async function sign(authClient, email, payload) {
    const credentialsClient = new IAMCredentialsClient();
    const body = {
        auth: authClient,
        name: `projects/-/serviceAccounts/${email}`,
        payload: unpaddedB64encode(payload),
    }
    const [result] = await credentialsClient.signBlob(body)
    return unpad(result.signedBlob.toString('base64'))
}

async function token(payload, signature) {
    const headers = { 'content-type': 'application/x-www-form-urlencoded' }
    const assertion = payload + '.' + signature
    const grant_type = 'urn:ietf:params:oauth:grant-type:jwt-bearer'
    const body = querystring.encode({ assertion, grant_type })
    const result = await fetch('https://accounts.google.com/o/oauth2/token',{ method: 'POST',headers,body })
    const respbody = await result.json()
    return respbody.access_token;
}

async function generateAuth(auth, authClient, email, subject, scopes) {
    const iamPayload = `${unpaddedB64encode(header)}.${getPayload(email, subject, scopes)}`
    const signature = await sign(authClient, email, iamPayload)
    const access_token = await token(iamPayload, signature)
    const OAuth2Client = auth.OAuth2Client || auth.OAuth2
    const newCredentials = new OAuth2Client()
    newCredentials.setCredentials({ access_token })
    return newCredentials
}

module.exports = generateAuth
