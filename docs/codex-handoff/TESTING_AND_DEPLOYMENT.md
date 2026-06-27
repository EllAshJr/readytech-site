# Testing and Deployment

## Local Checks

npm run check:syntax
npm run sales:test

Or run both:

npm run check

npm run check:syntax covers the main server, routes, services, public JavaScript, and helper scripts. npm run sales:test compiles Sales Coach EJS templates and exercises the recommendation engine.

## Local Start

npm start

## Local URLs

http://localhost:3000
http://localhost:3000/instant-quote
http://localhost:3000/sales

## Database

For local WSL testing:

postgresql://readytech:readytechdev@localhost:5432/readytech_dev

DATABASE_SSL=false

Use DATABASE_SSL=false for local PostgreSQL and Render internal PostgreSQL. Use DATABASE_SSL=true only when connecting locally to a Render external database URL.

Run migrations:

npm run db:migrate

## Render

Production Render must have:

DATABASE_URL
DATABASE_SSL=false
BASE_URL=https://readytechinstalls.com
RESEND_API_KEY
OWNER_EMAIL
QUOTE_FROM_EMAIL
QUOTE_REPLY_TO
QUOTE_TOKEN_SECRET
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_EXPECTED_HOSTNAME
SALES_APP_USERNAME
SALES_APP_PASSWORD
SALES_SESSION_SECRET
SALES_SESSION_HOURS
SALES_REPORT_FROM_EMAIL

## Post-Deploy Checks

https://readytechinstalls.com
https://readytechinstalls.com/services
https://readytechinstalls.com/pricing
https://readytechinstalls.com/how-we-work
https://readytechinstalls.com/instant-quote
https://readytechinstalls.com/sales
