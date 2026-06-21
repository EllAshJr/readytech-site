"use strict";

const pricingData = require("../data/pricing");
const {
  allowedBusinessTypes,
  allowedServiceSlugs,
  estimateValidityDays,
} = require("../data/estimator-rules");

const STRING_KEYS = [
  "customer_name",
  "business_name",
  "email",
  "phone",
  "business_type",
  "city",
  "zip_code",
  "start_timeframe",
  "work_window",
  "equipment_known",
  "description",
  "vpn_type",
  "vpn_firewall_brand",
  "vpn_mfa",
  "vpn_state",
  "vpn_monitoring",
  "vpn_after_hours",
  "cloud_migration",
  "cloud_backup_frequency",
  "cloud_remote_access",
  "cloud_restore_assistance",
  "cloud_managed_backup",
  "monitor_alerting",
  "monitor_alert_method",
  "monitor_response",
  "monitor_reporting",
  "wifi_coverage",
  "wifi_staff",
  "wifi_guest",
  "wifi_portal",
  "wifi_cabling",
  "wifi_dead_zones",
  "wifi_filtering",
  "backup_type",
  "backup_speed",
  "backup_router",
  "backup_carrier",
  "backup_auto_failover",
  "backup_testing",
  "backup_downtime",
  "restaurant_pos_vendor",
  "restaurant_delivery_apps",
  "restaurant_network_level",
  "restaurant_pos_readiness",
  "restaurant_pos_cutover",
  "restaurant_pos_support",
  "restaurant_qr_menu",
  "restaurant_table_qr",
  "restaurant_loyalty",
  "restaurant_vip",
  "restaurant_reviews",
  "restaurant_guest_wifi_marketing",
  "restaurant_backup_internet",
  "restaurant_monitoring",
  "restaurant_after_hours",
  "restaurant_complete_stack",
];

const NUMBER_KEYS = [
  "location_count",
  "vpn_users",
  "cloud_users",
  "cloud_storage_gb",
  "cloud_growth_percent",
  "cloud_workstations",
  "cloud_servers",
  "cloud_retention_days",
  "monitor_routers",
  "monitor_switches",
  "monitor_access_points",
  "monitor_servers",
  "monitor_critical_devices",
  "monitor_printers",
  "wifi_sqft",
  "wifi_floors",
  "wifi_access_points",
  "wifi_concurrent_devices",
  "restaurant_pos_terminals",
  "restaurant_payment_terminals",
  "restaurant_printers",
  "restaurant_kds",
  "restaurant_access_points",
];

const ARRAY_KEYS = ["services", "backup_critical_systems"];

function cleanString(value, maxLength = 300) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function toArray(value) {
  if (Array.isArray(value)) return value.map((item) => cleanString(item, 120)).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [cleanString(value, 120)].filter(Boolean);
}

function toNumber(value, fallback = 0, min = 0, max = 1000000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function yes(value) {
  return ["yes", "true", "on", "1", "required"].includes(String(value || "").toLowerCase());
}

function normalizeInput(body = {}) {
  const input = {};

  for (const key of STRING_KEYS) {
    input[key] = cleanString(body[key], key === "description" ? 2000 : 300);
  }

  for (const key of NUMBER_KEYS) {
    input[key] = toNumber(body[key], 0);
  }

  for (const key of ARRAY_KEYS) {
    input[key] = toArray(body[key]);
  }

  input.location_count = Math.max(1, Math.round(input.location_count || 1));
  input.vpn_users = Math.round(input.vpn_users || 0);
  input.cloud_users = Math.round(input.cloud_users || 0);
  input.cloud_storage_gb = Math.round(input.cloud_storage_gb || 0);
  input.cloud_workstations = Math.round(input.cloud_workstations || 0);
  input.cloud_servers = Math.round(input.cloud_servers || 0);
  input.monitor_routers = Math.round(input.monitor_routers || 0);
  input.monitor_switches = Math.round(input.monitor_switches || 0);
  input.monitor_access_points = Math.round(input.monitor_access_points || 0);
  input.monitor_servers = Math.round(input.monitor_servers || 0);
  input.monitor_critical_devices = Math.round(input.monitor_critical_devices || 0);
  input.monitor_printers = Math.round(input.monitor_printers || 0);
  input.wifi_access_points = Math.round(input.wifi_access_points || 0);
  input.restaurant_pos_terminals = Math.round(input.restaurant_pos_terminals || 0);
  input.restaurant_payment_terminals = Math.round(input.restaurant_payment_terminals || 0);
  input.restaurant_printers = Math.round(input.restaurant_printers || 0);
  input.restaurant_kds = Math.round(input.restaurant_kds || 0);
  input.restaurant_access_points = Math.round(input.restaurant_access_points || 0);

  input.services = [...new Set(input.services.filter((slug) => allowedServiceSlugs.has(slug)))];
  return input;
}

function validateInput(input) {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const zipPattern = /^\d{5}(?:-\d{4})?$/;

  if (input.customer_name.length < 2) errors.push("Enter your contact name.");
  if (input.business_name.length < 2) errors.push("Enter your business or organization name.");
  if (!emailPattern.test(input.email)) errors.push("Enter a valid email address.");
  if (!allowedBusinessTypes.has(input.business_type)) errors.push("Select a business type.");
  if (input.city.length < 2) errors.push("Enter the service city.");
  if (!zipPattern.test(input.zip_code)) errors.push("Enter a valid five-digit ZIP code.");
  if (input.location_count < 1 || input.location_count > 100) errors.push("Enter a valid location count.");
  if (input.services.length === 0) errors.push("Select at least one service.");
  if (!input.start_timeframe) errors.push("Select a desired start timeframe.");
  if (!input.work_window) errors.push("Select a work window.");
  if (!input.equipment_known) errors.push("Tell us whether the existing equipment is known.");

  if (input.services.includes("managed-vpn")) {
    if (!input.vpn_type) errors.push("Select the VPN type.");
    if (["remote-access", "both"].includes(input.vpn_type) && input.vpn_users < 1) {
      errors.push("Enter the number of VPN users.");
    }
  }

  if (input.services.includes("private-cloud")) {
    if (input.cloud_users < 1) errors.push("Enter the number of private-cloud users.");
    if (input.cloud_storage_gb < 1) errors.push("Enter the required cloud storage in GB.");
  }

  if (input.services.includes("network-monitoring")) {
    const total = monitoredDeviceCount(input);
    if (total < 1) errors.push("Enter at least one device for network monitoring.");
  }

  if (input.services.includes("business-wifi")) {
    if (!input.wifi_coverage) errors.push("Select indoor, outdoor, or combined Wi-Fi coverage.");
    if (input.wifi_floors < 1) errors.push("Enter the number of floors for Wi-Fi service.");
  }

  if (input.services.includes("backup-internet") && !input.backup_type) {
    errors.push("Select a backup internet type.");
  }

  if (input.description.length > 2000) errors.push("The project description is too long.");
  return errors;
}

function extractMoneyNumbers(value) {
  if (!value || value === "—") return [];
  return [...String(value).matchAll(/\$\s*([\d,]+(?:\.\d{1,2})?)/g)].map((match) =>
    Number(match[1].replace(/,/g, "")),
  );
}

function parseRange(value) {
  const numbers = extractMoneyNumbers(value);
  if (numbers.length === 0) return { min: 0, max: 0, custom: /custom/i.test(String(value || "")) };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0], custom: false };
  return {
    min: Math.min(numbers[0], numbers[1]),
    max: Math.max(numbers[0], numbers[1]),
    custom: false,
  };
}

function roundMoney(value, increment = 1) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / increment) * increment;
}

function selectRangeAmount(value, complexity, increment = 25) {
  const range = parseRange(value);
  if (range.custom) return null;
  if (range.min === range.max) return roundMoney(range.min, increment);

  let selected;
  if (complexity === "standard") selected = range.min + (range.max - range.min) / 3;
  else if (complexity === "complex") selected = range.min + ((range.max - range.min) * 2) / 3;
  else selected = range.min + (range.max - range.min) / 2;

  return roundMoney(selected, increment);
}

function firstMoney(value) {
  return extractMoneyNumbers(value)[0] || 0;
}

function getCategory(slug) {
  const category = pricingData.categories.find((item) => item.slug === slug);
  if (!category) throw new Error(`Pricing category not found: ${slug}`);
  return category;
}

function getPlan(categorySlug, serviceName) {
  const category = getCategory(categorySlug);
  const plan = category.plans.find((item) => item.service === serviceName);
  if (!plan) throw new Error(`Pricing plan not found: ${categorySlug} / ${serviceName}`);
  return plan;
}

function determineComplexity(input) {
  let score = 0;
  const reasons = [];

  if (input.location_count > 1) {
    score += input.location_count >= 3 ? 2 : 1;
    reasons.push("Multiple locations");
  }
  if (input.work_window === "after-hours") {
    score += 2;
    reasons.push("After-hours work");
  }
  if (input.equipment_known === "no" || input.equipment_known === "partial") {
    score += 1;
    reasons.push("Existing equipment requires discovery");
  }
  if (["urgent", "within-7-days"].includes(input.start_timeframe)) {
    score += 1;
    reasons.push("Accelerated start timeframe");
  }
  if (yes(input.cloud_migration)) {
    score += 1;
    reasons.push("Existing data migration");
  }
  if (input.wifi_cabling === "no" || input.wifi_cabling === "unknown") {
    score += 1;
    reasons.push("Cabling requires validation");
  }
  if (["outdoor", "both"].includes(input.wifi_coverage)) {
    score += 1;
    reasons.push("Outdoor Wi-Fi coverage");
  }
  if (input.vpn_state === "broken") {
    score += 1;
    reasons.push("Existing VPN requires repair");
  }

  const restaurantSelections = [
    input.restaurant_pos_cutover,
    input.restaurant_qr_menu,
    input.restaurant_table_qr,
    input.restaurant_loyalty,
    input.restaurant_vip,
    input.restaurant_reviews,
    input.restaurant_guest_wifi_marketing,
    input.restaurant_backup_internet,
    input.restaurant_monitoring,
  ].filter(yes).length;

  if (restaurantSelections >= 5) {
    score += 2;
    reasons.push("Several restaurant integrations");
  }

  const level = score === 0 ? "standard" : score <= 2 ? "moderate" : "complex";
  return { level, score, reasons };
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function createLineItem({ serviceSlug, name, setup = 0, monthly = 0, quantity = 1, notes = [], manualReview = false }) {
  return {
    serviceSlug,
    name,
    quantity,
    setup: roundMoney(Number(setup || 0), 1),
    monthly: roundMoney(Number(monthly || 0), 1),
    notes: Array.isArray(notes) ? notes.filter(Boolean) : [String(notes)].filter(Boolean),
    manualReview: Boolean(manualReview),
  };
}

function planLine(categorySlug, serviceName, complexity, options = {}) {
  const plan = getPlan(categorySlug, serviceName);
  const quantity = Math.max(1, Number(options.quantity || 1));
  const rawSetup = selectRangeAmount(plan.setup, complexity);
  const setup = rawSetup === null ? 0 : rawSetup * quantity;
  const monthly = firstMoney(plan.monthly) * quantity;

  return createLineItem({
    serviceSlug: categorySlug,
    name: options.name || plan.service,
    setup,
    monthly,
    quantity,
    notes: options.notes || [],
    manualReview: rawSetup === null || options.manualReview,
  });
}

function addAfterHoursAllowance(lineItems, serviceSlug, requested) {
  if (!requested) return;
  lineItems.push(
    createLineItem({
      serviceSlug,
      name: "After-hours implementation allowance",
      setup: 350,
      monthly: 0,
      notes: ["Includes a two-hour after-hours labor allowance; additional time is billed at the published rate."],
    }),
  );
}

function calculateVpn(input, complexity, warnings) {
  const items = [];
  const users = Math.max(1, input.vpn_users || 1);
  const locations = input.location_count;
  const type = input.vpn_type || "remote-access";

  if (locations >= 3 || type === "multi-site") {
    const plan = getPlan("managed-vpn", "Multi-Site VPN Pro");
    const prices = extractMoneyNumbers(plan.monthly);
    const baseMonthly = prices[0] || 349;
    const remoteSiteMonthly = prices[1] || 99;
    const remoteSites = Math.max(1, locations - 1);
    const setupBase = firstMoney(plan.setup) || 1500;

    items.push(
      createLineItem({
        serviceSlug: "managed-vpn",
        name: "Multi-Site VPN Pro",
        setup: setupBase + Math.max(0, locations - 3) * 250,
        monthly: baseMonthly + remoteSiteMonthly * remoteSites,
        quantity: locations,
        notes: [`Estimated for ${locations} locations and ${remoteSites} remote sites.`],
        manualReview: locations > 8,
      }),
    );
    if (locations > 8) warnings.push("The multi-site VPN design needs manual engineering review.");
  } else if (["site-to-site", "both"].includes(type) && locations >= 2) {
    items.push(planLine("managed-vpn", "Site-to-Site VPN", complexity));
  } else if (users <= 5) {
    items.push(planLine("managed-vpn", "Remote Access VPN Essentials", complexity));
  } else {
    const line = planLine("managed-vpn", "Business Remote Access VPN", complexity);
    if (users > 15) {
      line.monthly += Math.max(0, users - 15) * 7;
      line.notes.push(`Includes an allowance for ${users - 15} users above the 15-user base.`);
    }
    if (users > 25) {
      line.manualReview = true;
      warnings.push("VPN requests above 25 users require final engineering review.");
    }
    items.push(line);
  }

  if (input.vpn_state === "broken") {
    items.push(planLine("managed-vpn", "VPN Health Check / Repair", complexity));
  }
  if (!input.vpn_firewall_brand || /unknown/i.test(input.vpn_firewall_brand)) {
    warnings.push("Firewall compatibility must be verified before the VPN estimate becomes final.");
  }
  addAfterHoursAllowance(items, "managed-vpn", yes(input.vpn_after_hours) || input.work_window === "after-hours");
  return items;
}

function calculateCloud(input, complexity, warnings) {
  const items = [];
  const users = Math.max(1, input.cloud_users);
  const storage = Math.max(1, input.cloud_storage_gb);
  let planName;
  let includedStorage;

  if (users <= 5 && storage <= 500) {
    planName = "Private Cloud Starter";
    includedStorage = 500;
  } else if (users <= 15 && storage <= 1000) {
    planName = "Business Private Cloud";
    includedStorage = 1000;
  } else {
    planName = "Private Cloud Pro";
    includedStorage = 3000;
  }

  const base = planLine("private-cloud", planName, complexity);
  if (users > 25 || storage > 3000) {
    base.manualReview = true;
    warnings.push("Private-cloud requirements above 25 users or 3 TB require final architecture review.");
  }
  items.push(base);

  const extraStorageGb = Math.max(0, storage - includedStorage);
  if (extraStorageGb > 0) {
    const extraTb = Math.ceil(extraStorageGb / 1024);
    const plan = getPlan("private-cloud", "Additional Storage");
    items.push(
      createLineItem({
        serviceSlug: "private-cloud",
        name: "Additional Storage",
        setup: 0,
        monthly: firstMoney(plan.monthly) * extraTb,
        quantity: extraTb,
        notes: [`${extraTb} additional TB estimated.`],
      }),
    );
  }

  if (input.cloud_workstations > 0) {
    const plan = getPlan("private-cloud", "Workstation Backup");
    items.push(
      createLineItem({
        serviceSlug: "private-cloud",
        name: "Workstation Backup",
        setup: firstMoney(plan.setup) * input.cloud_workstations,
        monthly: firstMoney(plan.monthly) * input.cloud_workstations,
        quantity: input.cloud_workstations,
      }),
    );
  }

  if (input.cloud_servers > 0) {
    const plan = getPlan("private-cloud", "Server Backup");
    items.push(
      createLineItem({
        serviceSlug: "private-cloud",
        name: "Server Backup",
        setup: firstMoney(plan.setup) * input.cloud_servers,
        monthly: firstMoney(plan.monthly) * input.cloud_servers,
        quantity: input.cloud_servers,
      }),
    );
  }

  if (yes(input.cloud_managed_backup)) {
    items.push(planLine("private-cloud", "Managed Cloud Backup Add-On", complexity));
  }
  if (yes(input.cloud_migration)) warnings.push("Migration timing and source-data condition require verification.");
  return items;
}

function monitoredDeviceCount(input) {
  return (
    input.monitor_routers +
    input.monitor_switches +
    input.monitor_access_points +
    input.monitor_servers +
    input.monitor_critical_devices +
    input.monitor_printers
  );
}

function calculateMonitoring(input, complexity, warnings) {
  const items = [];
  const total = monitoredDeviceCount(input);
  let planName;
  let included;

  if (total <= 5 && input.monitor_alerting !== "24-7" && input.monitor_response !== "priority") {
    planName = "Uptime Monitoring Lite";
    included = 5;
  } else if (total <= 15 && input.monitor_response !== "priority") {
    planName = "Network Watch Pro";
    included = 15;
  } else {
    planName = "NOC Monitoring Plus";
    included = 30;
  }

  const base = planLine("network-monitoring", planName, complexity);
  base.notes.push(`${total} monitored devices entered.`);
  items.push(base);

  if (total > included) {
    const extra = total - included;
    const plan = getPlan("network-monitoring", "Additional Monitored Device");
    const range = parseRange(plan.monthly);
    const perDevice = roundMoney((range.min + range.max) / 2, 1) || 12;
    items.push(
      createLineItem({
        serviceSlug: "network-monitoring",
        name: "Additional Monitored Devices",
        setup: 0,
        monthly: extra * perDevice,
        quantity: extra,
      }),
    );
  }

  if (total > 30) {
    items[0].manualReview = true;
    warnings.push("Monitoring more than 30 devices requires final NOC scope review.");
  }
  if (input.monitor_alert_method === "sms") {
    warnings.push("SMS messaging or carrier costs may be billed separately.");
  }
  return items;
}

function calculateWifi(input, complexity, warnings) {
  const items = [];
  const locations = input.location_count;
  const accessPoints = input.wifi_access_points;
  const unknownApCount = accessPoints < 1;
  const highDensity =
    accessPoints > 5 ||
    input.wifi_concurrent_devices > 50 ||
    ["outdoor", "both"].includes(input.wifi_coverage);

  if (unknownApCount) {
    items.push(planLine("business-wifi", "Wi-Fi Site Survey", complexity, { quantity: locations }));
    warnings.push("Access-point quantity is pending a site survey.");
  }

  if (highDensity) {
    const plan = getPlan("business-wifi", "Multi-Zone / High-Density Wi-Fi");
    items.push(
      createLineItem({
        serviceSlug: "business-wifi",
        name: plan.service,
        setup: 0,
        monthly: firstMoney(plan.monthly) * locations,
        quantity: locations,
        notes: ["Installation pricing is pending RF/site validation."],
        manualReview: true,
      }),
    );
    warnings.push("High-density or outdoor Wi-Fi installation requires a site survey before final setup pricing.");
  } else if (accessPoints <= 2) {
    items.push(planLine("business-wifi", "Managed Wi-Fi Essentials", complexity, { quantity: locations }));
  } else {
    items.push(planLine("business-wifi", "Managed Wi-Fi Pro", complexity, { quantity: locations }));
  }

  if (yes(input.wifi_portal)) {
    items.push(planLine("business-wifi", "Guest Wi-Fi Portal / QR Access", complexity, { quantity: locations }));
  }
  if (["no", "unknown"].includes(input.wifi_cabling)) {
    warnings.push("Cabling is excluded and must be validated onsite.");
  }
  return items;
}

function calculateBackupInternet(input, complexity, warnings) {
  const items = [];
  const locations = input.location_count;
  let planName;

  const continuityRequested =
    input.backup_type === "continuity" ||
    (yes(input.backup_auto_failover) && yes(input.backup_testing) && input.backup_critical_systems.length >= 2);

  if (continuityRequested) planName = "Business Continuity Internet Package";
  else if (input.backup_type === "dual-isp") planName = "Dual ISP Failover Management";
  else if (input.backup_type === "5g") planName = "5G Backup Internet Pro";
  else planName = "LTE Backup Internet Setup";

  items.push(planLine("backup-internet", planName, complexity, { quantity: locations }));

  if (yes(input.backup_testing) && planName === "LTE Backup Internet Setup") {
    items.push(planLine("backup-internet", "Monthly Failover Test", complexity, { quantity: locations }));
  }
  if (input.backup_type === "unsure") {
    items[0].manualReview = true;
    warnings.push("The backup connection type must be selected after coverage and carrier review.");
  }
  if (input.backup_carrier !== "yes") {
    warnings.push("Carrier service and data-plan charges are not included.");
  }
  return items;
}

function calculateRestaurant(input, complexity, warnings, selectedServices) {
  const items = [];
  const locations = input.location_count;

  if (yes(input.restaurant_complete_stack)) {
    items.push(
      planLine("restaurant-technology", "Complete Restaurant Technology Stack", complexity, {
        quantity: locations,
        manualReview: locations > 1,
      }),
    );
    if (locations > 1) warnings.push("The complete restaurant stack requires a location-by-location verification.");
    addAfterHoursAllowance(items, "restaurant-technology", yes(input.restaurant_after_hours));
    return items;
  }

  if (input.restaurant_network_level === "health-check") {
    items.push(planLine("restaurant-technology", "Restaurant Technology Health Check", complexity, { quantity: locations }));
  } else if (input.restaurant_network_level === "essentials") {
    items.push(planLine("restaurant-technology", "Restaurant Network Essentials", complexity, { quantity: locations }));
  } else if (input.restaurant_network_level === "uptime") {
    items.push(planLine("restaurant-technology", "Restaurant Uptime Pro", complexity, { quantity: locations }));
  }

  const optionalPlans = [
    [input.restaurant_pos_readiness, "POS Network Readiness Assessment"],
    [input.restaurant_pos_cutover, "POS Integration / Cutover Support"],
    [input.restaurant_pos_support, "Monthly POS Support Add-On"],
    [input.restaurant_qr_menu, "QR Menu / Digital Menu Programming"],
    [input.restaurant_table_qr, "Table QR Experience"],
    [input.restaurant_reviews, "Review Generation System"],
    [yes(input.restaurant_vip) || yes(input.restaurant_loyalty) ? "yes" : "no", "Birthday Club / VIP Club"],
    [input.restaurant_guest_wifi_marketing, "Guest Wi-Fi Marketing"],
    [input.restaurant_monitoring, "Restaurant Monitoring Pro"],
  ];

  for (const [selected, planName] of optionalPlans) {
    if (yes(selected)) {
      items.push(planLine("restaurant-technology", planName, complexity, { quantity: locations }));
    }
  }

  if (input.restaurant_delivery_apps) {
    const appCount = input.restaurant_delivery_apps
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean).length;
    if (appCount > 0 && !yes(input.restaurant_pos_cutover)) {
      const allowance = planLine("restaurant-technology", "POS Integration / Cutover Support", complexity, {
        quantity: locations,
        name: "Delivery App Integration Allowance",
        notes: [`Estimated for ${appCount} delivery platform${appCount === 1 ? "" : "s"}.`],
        manualReview: appCount > 2,
      });
      items.push(allowance);
      if (appCount > 2) warnings.push("Three or more delivery integrations require vendor review.");
    }
  }

  if (yes(input.restaurant_backup_internet) && !selectedServices.includes("backup-internet")) {
    items.push(
      planLine("backup-internet", "LTE Backup Internet Setup", complexity, {
        quantity: locations,
        name: "Restaurant Backup Internet",
        notes: ["Carrier service is separate."],
      }),
    );
  }

  if (!input.restaurant_pos_vendor || /other|unknown/i.test(input.restaurant_pos_vendor)) {
    warnings.push("POS vendor compatibility requires final verification.");
  }
  addAfterHoursAllowance(items, "restaurant-technology", yes(input.restaurant_after_hours));
  return items;
}

function calculateEstimate(rawInput) {
  const input = normalizeInput(rawInput);
  const errors = validateInput(input);
  if (errors.length > 0) {
    const error = new Error("Estimate input validation failed.");
    error.validationErrors = errors;
    throw error;
  }

  const complexity = determineComplexity(input);
  const warnings = [];
  const lineItems = [];

  for (const service of input.services) {
    if (service === "managed-vpn") lineItems.push(...calculateVpn(input, complexity.level, warnings));
    if (service === "private-cloud") lineItems.push(...calculateCloud(input, complexity.level, warnings));
    if (service === "network-monitoring") lineItems.push(...calculateMonitoring(input, complexity.level, warnings));
    if (service === "business-wifi") lineItems.push(...calculateWifi(input, complexity.level, warnings));
    if (service === "backup-internet") lineItems.push(...calculateBackupInternet(input, complexity.level, warnings));
    if (service === "restaurant-technology") {
      lineItems.push(...calculateRestaurant(input, complexity.level, warnings, input.services));
    }
  }

  const setupTotal = lineItems.reduce((sum, item) => sum + item.setup, 0);
  const monthlyTotal = lineItems.reduce((sum, item) => sum + item.monthly, 0);
  const manualReview = lineItems.some((item) => item.manualReview) || warnings.length > 0;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + estimateValidityDays * 24 * 60 * 60 * 1000);

  const assumptions = [
    "This is a non-binding estimate pending final scope and technical verification.",
    "Hardware, carrier service, cabling, permits, and third-party subscriptions are excluded unless listed.",
    "Published monthly service assumes standard business-hours support unless stated otherwise.",
    "The estimate is valid for 14 days.",
  ];

  return {
    input,
    lineItems,
    setupTotal,
    monthlyTotal,
    complexityLevel: manualReview && complexity.level === "standard" ? "moderate" : complexity.level,
    complexityReasons: complexity.reasons,
    manualReview,
    warnings: [...new Set(warnings)],
    assumptions,
    createdAt,
    expiresAt,
  };
}

function encodePayload(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodePayload(value) {
  if (!value || typeof value !== "string" || value.length > 100000) {
    throw new Error("Invalid estimate payload.");
  }
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

module.exports = {
  normalizeInput,
  validateInput,
  calculateEstimate,
  formatMoney,
  encodePayload,
  decodePayload,
  monitoredDeviceCount,
};
