require("dotenv").config();
const express = require("express");
const path = require("path");
const restaurantData = require("./data/restaurant");
const pricingData = require("./data/pricing");
const siteStrategy = require("./data/site-strategy");
const coIndustries = require("./data/co-industries");
const quoteRouter = require("./routes/quotes");
const salesRouter = require("./routes/sales");
const {
  sendCoIndustryLeadEmail,
  sendContactRequestEmail,
} = require("./services/email-service");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.locals.siteStrategy = siteStrategy;
app.locals.coIndustries = coIndustries;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.post("/lead-events", (req, res) => {
  const body = req.body || {};

  console.log("Lead event:", {
    event: String(body.event || "").slice(0, 80),
    href: String(body.href || "").slice(0, 240),
    path: String(body.path || "").slice(0, 160),
  });

  res.sendStatus(204);
});

function cleanHost(req) {
  return String(req.get("host") || "")
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();
}

function findCoIndustryByHost(req) {
  const host = cleanHost(req);
  if (!host) return null;

  return (
    coIndustries.businesses.find((business) =>
      business.domainCandidates.includes(host),
    ) || null
  );
}

function findCoIndustryBySlug(slug) {
  return coIndustries.businesses.find((business) => business.slug === slug) || null;
}

function coIndustryLinks(req, business) {
  const hostBusiness = findCoIndustryByHost(req);
  const basePath = hostBusiness && hostBusiness.id === business.id ? "" : `/${business.slug}`;
  const home = basePath || "/";
  const coIndustriesPath = `/co-industries?from=${encodeURIComponent(business.slug)}`;

  return {
    home,
    services: `${basePath}/services`,
    faq: `${basePath}/faq`,
    contact: `${basePath}/contact`,
    readyTech: "https://readytechinstalls.com",
    coIndustries: hostBusiness
      ? `https://readytechinstalls.com${coIndustriesPath}`
      : coIndustriesPath,
  };
}

function coIndustryCanonicalUrl(req, business, pagePath = "") {
  const hostBusiness = findCoIndustryByHost(req);

  if (hostBusiness && hostBusiness.id === business.id) {
    const host = req.get("host");
    const protocol = req.protocol || "https";
    return `${protocol}://${host}${pagePath || "/"}`;
  }

  return `${siteStrategy.siteUrl}/${business.slug}${pagePath}`;
}

function coIndustrySchema(business, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: canonicalUrl,
    telephone: business.phone,
    description: business.description,
    areaServed: business.serviceAreas.map((area) => ({
      "@type": "Place",
      name: area,
    })),
    parentOrganization: {
      "@type": "Organization",
      name: "Ready Eddy Heavy Duty Services",
    },
  };
}

function coIndustryPageConfig(business, page) {
  const configs = {
    home: {
      view: "co-industry-home",
      path: "",
      title: `${business.shortName} | ${business.category}`,
      description: business.description,
    },
    services: {
      view: "co-industry-services",
      path: "/services",
      title: `${business.name} Services`,
      description: business.shortDescription,
    },
    faq: {
      view: "co-industry-faq",
      path: "/faq",
      title: `${business.name} FAQ`,
      description: `Answers to common questions about ${business.category.toLowerCase()}.`,
    },
    contact: {
      view: "co-industry-contact",
      path: "/contact",
      title: `Request a Quote | ${business.name}`,
      description: `Request a quote from ${business.name}.`,
    },
  };

  return configs[page] || configs.home;
}

function coIndustryValues(body = {}) {
  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    city: String(body.city || "").trim(),
    service: String(body.service || "").trim(),
    message: String(body.message || "").trim(),
  };
}

function renderCoIndustryPage(req, res, business, page, overrides = {}) {
  const config = coIndustryPageConfig(business, page);
  const links = coIndustryLinks(req, business);
  const canonicalUrl = coIndustryCanonicalUrl(req, business, config.path);

  return res.status(overrides.status || 200).render(config.view, {
    business,
    links,
    pageTitle: config.title,
    metaDescription: config.description,
    canonicalUrl,
    localBusinessSchema: coIndustrySchema(business, canonicalUrl),
    values: overrides.values || {},
    notice:
      overrides.notice ||
      (req.query.received === "1"
        ? "Thank you. Your request has been received. The team will follow up soon."
        : ""),
    error: overrides.error || "",
  });
}

async function handleCoIndustryContact(req, res, business) {
  const values = coIndustryValues(req.body || {});

  if (!values.name || !values.email || !values.message) {
    return renderCoIndustryPage(req, res, business, "contact", {
      status: 400,
      values,
      error: "Please enter your name, email, and a short message.",
    });
  }

  try {
    await sendCoIndustryLeadEmail({ business, submission: values });
    const links = coIndustryLinks(req, business);
    return res.redirect(`${links.contact}?received=1`);
  } catch (error) {
    console.error("Co-industry contact form email failed:", error);

    return renderCoIndustryPage(req, res, business, "contact", {
      status: 503,
      values,
      error:
        "We could not send that request. Please call the number listed on this page.",
    });
  }
}

function coIndustryHostRouter(req, res, next) {
  const business = findCoIndustryByHost(req);
  if (!business) return next();

  if (req.method === "GET" && req.path === "/") {
    return renderCoIndustryPage(req, res, business, "home");
  }

  if (req.method === "GET" && req.path === "/services") {
    return renderCoIndustryPage(req, res, business, "services");
  }

  if (req.method === "GET" && req.path === "/faq") {
    return renderCoIndustryPage(req, res, business, "faq");
  }

  if (req.method === "GET" && req.path === "/contact") {
    return renderCoIndustryPage(req, res, business, "contact");
  }

  if (req.method === "POST" && req.path === "/contact") {
    return handleCoIndustryContact(req, res, business);
  }

  return res.status(404).send("Page not found");
}

app.use(coIndustryHostRouter);

const services = {
  "managed-vpn": {
    title: "Managed VPN Services",
    description:
      "Secure site-to-site VPN and remote access solutions for homes and small businesses.",
  },
  "private-cloud": {
    title: "Managed Backup & Secure File Access",
    description:
      "Private cloud storage, backup, and infrastructure services for businesses that want control over their data.",
  },
  "network-monitoring": {
    title: "Network Monitoring Services",
    description:
      "Internet, firewall, device, and uptime monitoring for small business networks.",
  },
  "business-wifi": {
    title: "Business Wi‑Fi Services",
    description:
      "Managed Wi‑Fi design, installation, monitoring, and support for homes and businesses.",
  },
  "backup-internet": {
    title: "Backup Internet Services",
    description:
      "LTE and 5G backup internet options to keep your business connected during outages.",
  },
  "restaurant-technology": {
    title: "Restaurant Technology Services",
    description:
      "Restaurant networking, POS integration, QR menus, loyalty tools, delivery app support, backup internet, guest Wi‑Fi marketing, and monitoring.",
  },
};

const locations = {
  austin: {
    city: "Austin",
    title: "Managed VPN, Private Cloud & Network Monitoring in Austin, TX",
    description:
      "Secure networking, managed VPN, private cloud, Wi‑Fi, monitoring, and backup internet services for Austin homes and small businesses.",
  },
  manor: {
    city: "Manor",
    title: "Managed VPN, Private Cloud & Network Monitoring in Manor, TX",
    description:
      "Private infrastructure services for Manor businesses, remote workers, home offices, and growing companies.",
  },
  houston: {
    city: "Houston",
    title: "Managed VPN, Private Cloud & Network Monitoring in Houston, TX",
    description:
      "Business VPN, secure networking, private cloud, backup internet, and monitoring services for Houston small businesses.",
  },
};

app.get("/", (req, res) => {
  res.render("index", {
    pageTitle: "Managed VPN, Private Cloud & Secure Networking in Texas",
    contactNotice:
      req.query.contact === "received"
        ? "Thank you. Your request has been received. ReadyTech will follow up soon."
        : "",
    metaDescription:
      "Private infrastructure services for Austin, Manor, and Houston. Managed VPN, private cloud, network monitoring, Wi-Fi, backup internet, and restaurant technology support.",
  });
});

app.get("/co-industries", (req, res) => {
  const currentBusiness = findCoIndustryBySlug(String(req.query.from || ""));
  const relatedBusinesses = currentBusiness
    ? coIndustries.businesses.filter((business) => business.id !== currentBusiness.id)
    : coIndustries.businesses;

  res.render("co-industries", {
    pageTitle: "ReadyTech Co-Industries",
    metaDescription:
      "Trusted co-industry businesses connected to ReadyTech for commercial kitchen exhaust cleaning and hydro-vac support.",
    coIndustries,
    currentBusiness,
    relatedBusinesses,
  });
});

app.get("/:businessSlug", (req, res, next) => {
  const business = findCoIndustryBySlug(req.params.businessSlug);
  if (!business) return next();

  return renderCoIndustryPage(req, res, business, "home");
});

app.get("/:businessSlug/services", (req, res, next) => {
  const business = findCoIndustryBySlug(req.params.businessSlug);
  if (!business) return next();

  return renderCoIndustryPage(req, res, business, "services");
});

app.get("/:businessSlug/faq", (req, res, next) => {
  const business = findCoIndustryBySlug(req.params.businessSlug);
  if (!business) return next();

  return renderCoIndustryPage(req, res, business, "faq");
});

app.get("/:businessSlug/contact", (req, res, next) => {
  const business = findCoIndustryBySlug(req.params.businessSlug);
  if (!business) return next();

  return renderCoIndustryPage(req, res, business, "contact");
});

app.post("/:businessSlug/contact", async (req, res, next) => {
  const business = findCoIndustryBySlug(req.params.businessSlug);
  if (!business) return next();

  return handleCoIndustryContact(req, res, business);
});

app.get("/services", (req, res) => {
  res.render("services", {
    pageTitle: "Private Infrastructure Services",
    metaDescription:
      "Managed VPN, private cloud, network monitoring, business Wi‑Fi, backup internet, and restaurant technology services.",
    services,
    pricingData,
  });
});

app.get("/services/restaurant-technology", (req, res) => {
  res.render("restaurant-technology", {
    pageTitle: "Restaurant Technology Services | Austin, Manor & Houston",
    metaDescription:
      "Restaurant networking, POS integration, guest Wi‑Fi, backup internet, QR menus, loyalty programs, review generation, delivery app support, and monitoring.",
    restaurantData,
  });
});

app.get("/urgent-support", (req, res) => {
  res.render("urgent-support", {
    pageTitle: "Urgent Business Technology Support",
    metaDescription:
      "Request urgent help for business internet, POS, payments, Wi-Fi, VPN, backup internet, and connectivity issues affecting operations.",
  });
});

app.get("/case-studies", (req, res) => {
  res.render("case-studies", {
    pageTitle: "ReadyTech Example Jobs and Use Cases",
    metaDescription:
      "See example ReadyTech projects for restaurant uptime, business Wi-Fi, VPN cleanup, backup internet, and managed connectivity.",
  });
});

app.get("/services/:slug", (req, res) => {
  const restaurantService = restaurantData.seoServices[req.params.slug];

  if (restaurantService) {
    return res.render("restaurant-service", {
      pageTitle: `${restaurantService.title} | Restaurant Technology Services`,
      metaDescription: restaurantService.description,
      restaurantService,
      restaurantData,
      slug: req.params.slug,
    });
  }

  const service = services[req.params.slug];

  if (!service) {
    return res.status(404).send("Service not found");
  }

  res.render("service-page", {
    pageTitle: `${service.title} | Austin, Manor & Houston`,
    metaDescription: service.description,
    service,
    serviceSlug: req.params.slug,
  });
});

app.get("/locations/:city/:serviceSlug", (req, res) => {
  const localPage = siteStrategy.localSeoPages.find(
    (page) => page.city === req.params.city && page.slug === req.params.serviceSlug,
  );

  if (!localPage) {
    return res.status(404).send("Local service page not found");
  }

  res.render("local-service-page", {
    pageTitle: localPage.title,
    metaDescription: localPage.description,
    localPage,
  });
});

app.get("/locations/:city", (req, res) => {
  const location = locations[req.params.city];

  if (!location) {
    return res.status(404).send("Location not found");
  }

  res.render("location-page", {
    pageTitle: location.title,
    metaDescription: location.description,
    location,
    citySlug: req.params.city,
    localSeoPages: siteStrategy.localSeoPages.filter((page) => page.city === req.params.city),
    services,
  });
});

app.get("/how-we-work", (req, res) => {
  res.render("how-we-work", {
    pageTitle: "Business Uptime Assessment & Service Process",
    metaDescription:
      "See how ReadyTech qualifies, assesses, proposes, installs, documents, monitors, and supports business-critical connectivity.",
  });
});

app.get("/pricing", (req, res) => {
  res.render("pricing", {
    pageTitle: "Private Infrastructure Pricing",
    metaDescription:
      "Simple monthly pricing for managed VPN, private cloud, secure networking, Wi‑Fi, monitoring, backup internet, and restaurant technology services.",
    restaurantData,
    pricingData,
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    pageTitle: "Contact Private Infrastructure Support",
    values: {
      service: req.query.service || "",
    },
    notice: "",
    error: "",
    metaDescription:
      "Request help with managed VPN, private cloud, network monitoring, business Wi‑Fi, backup internet, or restaurant technology services.",
  });
});

app.post("/contact", async (req, res) => {
  const body = req.body || {};
  const values = {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    city: String(body.city || "").trim(),
    service: String(body.service || "").trim(),
    message: String(body.message || "").trim(),
  };

  if (!values.name || !values.email || !values.message) {
    return res.status(400).render("contact", {
      pageTitle: "Contact Private Infrastructure Support",
      metaDescription:
        "Request help with managed VPN, private cloud, network monitoring, business Wi-Fi, backup internet, or restaurant technology services.",
      values,
      notice: "",
      error: "Please enter your name, email, and a short message.",
    });
  }

  try {
    await sendContactRequestEmail({ submission: values });

    return res.redirect("/?contact=received");
  } catch (error) {
    console.error("Contact form email failed:", error);

    return res.status(503).render("contact", {
      pageTitle: "Contact Private Infrastructure Support",
      metaDescription:
        "Request help with managed VPN, private cloud, network monitoring, business Wi-Fi, backup internet, or restaurant technology services.",
      values,
      notice: "",
      error: "We could not send that request. Please email contact@readytechinstalls.com directly.",
    });
  }
});

app.use(quoteRouter);

app.use(salesRouter);

app.get("/:city/:slug", (req, res) => {
  const city = restaurantData.cities[req.params.city];
  const restaurantService = restaurantData.seoServices[req.params.slug];

  if (!city || !restaurantService) {
    return res.status(404).send("Page not found");
  }

  res.render("restaurant-city-service", {
    pageTitle: `${restaurantService.title} in ${city.name}, ${city.state}`,
    metaDescription: `${restaurantService.description} Serving restaurants in ${city.name}, ${city.state}.`,
    city,
    restaurantService,
    restaurantData,
    slug: req.params.slug,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
