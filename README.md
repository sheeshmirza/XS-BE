# XSocial Backend

Production-ready backend for social media management (Buffer/Hootsuite style) built with Node.js, Express, MongoDB, and BullMQ.

## Features

- JWT auth with refresh token rotation
- Email verification and forgot/reset password
- User profile/account management
- Multi-account social OAuth integration
- Post CRUD + publish + schedule
- Platform response persistence
- Notification center
- Dashboard stats and analytics
- Cloudinary media upload
- Joi validation, centralized errors, structured logging
- Swagger docs at `/docs`

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- Joi validation
- BullMQ + Redis scheduler
- Cloudinary uploads
- Winston + Morgan logging

## Folder Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  repositories/
  services/
  routes/
  validations/
  queue/
  jobs/
  adapters/
  docs/
  app.js
  server.js
```

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

4. Open docs:

- `http://localhost:5000/docs`

## API Base

- `/api/v1`

## Required Infrastructure

- MongoDB
- Redis (for scheduler)
- SMTP service (for verification/reset emails)
- Cloudinary (optional for persistent media uploads)

## Notes

- OAuth callback currently resolves user via `state` payload. In production, move this to signed state stored server-side.
- Platform publishing endpoints are abstracted via adapters to simplify future expansion.
