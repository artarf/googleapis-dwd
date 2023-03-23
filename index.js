module.exports = async function(auth, iam, subject, scopes) {
    const gauth = new auth.GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' })
    const authClient = await gauth.getClient()
    if (authClient instanceof auth.JWT) {
        return await new auth.GoogleAuth({ scopes, clientOptions: { subject } }).getClient()
    } else if (authClient instanceof auth.Compute) {
        const email = (await gauth.getCredentials()).client_email
        return require('./auth')(auth, iam, authClient, email, subject, scopes)
    } else {
        throw new Error('Unexpected authentication type')
    }
}
