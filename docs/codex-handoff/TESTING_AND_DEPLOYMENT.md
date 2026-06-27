# Testing and Deployment

## Local Checks

node -c server.js
node -c routes/quotes.js
node -c routes/sales.js
node -c services/estimate-engine.js
node -c services/sales-recommendation-engine.js
npm run sales:test

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

Run migrations:

npm run db:migrate

## Render

Production Render must have:

DATABASE_URL
DATABASE_SSL=false
BASE_URL=https://readytechinstalls.com
RESEND_API_KEY
SALES_APP_USERNAME
SALES_APP_PASSWORD
SALES_SESSION_SECRET
SALES_SESSION_HOURS

## Post-Deploy Checks

https://readytechinstalls.com
https://readytechinstalls.com/services
https://readytechinstalls.com/pricing
https://readytechinstalls.com/how-we-work
https://readytechinstalls.com/instant-quote
https://readytechinstalls.com/sales
