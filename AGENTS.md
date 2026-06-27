# ReadyTech Codex Instructions

## Project

This repository powers ReadyTech at readytechinstalls.com.

ReadyTech is a business-uptime and connected-operations company serving Austin, Manor, and Houston.

The core promise:

ReadyTech installs, monitors, and supports the connectivity local businesses depend on to operate.

## User Tone

Talk to the project owner in a supportive, direct, motivating tone.

Preferred pet name:

Tech King

Style:

- Be practical.
- Be step-by-step.
- Avoid overbuilding.
- Explain why before major code changes.
- Prefer safe patches over large rewrites.
- When giving terminal commands, assume WSL Ubuntu.
- Warn before destructive commands.
- Do not expose secrets.
- Do not commit `.env`, credentials, API keys, database URLs, tokens, or backups.

## Build Philosophy

This project should remain focused.

Do not turn ReadyTech into:

- A generic computer repair company
- A residential IT company
- A restaurant-only company
- A huge catalog of unrelated tech services

Restaurants are the first vertical, not the entire business.

## Main Strategy

ReadyTech should be positioned around:

- Business uptime
- Managed connectivity
- Secure business networks
- Business Wi-Fi
- Remote access
- Network monitoring
- Backup internet and failover
- Managed backup and secure file access
- Restaurant technology as the first specialization

## Three Pillars

ReadyConnect:
Connect the business properly.

ReadyUptime:
Keep the business operating.

ReadyOps:
Improve daily operations.

## Flagship Offers

1. ReadyUptime Managed — from $249/location/month
2. ReadyTech Uptime Assessment — $349
3. ReadyContinuity Pro — from $449/location/month
4. ReadyConnect Foundation — $1,500–$4,500 plus hardware

ReadyContinuity Pro should be visually accented as the recommended managed plan.

Restaurant Operations Add-on starts at $250/location/month.

Typical restaurant target:
ReadyContinuity Pro + Restaurant Operations Add-on = approximately $699/location/month.

## Coding Rules

Before making changes:

1. Inspect the current file.
2. Make a backup or rely on Git.
3. Apply the smallest safe patch.
4. Run syntax checks.
5. Tell the user how to test locally.
6. Tell the user what to commit and push.

Do not remove the Instant Estimate app or Sales Coach app unless explicitly asked.

Do not publish internal KB content as public website pages unless asked.

## Local Environment

The project is developed in WSL Ubuntu.

Common project path:

~/projects/private-infra-seo-site

Use:

npm start

Local site:

http://localhost:3000

Production site:

https://readytechinstalls.com

Hosting:

Render Web Service

DNS and email forwarding:

Cloudflare

Database:

PostgreSQL

Email service:

Resend

## Safety

Never ask the user to paste secrets into chat.

Never commit:

.env
database URLs
API keys
tokens
backups/
node_modules/

