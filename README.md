# XS-BE API and Provider Alignment

This document defines the current backend API contracts and provider support status.

## Base

- API prefix: `/api/v1`
- Auth mechanism: Bearer JWT for protected routes
- Response shape for success:
  - `success: true`
  - `message: string`
  - `data?: any`
  - `meta?: any`

## Provider Matrix

| Provider | Connect OAuth | Callback | Account List | Token Refresh | Post Publish | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| linkedin | yes | yes | yes | yes | yes | Company page sync supported |
| facebook | yes | yes | yes | yes | yes | Page discovery supported |
| instagram | yes | yes | yes | yes | yes | Uses media container + media_publish flow |
| x | yes | yes | yes | yes | yes | PKCE via state/code verifier |
| twitter | yes | yes | yes | yes | yes | Separate provider alias path |
| youtube | yes | yes | yes | yes | yes | Requires video media URL for upload |

## Social APIs

### GET `/api/v1/social/accounts`

Lists connected social accounts.

Query:
- `page?: number`
- `limit?: number`
- `sortBy?: string`
- `order?: asc|desc`
- `platform?: linkedin|facebook|instagram|x|twitter|youtube`
- `isConnected?: true|false`

Auth: required.

### POST `/api/v1/social/connect/:platform`

Generates OAuth connect URL for a provider.

Path params:
- `platform`: `linkedin|facebook|instagram|x|twitter|youtube`

Auth: required.

### GET `/api/v1/social/callback/:platform`

OAuth callback endpoint.

Path params:
- `platform`: `linkedin|facebook|instagram|x|twitter|youtube`

Query params:
- `code: string` (required)
- `state?: string`
- `userId?: string` (fallback)

Auth: not required (OAuth redirect endpoint).

### POST `/api/v1/social/refresh-token`

Refreshes provider access token for one connected social handle.

Body:
- `socialId: string` (required)

Auth: required.

### DELETE `/api/v1/social/:id`

Disconnects one social handle.

Path params:
- `id: string` (required)

Auth: required.

### POST `/api/v1/upload/media`

Uploads media files and returns publicly accessible URLs.

Form-data:
- `files`: one or more image/video files

Auth: required.

## Post APIs Provider Fields

`selectedPlatforms` and response platform entries accept:
- `linkedin`
- `facebook`
- `instagram`
- `x`
- `twitter`
- `youtube`

## Environment Variables (Provider OAuth)

Required by provider integrations:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `FACEBOOK_REDIRECT_URI`
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REDIRECT_URI`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_REDIRECT_URI`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`

## Recommended Frontend Callback Paths

- `/oauth/callback/linkedin`
- `/oauth/callback/facebook`
- `/oauth/callback/instagram`
- `/oauth/callback/x`
- `/oauth/callback/twitter`
- `/oauth/callback/youtube`

## Current Limitation Notes

- OAuth callback state should be signed and validated for production-hardening.
