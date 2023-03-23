const assert = require('node:assert')

async function test() {
    // make sure you have enviroment variables set:
    // GOOGLE_APPLICATION_CREDENTIALS = service account json file
    // subject = your email address
    const { google } = require('googleapis')
    const gauth = new google.auth.GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
    const authClient = await gauth.getClient()
    const email = (await gauth.getCredentials()).client_email
    const subject = process.env.subject
    const scopes = [ "https://www.googleapis.com/auth/gmail.readonly" ]
    const generateAuth = require('./auth.js')

    let auth = await generateAuth(authClient, email, subject, scopes)
    const x = await google.gmail({version:'v1', auth}).users.labels.list({userId:'me'})

    auth = await require('./index.js')(subject, scopes)
    const z = await google.gmail({version:'v1', auth}).users.labels.list({userId:'me'})

    assert.deepEqual(x.data.labels, z.data.labels)
}

test().then(_ =>
    console.log('End test')
)
