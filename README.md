# googleapis-dwd,

Authorize Google Functions to use domain wide delegation (act as a user)

Applies to Google Run as well, maybe others too.

Based on [SO answer](https://stackoverflow.com/a/60506185), which is based on [this answer](https://stackoverflow.com/a/57092533).


## Use case

- service account with Domain-wide delegation enabled to access user data like calendar, drive, gmail, etc.
- want to use that service account in a cloud function or cloud run
- do NOT want to use service account json file, because that might be a *security risk*.

That scenario works when you test locally (with GOOGLE_APPLICATION_CREDENTIALS), but fails when deployed to the cloud.

```javascript
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

`npm install googleapis-dwd`

## Usage

This package does not depend on google libraries, those are delivered in the call. 
This way versions will be exactly the same. 
Downside is that there can be no control of applicable versions.

```javascript
const dwd = require('googleapis-dwd')
const auth = require('google-auth-library')
const { iam } = require('@googleapis/iam')

const cred = await dwd(auth, iam, "test@domain.com", ["https://desired/scope"])
// use cred to access user data
google.gmail('v1', cred)
```

Or, if you want to depend on the whole googleapis package:

```javascript
const dwd = require('googleapis-dwd')
const google = require('googleapis')
const cred = await dwd(google.auth, google.iam, "test@domain.com", ["https://desired/scope"])
// use cred to access user data
google.gmail('v1', cred)
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
To be a good citizen, store your json file contents in Secret Manager.

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
google.gmail('v1', jwt)
```
