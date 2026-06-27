# Build Rules

## Always Do

- Check git status first.
- Make backups or work on a branch.
- Apply the smallest safe patch.
- Run syntax checks.
- Test locally before pushing.
- Keep user instructions copy/paste friendly.

## Never Commit

.env
node_modules/
backups/
API keys
database URLs
tokens
secrets

## Standard Checks

node -c server.js

node -c routes/quotes.js

node -c routes/sales.js

node -c services/estimate-engine.js

node -c services/sales-recommendation-engine.js

EJS compile checks for edited templates.

## Common Local Test

npm start

Open:

http://localhost:3000

Important pages:

/
/services
/pricing
/how-we-work
/services/restaurant-technology
/instant-quote
/sales

## Deployment

After commit and push, Render should redeploy automatically.

If not:

Render Dashboard
→ readytech-site
→ Manual Deploy
→ Deploy latest commit
