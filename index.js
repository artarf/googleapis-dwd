const querystring = require('node:querystring')

module.exports = async function(google, subject, scopes) {
    const auth = new google.auth.GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
    const authClient = await auth.getClient()
    if (authClient instanceof google.auth.JWT) {
        return await new google.auth.GoogleAuth({ scopes, clientOptions: { subject } }).getClient()
    } else if (authClient instanceof google.auth.Compute) {
        const serviceAccountEmail = (await auth.getCredentials()).client_email
        const unpaddedB64encode = (input) => Buffer.from(input).toString('base64').replace(/=*$/, '')
        const now = Math.floor(new Date().getTime() / 1000)
        const expiry = now + 3600
        const payload = JSON.stringify({
            aud: 'https://accounts.google.com/o/oauth2/token',
            exp: expiry,
            iat: now,
            iss: serviceAccountEmail,
            scope: scopes.join(' '),
            sub: subject,
        })
        const header = JSON.stringify({
            alg: 'RS256',
            typ: 'JWT',
        })
        const iamPayload = `${unpaddedB64encode(header)}.${unpaddedB64encode(payload)}`
        const { data } = await google.iam('v1').projects.serviceAccounts.signBlob({
            auth: authClient,
            name: `projects/-/serviceAccounts/${serviceAccountEmail}`,
            requestBody: {
                bytesToSign: unpaddedB64encode(iamPayload),
            },
        })
        const assertion = iamPayload + '.' + data.signature.replace(/=*$/, '')
        const headers = { 'content-type': 'application/x-www-form-urlencoded' }
        const body = querystring.encode({ assertion, grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer' })
        const response = await fetch('https://accounts.google.com/o/oauth2/token', { method: 'POST', headers, body }).then(r => r.json())
        const newCredentials = new google.auth.OAuth2Client()
        newCredentials.setCredentials({ access_token: response.access_token })
        return newCredentials
    } else {
        throw new Error('Unexpected authentication type')
    }
}
