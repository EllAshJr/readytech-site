const express = require("express");
const path = require("path");
const restaurantData = require("./data/restaurant");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

const services = {
  "managed-vpn": {
    title: "Managed VPN Services",
    description:
      "Secure site-to-site VPN and remote access solutions for homes and small businesses.",
  },
  "private-cloud": {
    title: "Private Cloud Services",
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
    metaDescription:
      "Private infrastructure services for Austin, Manor, and Houston. Managed VPN, private cloud, network monitoring, Wi‑Fi, backup internet, and restaurant technology support.",
  });
});

app.get("/services", (req, res) => {
  res.render("services", {
    pageTitle: "Private Infrastructure Services",
    metaDescription:
      "Managed VPN, private cloud, network monitoring, business Wi‑Fi, backup internet, and restaurant technology services.",
    services,
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
    services,
  });
});

app.get("/pricing", (req, res) => {
  res.render("pricing", {
    pageTitle: "Private Infrastructure Pricing",
    metaDescription:
      "Simple monthly pricing for managed VPN, private cloud, secure networking, Wi‑Fi, monitoring, backup internet, and restaurant technology services.",
    restaurantData,
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    pageTitle: "Contact Private Infrastructure Support",
    metaDescription:
      "Request help with managed VPN, private cloud, network monitoring, business Wi‑Fi, backup internet, or restaurant technology services.",
  });
});

app.post("/contact", (req, res) => {
  console.log("New contact form submission:");
  console.log(req.body);

  res.send("Thank you. Your request has been received.");
});

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
