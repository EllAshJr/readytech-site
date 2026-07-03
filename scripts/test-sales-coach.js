"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const salesRouter = require("../routes/sales");
const { attachSession, requireCsrf } = require("../services/sales-auth");
const { _testing: salesAccountTesting } = require("../services/sales-account-service");
const { _testing: salesEmailTesting } = require("../services/sales-email-service");
const { analyzeSalesConsultation, getWorkflowSequence } = require("../services/sales-recommendation-engine");

const files = [];

function mockResponse() {
  return {
    locals: {},
    statusCode: null,
    sentBody: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.sentBody = body;
      return this;
    },
  };
}

function assertRouteValidationHelpers() {
  assert.ok(salesRouter._testing, "Expected Sales Coach route test helpers.");

  const { parseConsultationId, parseWorkflowCardId } = salesRouter._testing;

  assert.strictEqual(parseConsultationId("42"), 42);
  assert.strictEqual(parseConsultationId(42), 42);
  assert.strictEqual(parseConsultationId("abc"), null);
  assert.strictEqual(parseConsultationId("1.5"), null);
  assert.strictEqual(parseConsultationId("-1"), null);
  assert.strictEqual(parseConsultationId("0"), null);
  assert.strictEqual(parseConsultationId("9007199254740992"), null);

  assert.strictEqual(parseWorkflowCardId("1"), 1);
  assert.strictEqual(parseWorkflowCardId("12"), 12);
  assert.strictEqual(parseWorkflowCardId("0"), null);
  assert.strictEqual(parseWorkflowCardId("13"), null);
  assert.strictEqual(parseWorkflowCardId("abc"), null);
  assert.strictEqual(parseWorkflowCardId("1.5"), null);
}

function assertMalformedCookieSafety() {
  const req = {
    headers: {
      cookie: "readytech_sales=%E0%A4%A; other=value",
    },
  };
  const res = mockResponse();
  let nextCalled = false;

  assert.doesNotThrow(() => {
    attachSession(req, res, () => {
      nextCalled = true;
    });
  });

  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.salesSession, null);
  assert.strictEqual(res.locals.salesSession, null);
  assert.strictEqual(res.locals.salesCsrf, "");
}

function assertCsrfSafety() {
  const missingBodyRes = mockResponse();
  let missingBodyNextCalled = false;

  assert.doesNotThrow(() => {
    requireCsrf(
      { salesSession: { csrf: "known-token" } },
      missingBodyRes,
      () => {
        missingBodyNextCalled = true;
      },
    );
  });

  assert.strictEqual(missingBodyNextCalled, false);
  assert.strictEqual(missingBodyRes.statusCode, 403);

  const validRes = mockResponse();
  let validNextCalled = false;

  requireCsrf(
    { salesSession: { csrf: "known-token" }, body: { _csrf: "known-token" } },
    validRes,
    () => {
      validNextCalled = true;
    },
  );

  assert.strictEqual(validNextCalled, true);
  assert.strictEqual(validRes.statusCode, null);
}

function assertSalesAccountHelpers() {
  assert.strictEqual(salesAccountTesting.normalizeUsername(" Ready.Seller_1 "), "ready.seller_1");
  assert.strictEqual(salesAccountTesting.normalizeEmail(" SELLER@EXAMPLE.COM "), "seller@example.com");

  assert.strictEqual(salesAccountTesting.validateUsername("ready-seller").ok, true);
  assert.strictEqual(salesAccountTesting.validateUsername("no spaces").ok, false);
  assert.strictEqual(salesAccountTesting.validateUsername("ab").ok, false);

  assert.strictEqual(salesAccountTesting.validatePassword("short1").ok, false);
  assert.strictEqual(salesAccountTesting.validatePassword("longpassword").ok, false);
  assert.strictEqual(salesAccountTesting.validatePassword("ReadyTech2026").ok, true);

  const token = salesAccountTesting.generateToken();
  const secondToken = salesAccountTesting.generateToken();
  assert.notStrictEqual(token, secondToken);
  assert.ok(token.length >= 32);

  const tokenHash = salesAccountTesting.tokenHash(token);
  assert.notStrictEqual(tokenHash, token);
  assert.strictEqual(tokenHash, salesAccountTesting.tokenHash(token));

  assert.strictEqual(
    salesAccountTesting.signupUrl("abc123", { BASE_URL: "https://readytech.example/" }),
    "https://readytech.example/sales/signup/abc123",
  );
  assert.strictEqual(
    salesAccountTesting.resetUrl("abc123", { BASE_URL: "https://readytech.example/" }),
    "https://readytech.example/sales/reset/abc123",
  );

  const hash = salesAccountTesting.hashPassword("ReadyTech2026");
  assert.notStrictEqual(hash, "ReadyTech2026");
  assert.strictEqual(salesAccountTesting.verifyPassword("ReadyTech2026", hash), true);
  assert.strictEqual(salesAccountTesting.verifyPassword("wrong-password", hash), false);
}

function assertSalesReportEmailHelpers(analysis, answers) {
  const consultation = {
    id: 123,
    consultation_number: "RT-S-2026-123456",
    salesperson_name: "ReadyTech Seller",
    salesperson_email: "seller@example.com",
    customer_name: "A&B <Owner>",
    business_name: "Ready <Diner>",
    customer_email: "customer@example.com",
    customer_phone: "555-0100",
    business_type: "restaurant",
    city: "Manor",
    completed_at: "2026-06-30T15:45:00.000Z",
    updated_at: "2026-06-30T15:45:00.000Z",
    answers: {
      ...answers,
      problem_description: "Internet <script>alert(1)</script> & POS down",
    },
  };

  const recipients = salesEmailTesting.buildSalesReportRecipients({
    recipient: "seller@example.com",
    env: {
      NODE_ENV: "development",
      SALES_OWNER_COPY_EMAIL: "owner@example.com, second@example.com, SELLER@example.com",
    },
    logger: { warn() {} },
  });

  assert.deepStrictEqual(recipients.to, [
    "seller@example.com",
    "owner@example.com",
    "second@example.com",
  ]);

  assert.deepStrictEqual(
    salesEmailTesting.getOwnerReportRecipients({
      OWNER_EMAIL: "fallback-owner@example.com",
    }),
    ["fallback-owner@example.com"],
  );

  const missingOwner = salesEmailTesting.buildSalesReportRecipients({
    recipient: "seller@example.com",
    env: { NODE_ENV: "development" },
    logger: { warn() {} },
  });
  assert.strictEqual(missingOwner.ownerCopyMissing, true);
  assert.deepStrictEqual(missingOwner.to, ["seller@example.com"]);

  assert.throws(
    () => salesEmailTesting.buildSalesReportRecipients({
      recipient: "seller@example.com",
      env: { NODE_ENV: "production" },
      logger: { warn() {} },
    }),
    /SALES_OWNER_COPY_EMAIL or OWNER_EMAIL/,
  );

  const attachment = salesEmailTesting.buildSalesReportAttachment({
    consultation,
    analysis,
  });
  const attachmentHtml = Buffer.from(attachment.content, "base64").toString("utf8");

  assert.ok(attachment.filename.includes(consultation.consultation_number));
  assert.ok(attachment.filename.endsWith(".html"));
  assert.ok(attachmentHtml.includes(consultation.consultation_number));
  assert.ok(attachmentHtml.includes("seller@example.com"));
  assert.ok(attachmentHtml.includes("A&amp;B &lt;Owner&gt;"));
  assert.ok(attachmentHtml.includes("Ready &lt;Diner&gt;"));
  assert.ok(attachmentHtml.includes("Internet &lt;script&gt;alert(1)&lt;/script&gt; &amp; POS down"));
  assert.ok(!attachmentHtml.includes("A&B <Owner>"));
  assert.ok(!attachmentHtml.includes("<script>alert(1)</script>"));
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (fullPath.endsWith(".ejs")) files.push(fullPath);
  }
}

walk(path.join(__dirname, "..", "views", "sales"));

for (const file of files) {
  ejs.compile(fs.readFileSync(file, "utf8"), { filename: file });
  console.log(`OK EJS: ${path.relative(process.cwd(), file)}`);
}

assertRouteValidationHelpers();
console.log("OK route validation: bad IDs and card numbers rejected");

assertMalformedCookieSafety();
console.log("OK auth safety: malformed cookies do not throw");

assertCsrfSafety();
console.log("OK CSRF safety: missing body fails closed");

assertSalesAccountHelpers();
console.log("OK sales accounts: validation, one-time token helpers, and password hashing");

const sample = {
  business_type: "restaurant",
  city: "Manor",
  internal_it: "none",
  primary_problem: "pos-payments",
  business_impact: ["lost-revenue", "payments-stop"],
  problem_frequency: "weekly",
  downtime_tolerance: "under-15",
  estimated_hourly_loss: "2000-5000",
  decision_authority: "sole",
  assessment_budget: "approved",
  recurring_interest: "yes",
  requested_pillars: ["readyuptime", "readyops"],
  service_needs: ["monitoring", "backup-internet", "pos"],
  monitor_firewalls: 1,
  monitor_switches: 2,
  monitor_access_points: 4,
  monitor_pos_devices: 3,
  monitor_printers_kds: 4,
  backup_internet_current: "none",
  auto_failover: "no",
  failover_testing: "never",
  pos_terminals: 3,
  payment_terminals: 3,
  kitchen_printers: 2,
  kds_screens: 2,
  network_documentation: "no",
  cabling_known: "unknown",
  assumptions_verified: "no",
  customer_status: "assessment",
  next_action: "Book assessment",
  budget_range: "5000-15000",
  urgency: "thirty-days",
  current_support: "vendors",
};

const result = analyzeSalesConsultation(sample);
const sequence = getWorkflowSequence(sample);

if (result.primaryRecommendation.id !== "continuity") {
  throw new Error(`Expected ReadyContinuity Pro; received ${result.primaryRecommendation.title}`);
}

if (result.entryOffer.id !== "assessment") {
  throw new Error(`Expected Uptime Assessment entry; received ${result.entryOffer.title}`);
}

if (!sequence.includes(7) || !sequence.includes(8)) {
  throw new Error("Expected ReadyUptime and ReadyOps cards in restaurant workflow.");
}

assertSalesReportEmailHelpers(result, sample);
console.log("OK sales report email: recipients and HTML attachment");

console.log("OK recommendation engine: ReadyContinuity Pro");
console.log("OK entry offer: Uptime Assessment");
console.log("OK workflow pivot:", sequence.join(" → "));
console.log("Sales Coach tests passed.");
