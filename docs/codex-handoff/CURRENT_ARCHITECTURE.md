# Current Architecture

## Framework

Node.js Express app with EJS templates.

## Main Files

server.js

views/
public/
data/
routes/
services/
db/
scripts/
kb/

## Major Features

Public marketing website:

- Homepage
- Services page
- Pricing page
- Restaurant Technology page
- How It Works page
- Contact page
- Service area pages
- Restaurant SEO/service pages

Instant Estimate app:

- /instant-quote
- customer intake
- estimate calculation
- secure estimate page
- accept/reject/request call workflow

Sales Coach app:

- /sales
- simple temporary login
- guided sales consultation
- recommendation engine based on KB logic
- PostgreSQL consultation storage
- email report to salesperson

## Important Data Files

data/site-strategy.js
data/pricing.js
data/restaurant.js
data/estimator-rules.js
data/sales-playbook.js

## Internal KB

kb/
kb/sales/

These are internal documents and should not be exposed as public routes unless explicitly requested.
