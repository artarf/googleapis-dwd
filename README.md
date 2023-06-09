# googleapis-dwd

Authorize Google Functions to use domain wide delegation (act as a user)

Applies to Google Run as well, maybe others too.

Based on [SO answer](https://stackoverflow.com/a/60506185), which is based on [this answer](https://stackoverflow.com/a/57092533).

You would expect that when _domain wide delegation_ is enabled for a service account,
you could easily use it in _cloud functions_ to access user data from gmail, calendar, drive, etc.
Just create new token with impersonated a user and correct scopes.
That is not the case. New token must be signed with _service account_'s private key
and it is not recommended to spread the key around.

This library provides a way to call _google cloud_ to sign the new key - without 
any need to access the private key inside the function.

## Use case

- _service account_ with **domain wide delegation** enabled to access user data like calendar, drive, gmail, etc.
- want to use that _service account_ in a _cloud function_ or _cloud run_ to access user data
- do NOT want to use service account json file, because that might be a *security risk*.

That scenario works when you test locally (with GOOGLE_APPLICATION_CREDENTIALS), but fails when deployed to the cloud.

```json
{
  "code" : 400,
  "errors" : [ {
    "domain" : "global",
    "message" : "Bad Request",
    "reason" : "failedPrecondition"
  } ],
  "message" : "Bad Request"
}
```


## Install

Not yet published to npm, use github dependencies:
```json
{
  "dependencies": {
    "googleapis-dwd": "artarf/googleapis-dwd"
  }
}
```

## Usage

```javascript
const dwd = require('googleapis-dwd')

const cred = await dwd("test@domain.com", ["https://desired/scope"])
// use cred to access user data
const result = await google.gmail({version: 'v1', auth: cred}).users.labels.list({userId: 'me'})
```

## Requirements

### Roles 

Your service account needs 'Service Account Token Creator' role. You can create it with following command

```bash
gcloud projects add-iam-policy-binding PROJECT-ID \
  --member=serviceAccount:SERVICE-ACCOUNT@PROJECT-ID.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountTokenCreator
```

In order to deploy the function, your build service account needs 'Service Account User' role in the service account used for running the function.

You can create it with following command:

```bash
gcloud iam service-accounts add-iam-policy-binding SERVICE-ACCOUNT@PROJECT-ID.iam.gserviceaccount.com \
  --member serviceAccount:PROJECT-NUMBER@cloudbuild.gserviceaccount.com \
  --role roles/iam.serviceAccountUser
```

where
- `SERVICE-ACCOUNT@PROJECT-ID.iam.gserviceaccount.com` is the build service account
- `PROJECT-NUMBER@cloudbuild.gserviceaccount.com` is the function service account

### IAM api enabled

`gcloud services enable iam.googleapis.com`


## Alternative approach

You can utilize Application Default Credentials, but force it to use your json file.
To be a good citizen, store your entire json file contents in Secret Manager.

Then, in your deployment...

```bash
gcloud functions deploy ... \
 ... \
  --set-secrets /etc/secrets/credential.json=YOUR-SECRET-NAME:latest \
  --set-env-vars GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/credential.json
```

```javascript
const subject = "your@email.address"
const scopes = ["https://desired/scope", ..]
const jwt = await new google.auth.GoogleAuth({ scopes, clientOptions: { subject } })
// use jwt to access user data
const result = await google.gmail({version: 'v1', auth: jwt}).users.labels.list({userId: 'me'})
```
