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

    let auth = await generateAuth(google.auth, google.iam, authClient, email, subject, scopes)
    const x = await google.gmail({version:'v1', auth}).users.labels.list({userId:'me'})
    console.log("a", x.data.labels[0])

    auth = await generateAuth(require('google-auth-library'), require('@googleapis/iam').iam, authClient, email, subject, scopes)
    const y = await google.gmail({version:'v1', auth}).users.labels.list({userId:'me'})
    console.log("b", y.data.labels[0])

    auth = await require('./index.js')(google.auth, google.iam, subject, scopes)
    const z = await google.gmail({version:'v1', auth}).users.labels.list({userId:'me'})
    console.log("c", z.data.labels[0])
}

await test()
