# Contact API

This is a lightweight Node.js/Express backend for processing contact form submissions from the Integrity Dashboard and personal site. It sends emails directly through Gmail SMTP, meaning you **do not** need to sign up for FormSubmit, SendGrid, or any other third-party email service.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your Gmail credentials:
   - `GMAIL_USER`: xibalbasolutions@gmail.com
   - `GMAIL_APP_PASSWORD`: Generate this in your Google Account Security settings (App Passwords).

## Running the Server

Start the backend:
```bash
node server.js
```
The server runs on port `3001` by default (or the `PORT` specified in `.env`).

## API Endpoints

- `GET /health` : Health check endpoint.
- `POST /api/contact` : Accepts JSON payload (`name`, `email`, `organization`, `inquiry_type`, `message`) and sends the email.
