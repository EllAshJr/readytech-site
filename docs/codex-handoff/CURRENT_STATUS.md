# Current Status

## Public Site

The site has been repositioned around business uptime and connected operations.

Recent work included:

- Navigation updates
- /how-we-work page
- strategy data file
- pricing card ordering
- ReadyContinuity Pro highlight
- Book Assessment button styling
- restaurant page positioning

## Instant Estimate

Installed and partially configured.

Requires:

- PostgreSQL DATABASE_URL
- Resend configuration
- Turnstile keys for production

## Sales Coach

Installed and being tested locally.

Known recent issue:

Sales dashboard database actions require a working DATABASE_URL.

Local WSL testing can use local PostgreSQL:

postgresql://readytech:readytechdev@localhost:5432/readytech_dev

Production Render should use Render internal PostgreSQL URL.

## Deployment

GitHub repo:

EllAshJr/readytech-site

Production:

https://readytechinstalls.com

Hosting:

Render

DNS/email forwarding:

Cloudflare
