"use strict";

require("dotenv").config();

const { getPool } = require("../db/pool");
const { createSalesInvite } = require("../services/sales-account-service");
const { sendSalesInviteEmail } = require("../services/sales-account-email-service");

function usage() {
  console.log("Usage:");
  console.log('  npm run sales:invite -- salesperson@example.com "Sales Person Name"');
}

async function run() {
  const [, , email, ...nameParts] = process.argv;
  const name = nameParts.join(" ").trim();

  if (!email || !name) {
    usage();
    process.exitCode = 1;
    return;
  }

  const result = await createSalesInvite({
    email,
    name,
    createdBy: process.env.SALES_INVITE_CREATED_BY || "ReadyTech owner",
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  const emailResult = await sendSalesInviteEmail({
    invite: result.invite,
    signupUrl: result.signupUrl,
  });

  console.log("Sales account invite created.");
  console.log(`Name: ${result.invite.salesperson_name}`);
  console.log(`Email: ${result.invite.email}`);
  console.log(`Expires: ${result.invite.expires_at}`);
  console.log(`Email: ${emailResult.skipped ? "not sent in development; copy the link manually" : "sent"}`);
  console.log(`Invite link: ${result.signupUrl}`);
  console.log("Keep this link private. It can be used once.");
}

run()
  .catch((error) => {
    console.error("Invite failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await getPool().end();
    } catch {
      // Pool may not exist if validation failed before database access.
    }
  });
