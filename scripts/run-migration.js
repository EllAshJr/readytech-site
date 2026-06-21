"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { getPool } = require("../db/pool");

async function run() {
  const migrationDirectory = path.join(__dirname, "..", "db", "migrations");
  const files = fs
    .readdirSync(migrationDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const pool = getPool();

  for (const file of files) {
    const fullPath = path.join(migrationDirectory, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    console.log(`Running ${file}...`);
    await pool.query(sql);
  }

  await pool.end();
  console.log("Database migrations completed.");
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
