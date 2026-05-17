# Security Operations

## JWT Secret Rotation

ClinicalCWC API tokens are signed with `JWT_SECRET` in `apps/api`. The API fails fast if
the secret is missing.

To rotate the secret without abruptly breaking all sessions:

1. Deploy a version that accepts both the current secret and the next secret for
   verification, while still signing new tokens with the current secret.
2. Deploy the new `JWT_SECRET` and switch signing to the new secret.
3. Keep accepting the previous secret until the longest token lifetime has elapsed.
4. Remove the previous secret from verification after the overlap window.

If immediate revocation is required after a suspected compromise, replace `JWT_SECRET`
and restart the API. Existing sessions will be forced to sign in again.

## Local Encryption Rotation

When a user changes their encryption passcode, local encrypted records must be decrypted
with the old passcode, re-encrypted with the new passcode, verified with a test decrypt,
and only then committed back to IndexedDB. Failed verification must abort before any
record replacement.
