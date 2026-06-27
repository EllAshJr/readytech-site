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

npm run check:syntax

npm run sales:test

Or run both:

npm run check

npm run check:syntax covers the main server, routes, services, public JavaScript, and helper scripts. npm run sales:test compiles Sales Coach EJS templates and exercises the recommendation engine.

Run EJS compile checks for any other edited templates.

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
