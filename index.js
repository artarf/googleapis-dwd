const { GoogleAuth, Compute, JWT } = require('google-auth-library')

module.exports = async function(subject, scopes) {
    const gauth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
    const authClient = await gauth.getClient()
    if (authClient instanceof JWT) {
        return await new GoogleAuth({ scopes, clientOptions: { subject } }).getClient()
    } else if (authClient instanceof Compute) {
        const email = (await gauth.getCredentials()).client_email
        return require('./auth')(authClient, email, subject, scopes)
    } else {
        throw new Error('Unexpected authentication type')
    }
}
