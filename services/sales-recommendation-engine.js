"use strict";

const { cards, cardById, pricing } = require("../data/sales-playbook");

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function asNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function has(list, value) {
  return asArray(list).includes(value);
}

function yes(value) {
  return String(value || "").toLowerCase() === "yes";
}

function unknown(value) {
  return !value || ["unknown", "unsure", "partial"].includes(String(value).toLowerCase());
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeCardAnswers(cardId, body) {
  const card = cardById.get(Number(cardId));
  if (!card) throw new Error(`Unknown sales card: ${cardId}`);

  const normalized = {};

  for (const question of card.questions) {
    const raw = body[question.name];

    if (question.type === "checkbox-group") {
      normalized[question.name] = asArray(raw).map((value) => String(value).trim()).filter(Boolean);
      continue;
    }

    if (question.type === "number") {
      normalized[question.name] = raw === "" || raw === undefined ? null : asNumber(raw);
      continue;
    }

    if (question.type === "checkbox") {
      normalized[question.name] = raw === "on" || raw === "true" || raw === true;
      continue;
    }

    normalized[question.name] = typeof raw === "string" ? raw.trim() : raw || "";
  }

  return normalized;
}

function calculateMonitoredDevices(answers) {
  const explicit = [
    "scope_edge_devices",
    "scope_switches",
    "scope_access_points",
    "scope_compute",
    "scope_operations",
    "scope_site_systems",
  ].reduce((total, key) => total + asNumber(answers[key]), 0);

  if (explicit > 0) return explicit;

  return [
    "monitor_firewalls",
    "monitor_switches",
    "monitor_access_points",
    "monitor_servers",
    "monitor_pos_devices",
    "monitor_printers_kds",
    "monitor_other_devices",
  ].reduce((total, key) => total + asNumber(answers[key]), 0);
}

function deriveSignals(answers) {
  const requested = asArray(answers.requested_pillars);
  const needs = asArray(answers.service_needs);
  const systems = asArray(answers.affected_systems);
  const impact = asArray(answers.business_impact);

  let readyConnect = 0;
  let readyUptime = 0;
  let readyOps = 0;

  if (requested.includes("readyconnect")) readyConnect += 5;
  if (requested.includes("readyuptime")) readyUptime += 5;
  if (requested.includes("readyops")) readyOps += 5;

  if (["wifi", "remote-access", "new-site", "expansion"].includes(answers.primary_problem)) readyConnect += 4;
  if (["internet-outage", "monitoring", "backup", "vendor-confusion"].includes(answers.primary_problem)) readyUptime += 4;
  if (["pos-payments", "restaurant-ops"].includes(answers.primary_problem)) {
    readyUptime += 3;
    readyOps += 4;
  }

  for (const need of needs) {
    if (["network-build", "business-wifi", "vpn", "segmentation"].includes(need)) readyConnect += 2;
    if (["monitoring", "backup-internet", "managed-backup"].includes(need)) readyUptime += 2;
    if (["pos", "restaurant-tools", "vendor-coordination"].includes(need)) readyOps += 2;
  }

  if (systems.some((item) => ["internet", "wifi", "remote-access"].includes(item))) readyConnect += 2;
  if (systems.some((item) => ["pos", "payments", "online-orders", "cloud-apps", "phones", "printers-kds"].includes(item))) readyUptime += 2;
  if (systems.some((item) => ["pos", "payments", "online-orders", "printers-kds"].includes(item))) readyOps += 2;

  if (answers.business_type === "restaurant") readyOps += 6;
  if (yes(answers.dead_zones) || asNumber(answers.access_point_count) > 0) readyConnect += 2;
  if (asNumber(answers.vpn_users) > 0 || asNumber(answers.vpn_sites) > 0) readyConnect += 2;
  if (asNumber(answers.monitor_pos_devices) > 0 || asNumber(answers.monitor_firewalls) > 0) readyUptime += 2;
  if (answers.internet_outage_history && answers.internet_outage_history !== "none") readyUptime += 2;
  if (["none", "unknown"].includes(answers.backup_internet_current)) readyUptime += 1;
  if (impact.includes("lost-revenue") || impact.includes("payments-stop")) readyUptime += 3;

  return {
    readyConnect,
    readyUptime,
    readyOps,
  };
}

function calculateLeadScore(answers) {
  let score = 0;
  const impact = asArray(answers.business_impact);
  const outOfModel = asArray(answers.out_of_model_needs);

  if (
    impact.some((item) => ["lost-revenue", "payments-stop", "staff-stop", "opening-delay"].includes(item)) ||
    ["internet-outage", "pos-payments", "new-site", "expansion"].includes(answers.primary_problem)
  ) {
    score += 1;
  }

  if (["sole", "shared"].includes(answers.decision_authority)) score += 1;

  const inModelBusiness = ["restaurant", "retail", "service", "professional", "construction", "nonprofit", "warehouse"].includes(
    answers.business_type,
  );
  const noHardDisqualifier = !outOfModel.some((item) =>
    ["enterprise-24x7", "custom-software", "self-hosted-cloud"].includes(item),
  );
  if (inModelBusiness && noHardDisqualifier) score += 1;

  if (["approved", "likely"].includes(answers.assessment_budget) || ["2000-5000", "5000-15000", "over-15000"].includes(answers.budget_range)) {
    score += 1;
  }

  if (["yes", "maybe"].includes(answers.recurring_interest)) score += 1;

  return Math.min(score, 5);
}

function calculateBusinessImpactScore(answers) {
  let score = 0;
  const impact = asArray(answers.business_impact);

  const impactWeights = {
    "lost-revenue": 24,
    "payments-stop": 24,
    "staff-stop": 16,
    "opening-delay": 16,
    "customer-experience": 10,
    "remote-work": 8,
    "security-risk": 12,
    "vendor-delays": 6,
  };

  for (const item of impact) score += impactWeights[item] || 0;

  const frequencyWeights = {
    current: 18,
    daily: 16,
    weekly: 12,
    monthly: 7,
    rare: 3,
    planned: 2,
  };
  score += frequencyWeights[answers.problem_frequency] || 0;

  const toleranceWeights = {
    "under-15": 18,
    "15-60": 14,
    "1-4-hours": 8,
    "one-day": 3,
    flexible: 0,
    unknown: 4,
  };
  score += toleranceWeights[answers.downtime_tolerance] || 0;

  const lossWeights = {
    "over-5000": 20,
    "2000-5000": 16,
    "500-2000": 10,
    "under-500": 4,
    unknown: 2,
  };
  score += lossWeights[answers.estimated_hourly_loss] || 0;

  return Math.min(score, 100);
}

function evaluateSurveyAndEngineering(answers, monitoredDevices) {
  const surveyReasons = [];
  const engineeringReasons = [];

  const explicitSurvey = asArray(answers.site_survey_triggers).filter((item) => item !== "none");
  const explicitEngineering = asArray(answers.engineering_triggers).filter((item) => item !== "none");

  const surveyLabels = {
    "unknown-cabling": "Existing cabling is unknown or questionable",
    "outdoor-coverage": "Outdoor, warehouse, patio, or difficult coverage is involved",
    "multiple-floors": "Multiple floors or unusual construction must be surveyed",
    "dead-zones": "Recurring dead zones or interference must be verified",
    "new-build": "A build, remodel, move, or relocation is involved",
    "rack-power": "Rack, power, cooling, or mounting may be inadequate",
    "pos-placement": "POS, printer, or KDS placement is changing",
  };

  const engineeringLabels = {
    "multi-site-vpn": "Three or more VPN sites or complex routing",
    "over-20-devices": "More than 20 monitored devices",
    "over-5-aps": "More than five APs, high density, or advanced roaming",
    "complex-carriers": "Multiple carriers or unusual failover design",
    legacy: "Legacy or unsupported equipment",
    "complex-migration": "Complex migration or recovery objectives",
    compliance: "Regulated or contractual compliance claims",
    "custom-integration": "Custom integrations, scripts, or unsupported APIs",
    guarantee: "Guarantees, penalties, or staffed 24/7 response requested",
  };

  for (const item of explicitSurvey) surveyReasons.push(surveyLabels[item] || item);
  for (const item of explicitEngineering) engineeringReasons.push(engineeringLabels[item] || item);

  if (answers.cabling_known === "no" || answers.cabling_known === "unknown") surveyReasons.push("Cabling status is not verified");
  if (answers.wifi_areas === "outdoor" || answers.wifi_areas === "both") surveyReasons.push("Outdoor Wi-Fi coverage is required");
  if (asNumber(answers.wifi_floors) > 1) surveyReasons.push("Multiple floors are involved");
  if (yes(answers.dead_zones)) surveyReasons.push("Dead zones or roaming issues were reported");
  if (has(answers.buying_triggers, "new-location") || has(answers.buying_triggers, "move-remodel")) surveyReasons.push("New location, remodel, or move requires validation");

  if (asNumber(answers.vpn_sites) >= 3) engineeringReasons.push("Three or more VPN sites require engineering review");
  if (monitoredDevices > 20) engineeringReasons.push(`Monitored device count is ${monitoredDevices}, above the standard 20-device starting scope`);
  if (Math.max(asNumber(answers.access_point_count), asNumber(answers.scope_access_points)) > 5) engineeringReasons.push("More than five access points are involved");
  if (answers.firewall_supported === "no" || answers.unsupported_equipment === "yes") engineeringReasons.push("Unsupported or legacy equipment is known");
  if (answers.business_type === "healthcare" || has(answers.out_of_model_needs, "healthcare-compliance")) engineeringReasons.push("Healthcare or regulated compliance is involved");
  if (has(answers.out_of_model_needs, "enterprise-24x7")) engineeringReasons.push("Staffed 24/7 support was requested");
  if (yes(answers.overnight_cutover)) engineeringReasons.push("An overnight POS cutover is required");

  return {
    surveyRequired: surveyReasons.length > 0,
    surveyReasons: unique(surveyReasons),
    engineeringRequired: engineeringReasons.length > 0,
    engineeringReasons: unique(engineeringReasons),
  };
}

function territoryFor(answers) {
  if (["Austin", "Manor"].includes(answers.city)) {
    return {
      label: "Core onsite zone",
      summary: "Austin–Manor supports routine assessments, installations, normal onsite pricing, and faster field response.",
    };
  }

  if (answers.city === "Houston") {
    return {
      label: "Extended service zone",
      summary: "Houston is positioned for remote monitoring, scheduled project days, travel charges when applicable, and coordinated field partners.",
    };
  }

  return {
    label: "Outside standard zone",
    summary: "Confirm travel, remote-delivery feasibility, or a qualified field partner before committing to onsite work.",
  };
}

function fitLabel(score) {
  if (score >= 4) return "Strong fit";
  if (score >= 2) return "Qualify carefully";
  return "Low fit / do not overinvest";
}

function offerCatalog() {
  return [
    {
      id: "assessment",
      title: "ReadyTech Uptime Assessment",
      price: pricing.assessment,
      recurring: false,
      baseReason: "Verify the environment and convert unknowns into Good, Better, and Best options.",
    },
    {
      id: "foundation",
      title: "ReadyConnect Foundation",
      price: pricing.foundation,
      recurring: false,
      baseReason: "Build or clean up the network foundation before ongoing monitoring.",
    },
    {
      id: "uptime",
      title: "ReadyUptime Managed",
      price: pricing.uptime,
      recurring: true,
      baseReason: "Provide essential monitoring, alerts, monthly health reporting, and vendor coordination.",
    },
    {
      id: "continuity",
      title: "ReadyContinuity Pro",
      price: pricing.continuity,
      recurring: true,
      baseReason: "Protect revenue-critical operations with broader monitoring, failover management, and priority response.",
    },
    {
      id: "restaurant",
      title: "Restaurant Operations Add-on",
      price: pricing.restaurantAddOn,
      recurring: true,
      baseReason: "Add POS, printer/KDS, delivery-app, guest Wi-Fi, QR, loyalty, and restaurant-vendor coordination.",
    },
  ];
}

function buildOfferScores(answers, signals, impactScore, monitoredDevices, survey, engineering) {
  const scores = {
    assessment: 0,
    foundation: signals.readyConnect,
    uptime: signals.readyUptime,
    continuity: signals.readyUptime,
    restaurant: signals.readyOps,
  };
  const reasons = {
    assessment: [],
    foundation: [],
    uptime: [],
    continuity: [],
    restaurant: [],
  };

  const unknownEnvironment =
    unknown(answers.firewall_supported) ||
    unknown(answers.cabling_known) ||
    answers.network_documentation === "no" ||
    answers.network_documentation === "unknown" ||
    answers.assumptions_verified === "no" ||
    answers.assumptions_verified === "partial";

  if (unknownEnvironment) {
    scores.assessment += 6;
    reasons.assessment.push("Important equipment, cabling, documentation, or estimate assumptions remain unverified");
  }
  if (survey.surveyRequired) {
    scores.assessment += 6;
    reasons.assessment.push("A site survey is required before final scope");
  }
  if (engineering.engineeringRequired) {
    scores.assessment += 7;
    reasons.assessment.push("Engineering review is required before final commitments");
  }
  if (answers.primary_problem && answers.primary_problem !== "planned") {
    scores.assessment += 1;
  }

  if (signals.readyConnect >= 4) reasons.foundation.push("Network, Wi-Fi, VPN, or segmentation needs are central to the opportunity");
  if (has(answers.buying_triggers, "new-location") || has(answers.buying_triggers, "move-remodel") || has(answers.buying_triggers, "expansion")) {
    scores.foundation += 4;
    reasons.foundation.push("A new location, move, remodel, or expansion needs a documented foundation");
  }
  if (yes(answers.dead_zones) || answers.primary_problem === "wifi") {
    scores.foundation += 2;
    reasons.foundation.push("Wi-Fi coverage or stability issues require corrective design and configuration");
  }

  if (monitoredDevices > 0 && monitoredDevices <= 10) {
    scores.uptime += 3;
    reasons.uptime.push(`The current ${monitoredDevices}-device scope fits the ReadyUptime Managed starting tier`);
  }
  if (answers.recurring_interest === "yes" || answers.recurring_interest === "maybe") {
    scores.uptime += 2;
    scores.continuity += 2;
    reasons.uptime.push("The customer expressed interest in ongoing monitoring or support");
  }

  if (impactScore >= 45) {
    scores.continuity += 7;
    reasons.continuity.push("Business interruption has meaningful revenue or operational impact");
  }
  if (monitoredDevices > 10 && monitoredDevices <= 20) {
    scores.continuity += 4;
    reasons.continuity.push(`The ${monitoredDevices}-device scope fits the ReadyContinuity Pro starting tier`);
  }
  if (answers.backup_internet_current === "none" || answers.backup_internet_current === "unknown" || answers.auto_failover === "no") {
    scores.continuity += 3;
    reasons.continuity.push("Backup internet or automatic failover is missing or unverified");
  }
  if (["never", "over-90", "unknown"].includes(answers.failover_testing)) {
    scores.continuity += 2;
    reasons.continuity.push("Failover is not being tested on a reliable schedule");
  }
  if (answers.response_priority === "priority") {
    scores.continuity += 2;
    reasons.continuity.push("The customer needs priority business-hours response");
  }

  if (answers.business_type === "restaurant") {
    scores.restaurant += 5;
    reasons.restaurant.push("The customer is a restaurant or food-service operator");
  }
  const restaurantDependencies =
    asNumber(answers.pos_terminals) +
    asNumber(answers.payment_terminals) +
    asNumber(answers.kitchen_printers) +
    asNumber(answers.kds_screens);
  if (restaurantDependencies > 0) {
    scores.restaurant += 4;
    reasons.restaurant.push(`${restaurantDependencies} POS, payment, printer, or KDS dependencies were identified`);
  }
  if (asArray(answers.delivery_apps).length > 0 || yes(answers.guest_wifi) || yes(answers.qr_menu) || yes(answers.loyalty_program)) {
    scores.restaurant += 3;
    reasons.restaurant.push("Delivery, guest Wi-Fi, QR, or loyalty workflows depend on connectivity");
  }

  return { scores, reasons };
}

function objectionGuidance(objection, primaryRecommendation) {
  const guidance = {
    price:
      "Return to the cost of downtime and the Good/Better/Best options. Do not immediately discount recurring service; credit the assessment when appropriate.",
    timing:
      "Connect the recommendation to the customer’s deadline or buying trigger and agree on a dated next action.",
    scope:
      "Use the Uptime Assessment to verify unknowns and narrow the scope rather than guessing.",
    authority:
      "Identify the approver, give the contact a concise business-impact summary, and schedule a meeting with all decision-makers.",
    competitor:
      "Differentiate on installation plus monitoring, vendor coordination, documentation, and business-uptime ownership.",
    trust:
      "Use the paid assessment, documented findings, clear exclusions, and three-option proposal to reduce risk for the customer.",
    none: `Ask directly whether the customer wants to proceed with ${primaryRecommendation.title}.`,
  };
  return guidance[objection] || guidance.none;
}

function missingInformation(answers, survey, engineering) {
  const missing = [];
  const requiredPairs = [
    ["decision_authority", "Decision authority"],
    ["budget_range", "Budget range"],
    ["urgency", "Timeline / urgency"],
    ["current_support", "Current support owner"],
    ["customer_status", "Customer status"],
    ["next_action", "Specific next action"],
  ];

  for (const [key, label] of requiredPairs) {
    if (!answers[key] || answers[key] === "unknown") missing.push(label);
  }

  if (survey.surveyRequired && !answers.scope_assumptions) missing.push("Site-survey assumptions and unknowns");
  if (engineering.engineeringRequired && !answers.engineering_questions) missing.push("Exact engineering-review questions");
  if (answers.business_type === "restaurant" && !answers.pos_vendor) missing.push("Restaurant POS vendor");

  return unique(missing);
}

function nextStepDecision(answers, leadScore, survey, engineering) {
  const outOfModel = asArray(answers.out_of_model_needs);
  const hardOutside =
    answers.customer_status === "outside" ||
    outOfModel.some((item) => ["custom-software", "self-hosted-cloud", "enterprise-24x7"].includes(item));

  if (hardOutside || leadScore <= 1) {
    return {
      code: "refer-or-decline",
      title: "Refer or close politely",
      reason: "The opportunity is outside the current ReadyTech model or lacks enough fit to justify additional sales effort.",
      actions: ["Document the reason", "Offer an appropriate referral when available", "Close the opportunity with a dated status"],
    };
  }

  if (engineering.engineeringRequired || answers.customer_status === "engineering") {
    return {
      code: "assessment-engineering",
      title: "Book the Uptime Assessment and engineering review",
      reason: "Complexity or risk exceeds the standard catalog and must be technically validated before final pricing or promises.",
      actions: ["Collect the $349 assessment", "Prepare the engineering escalation packet", "Schedule site verification", "Do not promise final compatibility or resolution time"],
    };
  }

  if (survey.surveyRequired || answers.customer_status === "assessment" || answers.assumptions_verified !== "yes") {
    return {
      code: "book-assessment",
      title: "Book the $349 Uptime Assessment",
      reason: "The assessment converts site and equipment unknowns into a verified Good/Better/Best proposal.",
      actions: ["Schedule the assessment", "Confirm decision-makers", "Collect the assessment fee", "Document the customer’s success criteria"],
    };
  }

  if (["nurture", "declined"].includes(answers.customer_status) || !["sole", "shared"].includes(answers.decision_authority)) {
    return {
      code: "nurture",
      title: "Set a dated follow-up",
      reason: "The customer is not yet ready or the decision process is incomplete.",
      actions: ["Record the objection or blocker", "Identify the decision-maker", "Set a specific follow-up date", "Do not leave the estimate in an undefined status"],
    };
  }

  return {
    code: "prepare-proposal",
    title: "Prepare and present the Good/Better/Best proposal",
    reason: "The environment is sufficiently understood and the opportunity is ready to advance toward agreement and payment.",
    actions: ["Confirm the recommended option", "Issue the signed scope", "Collect 50% labor deposit and 100% hardware payment", "Schedule only after payment and access requirements are complete"],
  };
}

function buildGoodBetterBest(primarySolution, restaurantRelevant) {
  const good = {
    name: "Good",
    purpose: "Fix the immediate problem",
    recommendation: primarySolution.id === "foundation" ? "ReadyConnect Foundation or limited corrective project" : "Targeted corrective project after verification",
    price: primarySolution.id === "foundation" ? pricing.foundation : "Final project price after assessment",
  };

  const better = {
    name: "Better",
    purpose: "Fix and monitor",
    recommendation: "Corrective project plus ReadyUptime Managed",
    price: `${pricing.uptime} plus project setup`,
  };

  const best = {
    name: "Best",
    purpose: "Fix, monitor, and protect continuity",
    recommendation: restaurantRelevant
      ? "ReadyContinuity Pro plus Restaurant Operations Add-on"
      : "ReadyContinuity Pro with backup internet / failover as required",
    price: restaurantRelevant ? `Typical starting total ${pricing.restaurantTypical}` : pricing.continuity,
  };

  return [good, better, best];
}

function getWorkflowSequence(answers = {}) {
  const signals = deriveSignals(answers);
  const sequence = [1, 2, 3, 4, 5];

  const noSignal = signals.readyConnect === 0 && signals.readyUptime === 0 && signals.readyOps === 0;
  const includeConnect = signals.readyConnect > 0 || noSignal;
  const includeUptime = signals.readyUptime > 0 || noSignal;
  const includeOps = signals.readyOps > 0 || answers.business_type === "restaurant";

  if (includeConnect) sequence.push(6);
  if (includeUptime) sequence.push(7);
  if (includeOps) sequence.push(8);

  sequence.push(9, 10, 11, 12);
  return sequence;
}

function getNextCardId(currentCardId, answers = {}) {
  const sequence = getWorkflowSequence(answers);
  const index = sequence.indexOf(Number(currentCardId));
  if (index === -1) return sequence[0];
  return sequence[index + 1] || null;
}

function getPreviousCardId(currentCardId, answers = {}) {
  const visited = asArray(answers.__visitedCards).map(Number).filter(Number.isFinite);
  const current = Number(currentCardId);
  const currentIndex = visited.lastIndexOf(current);
  if (currentIndex > 0) return visited[currentIndex - 1];

  const sequence = getWorkflowSequence(answers);
  const sequenceIndex = sequence.indexOf(current);
  return sequenceIndex > 0 ? sequence[sequenceIndex - 1] : null;
}

function analyzeSalesConsultation(answers = {}) {
  const signals = deriveSignals(answers);
  const leadScore = calculateLeadScore(answers);
  const impactScore = calculateBusinessImpactScore(answers);
  const monitoredDevices = calculateMonitoredDevices(answers);
  const surveyEngineering = evaluateSurveyAndEngineering(answers, monitoredDevices);
  const territory = territoryFor(answers);
  const { scores, reasons } = buildOfferScores(
    answers,
    signals,
    impactScore,
    monitoredDevices,
    surveyEngineering,
    surveyEngineering,
  );

  const offers = offerCatalog().map((offer) => ({
    ...offer,
    score: scores[offer.id] || 0,
    reasons: unique(reasons[offer.id] || []),
  }));

  const overrideMap = {
    assessment: "assessment",
    foundation: "foundation",
    uptime: "uptime",
    continuity: "continuity",
    restaurant: "restaurant",
  };

  const nonAssessment = offers.filter((offer) => offer.id !== "assessment").sort((a, b) => b.score - a.score);
  let primarySolution = nonAssessment[0] || offers.find((offer) => offer.id === "uptime");

  if (answers.sales_recommendation_override && answers.sales_recommendation_override !== "app") {
    const overrideId = overrideMap[answers.sales_recommendation_override];
    const overridden = offers.find((offer) => offer.id === overrideId);
    if (overridden) primarySolution = overridden;
  }

  const assessmentOffer = offers.find((offer) => offer.id === "assessment");
  const restaurantOffer = offers.find((offer) => offer.id === "restaurant");
  const entryOffer =
    surveyEngineering.surveyRequired ||
    surveyEngineering.engineeringRequired ||
    answers.assumptions_verified !== "yes" ||
    assessmentOffer.score >= primarySolution.score
      ? assessmentOffer
      : primarySolution;

  const recommendationReasons = unique([
    ...primarySolution.reasons,
    ...(impactScore >= 45 ? ["Downtime has meaningful business impact"] : []),
    ...(monitoredDevices > 0 ? [`${monitoredDevices} monitored infrastructure or critical devices were counted`] : []),
  ]);

  if (recommendationReasons.length === 0) recommendationReasons.push(primarySolution.baseReason);

  const nextStep = nextStepDecision(answers, leadScore, surveyEngineering, surveyEngineering);
  const restaurantRelevant = answers.business_type === "restaurant" || signals.readyOps >= 4;
  const goodBetterBest = buildGoodBetterBest(primarySolution, restaurantRelevant);
  const missing = missingInformation(answers, surveyEngineering, surveyEngineering);

  const crossSells = [];
  if (primarySolution.id === "foundation") crossSells.push("ReadyUptime Managed after installation");
  if (["uptime", "foundation"].includes(primarySolution.id) && impactScore >= 45) crossSells.push("ReadyContinuity Pro and backup internet");
  if (restaurantRelevant && primarySolution.id !== "restaurant") crossSells.push("Restaurant Operations Add-on");
  if (["none", "unknown"].includes(answers.backup_internet_current)) crossSells.push("Backup internet and managed failover testing");

  const talkTrack = `Because ${recommendationReasons[0].toLowerCase()}, ReadyTech should recommend ${primarySolution.title}. ${primarySolution.baseReason}`;

  return {
    generatedAt: new Date().toISOString(),
    leadScore,
    leadFit: fitLabel(leadScore),
    impactScore,
    impactLevel: impactScore >= 65 ? "High" : impactScore >= 35 ? "Moderate" : "Low",
    territory,
    signals,
    monitoredDevices,
    surveyRequired: surveyEngineering.surveyRequired,
    surveyReasons: surveyEngineering.surveyReasons,
    engineeringRequired: surveyEngineering.engineeringRequired,
    engineeringReasons: surveyEngineering.engineeringReasons,
    entryOffer,
    primaryRecommendation: {
      ...primarySolution,
      reasons: recommendationReasons,
      talkTrack,
    },
    secondaryRecommendations: offers
      .filter((offer) => ![entryOffer.id, primarySolution.id].includes(offer.id) && offer.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    restaurantAddOnRecommended: restaurantOffer.score >= 5,
    crossSells: unique(crossSells),
    goodBetterBest,
    nextStep,
    missingInformation: missing,
    objectionGuidance: objectionGuidance(answers.primary_objection || "none", primarySolution),
    approvedPricing: {
      assessment: pricing.assessment,
      foundation: pricing.foundation,
      uptime: pricing.uptime,
      continuity: pricing.continuity,
      restaurantAddOn: pricing.restaurantAddOn,
      remote: pricing.remote,
      onsite: pricing.onsite,
      afterHours: pricing.afterHours,
      laborDeposit: pricing.laborDeposit,
      hardwareDeposit: pricing.hardwareDeposit,
      managedTerm: pricing.managedTerm,
    },
    pricingStatement:
      "Published prices are starting points. Final scope and pricing follow a ReadyTech Uptime Assessment. Hardware, carriers, cabling, subscriptions, permits, and third-party fees are separate unless included in writing.",
    supportBoundary:
      "24/7 automated monitoring with human response during published support hours. Response targets are commitments to begin review, not guaranteed resolution times.",
    handoffChecklist: [
      "Customer contacts and decision-maker",
      "Approved option and signed scope",
      "Business problem and success criteria",
      "Locations and service zone",
      "Inventory, diagrams, photos, and vendor contacts",
      "Hardware and carrier dependencies",
      "Access restrictions and implementation hours",
      "Assumptions, exclusions, and engineering notes",
      "Deadline and promised response targets",
    ],
    followUpCadence: [
      "Day 0: send summary and next step",
      "Day 1: confirm receipt and answer questions",
      "Day 3: invite verification call or assessment",
      "Day 7: reconnect to business impact and options",
      "Day 14: final follow-up or move to nurture",
    ],
    salesInstructions: [
      nextStep.title,
      ...nextStep.actions,
      "Record the exact next action and date before closing the conversation",
      "Use business-outcome language; avoid leading with acronyms or product models",
    ],
  };
}

module.exports = {
  asArray,
  asNumber,
  normalizeCardAnswers,
  calculateMonitoredDevices,
  deriveSignals,
  getWorkflowSequence,
  getNextCardId,
  getPreviousCardId,
  analyzeSalesConsultation,
};
