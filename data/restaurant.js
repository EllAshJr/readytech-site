const restaurantData = {
  title: "Restaurant Technology Services",

  positioning:
    "We help restaurants in Austin, Manor, and Houston fix messy networks, unreliable POS connections, weak guest Wi‑Fi, outdated menus, poor review flow, and missed loyalty opportunities with secure networking, POS integration, QR menus, loyalty tools, delivery app support, backup internet, and monitoring.",

  shortPositioning:
    "Restaurant technology that keeps orders flowing, guests connected, reviews growing, and your business online.",

  cities: {
    austin: {
      name: "Austin",
      state: "TX",
    },
    manor: {
      name: "Manor",
      state: "TX",
    },
    houston: {
      name: "Houston",
      state: "TX",
    },
  },

  coreServices: [
    {
      name: "Managed Restaurant Network",
      description:
        "Firewall, router, switch, staff Wi‑Fi, guest Wi‑Fi, POS network separation, kitchen device connectivity, and monthly network health checks.",
      includes: [
        "Firewall setup",
        "Router configuration",
        "Managed switch setup",
        "Staff Wi‑Fi",
        "Guest Wi‑Fi",
        "POS network separation",
        "Kitchen device network",
        "Back-office network",
        "Vendor coordination",
        "Monthly health checks",
      ],
      pricing: [
        {
          service: "Restaurant Network Essentials",
          setup: "$750–$1,500",
          monthly: "$199/mo",
        },
        {
          service: "Restaurant Network Pro",
          setup: "$1,500–$3,500",
          monthly: "$299–$499/mo",
        },
        {
          service: "Multi-Location Restaurant Network",
          setup: "Custom",
          monthly: "$399+/mo per location",
        },
      ],
    },
    {
      name: "Restaurant Network Segmentation",
      description:
        "Separate POS, guest Wi‑Fi, staff Wi‑Fi, kitchen devices, cameras, and back-office systems into cleaner and safer network zones.",
      includes: [
        "POS network separation",
        "Guest Wi‑Fi isolation",
        "Staff Wi‑Fi separation",
        "Kitchen network setup",
        "Back-office network separation",
        "Camera / IoT network planning",
      ],
      pricing: [
        {
          service: "Network Segmentation Assessment",
          setup: "$199–$399",
          monthly: "—",
        },
        {
          service: "VLAN / Network Segmentation Setup",
          setup: "$750–$2,500",
          monthly: "Included in managed plan",
        },
      ],
    },
    {
      name: "Backup Internet / Failover Internet",
      description:
        "LTE, 5G, or dual-ISP failover support to help keep POS, online ordering, and payment systems online during outages.",
      includes: [
        "LTE backup internet",
        "5G backup internet",
        "Dual-ISP failover",
        "Cellular router setup",
        "Monthly failover testing",
        "Internet outage monitoring",
      ],
      pricing: [
        {
          service: "LTE Backup Internet Setup",
          setup: "$500–$1,000",
          monthly: "$99–$149/mo plus carrier cost",
        },
        {
          service: "5G Backup Internet Setup",
          setup: "$750–$1,500",
          monthly: "$149–$249/mo plus carrier cost",
        },
        {
          service: "Dual ISP Failover Management",
          setup: "$500–$1,500",
          monthly: "$99–$199/mo",
        },
      ],
    },
    {
      name: "Restaurant Wi‑Fi Services",
      description:
        "Staff Wi‑Fi, guest Wi‑Fi, QR Wi‑Fi access, guest speed limits, content filtering, coverage testing, and access point monitoring.",
      includes: [
        "Staff Wi‑Fi",
        "Guest Wi‑Fi",
        "Secure Wi‑Fi passwords",
        "QR code Wi‑Fi access",
        "Guest speed limits",
        "Content filtering",
        "Wi‑Fi coverage testing",
        "Access point monitoring",
      ],
      pricing: [
        {
          service: "Restaurant Staff Wi‑Fi Setup",
          setup: "$300–$750",
          monthly: "$49–$99/mo",
        },
        {
          service: "Guest Wi‑Fi Setup",
          setup: "$300–$750",
          monthly: "$49–$99/mo",
        },
        {
          service: "Managed Restaurant Wi‑Fi",
          setup: "$750–$2,000",
          monthly: "$149–$299/mo",
        },
      ],
    },
  ],

  operationsServices: [
    {
      name: "POS Installation & Integration Support",
      description:
        "Support for POS network readiness, register connectivity, receipt printers, kitchen printers, kitchen display systems, payment terminals, handheld POS Wi‑Fi tuning, and vendor coordination.",
      includes: [
        "POS network setup",
        "Register connectivity",
        "Receipt printer setup",
        "Kitchen printer setup",
        "Kitchen display system connectivity",
        "Payment terminal connectivity",
        "Handheld POS Wi‑Fi tuning",
        "Back-office device setup",
        "Menu item programming support",
        "Modifier setup support",
        "Vendor coordination",
        "Cutover testing",
      ],
      pricing: [
        {
          service: "POS Network Readiness Assessment",
          setup: "$199–$399",
          monthly: "—",
        },
        {
          service: "POS Integration Support",
          setup: "$500–$1,500",
          monthly: "—",
        },
        {
          service: "POS Cutover Support",
          setup: "$750–$2,500",
          monthly: "—",
        },
        {
          service: "After-Hours POS Cutover",
          setup: "$150/hr",
          monthly: "—",
        },
        {
          service: "Monthly POS Support Add-On",
          setup: "—",
          monthly: "$149–$299/mo",
        },
      ],
    },
    {
      name: "Digital Menu / Online Menu Programming",
      description:
        "Menu setup, QR menu setup, online menu updates, POS menu cleanup, delivery menu consistency, and menu content support.",
      includes: [
        "POS menu cleanup",
        "Online menu cleanup",
        "QR menu setup",
        "Category organization",
        "Item descriptions",
        "Modifier cleanup",
        "Add-on setup",
        "Combo setup",
        "Price update support",
        "Sold-out item support",
        "Catering menu support",
        "Google menu link support",
        "Delivery menu consistency",
      ],
      pricing: [
        {
          service: "Basic Online Menu Setup",
          setup: "$199–$399",
          monthly: "—",
        },
        {
          service: "POS Menu Cleanup",
          setup: "$399–$999",
          monthly: "—",
        },
        {
          service: "QR Menu Setup",
          setup: "$199–$499",
          monthly: "—",
        },
        {
          service: "Full Restaurant Menu Cleanup",
          setup: "$750–$2,000",
          monthly: "—",
        },
        {
          service: "Monthly Menu Update Support",
          setup: "—",
          monthly: "$49–$199/mo",
        },
      ],
    },
    {
      name: "Third-Party Delivery App Integration",
      description:
        "Delivery menu audits, DoorDash/Uber Eats/Grubhub cleanup, POS menu comparison, hours verification, modifier cleanup, order flow testing, and vendor coordination.",
      includes: [
        "DoorDash menu review",
        "Uber Eats menu review",
        "Grubhub menu review",
        "POS menu comparison",
        "Delivery price review",
        "Hours verification",
        "Modifier cleanup",
        "Order flow testing",
        "Kitchen printer / KDS testing",
        "Pickup and delivery settings review",
        "Vendor coordination",
      ],
      pricing: [
        {
          service: "Delivery Menu Audit",
          setup: "$199–$499",
          monthly: "—",
        },
        {
          service: "Delivery App Cleanup",
          setup: "$500–$1,500",
          monthly: "—",
        },
        {
          service: "Delivery App Integration Support",
          setup: "$750–$2,500",
          monthly: "—",
        },
        {
          service: "Monthly Delivery Menu Maintenance",
          setup: "—",
          monthly: "$99–$299/mo",
        },
      ],
    },
  ],

  customerExperienceServices: [
    {
      name: "Loyalty Rewards Program Setup",
      description:
        "Points-based loyalty, visit-based rewards, birthday rewards, VIP tiers, first-time guest offers, returning guest offers, QR signup, staff instructions, and POS loyalty testing.",
      includes: [
        "Points-based loyalty setup",
        "Visit-based rewards setup",
        "Birthday reward",
        "VIP reward tier",
        "First-time guest offer",
        "Returning guest offer",
        "QR code signup",
        "Staff instructions",
        "POS loyalty testing",
        "Monthly performance review",
      ],
      pricing: [
        {
          service: "Basic Loyalty Setup",
          setup: "$299–$599",
          monthly: "$49–$99/mo",
        },
        {
          service: "Loyalty Program Pro",
          setup: "$750–$1,500",
          monthly: "$149–$299/mo",
        },
        {
          service: "Multi-Location Loyalty Setup",
          setup: "$1,500+",
          monthly: "$299+/mo",
        },
      ],
    },
    {
      name: "Loyalty Cards / Gift Cards",
      description:
        "Physical loyalty card coordination, QR loyalty cards, gift card program setup, gift card testing, online gift card links, and holiday promo kits.",
      includes: [
        "Physical loyalty card coordination",
        "QR loyalty card setup",
        "Gift card program setup",
        "Gift card testing",
        "Online gift card link",
        "Holiday gift card campaign",
        "Staff redemption guide",
      ],
      pricing: [
        {
          service: "Loyalty Card Setup",
          setup: "$199–$399",
          monthly: "—",
        },
        {
          service: "Gift Card Program Setup",
          setup: "$299–$599",
          monthly: "—",
        },
        {
          service: "Loyalty / Gift Card Test & Launch",
          setup: "$199",
          monthly: "—",
        },
        {
          service: "Holiday Gift Card Promo Kit",
          setup: "$199–$499",
          monthly: "—",
        },
      ],
    },
    {
      name: "Table QR Experience",
      description:
        "Branded table QR codes that connect guests to menus, specials, rewards signup, birthday club, reviews, online ordering, social media, Wi‑Fi login, and feedback forms.",
      includes: [
        "Table QR codes",
        "Counter QR code",
        "Window QR code",
        "Branded landing page",
        "Menu link",
        "Rewards link",
        "Review link",
        "Analytics tracking",
        "Printable QR sheet",
      ],
      pricing: [
        {
          service: "Basic Table QR Setup",
          setup: "$199",
          monthly: "$25/mo",
        },
        {
          service: "Branded Table QR Experience",
          setup: "$399–$699",
          monthly: "$49–$99/mo",
        },
        {
          service: "Multi-Page QR Guest Portal",
          setup: "$750–$1,500",
          monthly: "$99–$199/mo",
        },
        {
          service: "QR Code Reprint / Update",
          setup: "$75–$150",
          monthly: "—",
        },
      ],
    },
    {
      name: "Review Generation System",
      description:
        "Google review QR codes, review request links, table tent QR codes, receipt QR codes, review response templates, negative feedback capture, and monthly review reporting.",
      includes: [
        "Google review QR code",
        "Review request link",
        "Table tent QR code",
        "Receipt QR code",
        "Counter sign QR code",
        "Post-visit review request workflow",
        "Review response templates",
        "Negative feedback capture form",
        "Monthly review report",
      ],
      pricing: [
        {
          service: "Basic Review QR Setup",
          setup: "$149–$299",
          monthly: "$25–$49/mo",
        },
        {
          service: "Review Generation System",
          setup: "$399–$799",
          monthly: "$99–$199/mo",
        },
        {
          service: "Review Monitoring & Response Support",
          setup: "—",
          monthly: "$149–$299/mo",
        },
        {
          service: "Multi-Location Review System",
          setup: "$750+",
          monthly: "$199+/mo",
        },
      ],
    },
    {
      name: "Birthday Club / VIP Club",
      description:
        "Birthday signup forms, VIP signup forms, QR signup links, birthday rewards, VIP offers, campaign calendars, email/SMS platform coordination, and monthly reporting.",
      includes: [
        "Birthday signup form",
        "VIP signup form",
        "QR signup link",
        "Birthday reward setup",
        "VIP offer setup",
        "Monthly campaign calendar",
        "Email/SMS platform coordination",
        "Staff instructions",
        "Monthly report",
      ],
      pricing: [
        {
          service: "Birthday Club Setup",
          setup: "$299–$599",
          monthly: "$49–$99/mo",
        },
        {
          service: "VIP Club Setup",
          setup: "$399–$799",
          monthly: "$99–$149/mo",
        },
        {
          service: "Birthday + VIP Club Bundle",
          setup: "$750–$1,500",
          monthly: "$149–$299/mo",
        },
        {
          service: "Monthly Campaign Management",
          setup: "—",
          monthly: "$149–$399/mo",
        },
      ],
    },
    {
      name: "Guest Wi‑Fi Marketing",
      description:
        "Turn guest Wi‑Fi into a branded customer experience with menu links, rewards signup, birthday club signup, Google review QR, catering inquiry, online ordering, specials, and social links.",
      includes: [
        "Branded Wi‑Fi landing page",
        "Menu link",
        "Rewards signup",
        "Birthday club signup",
        "Google review QR",
        "Catering inquiry",
        "Online ordering link",
        "Specials",
        "Social media links",
        "Email/SMS signup",
      ],
      pricing: [
        {
          service: "Basic Guest Wi‑Fi Landing Page",
          setup: "$299–$599",
          monthly: "$49–$99/mo",
        },
        {
          service: "Guest Wi‑Fi Marketing Pro",
          setup: "$750–$1,500",
          monthly: "$149–$299/mo",
        },
        {
          service: "Guest Wi‑Fi + Loyalty Capture",
          setup: "$1,000–$2,000",
          monthly: "$199–$399/mo",
        },
        {
          service: "Multi-Location Guest Wi‑Fi Marketing",
          setup: "$1,500+",
          monthly: "$299+/mo",
        },
      ],
    },
  ],

  monitoringServices: [
    {
      name: "Restaurant Monitoring Services",
      description:
        "NOC-style monitoring for internet, backup internet, firewall/router, switches, Wi‑Fi access points, POS terminals, printers, kitchen systems, delivery tablets, and key network devices.",
      includes: [
        "Internet connection monitoring",
        "Backup internet monitoring",
        "Firewall/router monitoring",
        "Switch monitoring",
        "Wi‑Fi access point monitoring",
        "POS terminal monitoring",
        "Receipt printer monitoring",
        "Kitchen printer monitoring",
        "Kitchen display system monitoring",
        "Back-office computer monitoring",
        "Delivery tablet monitoring",
        "Network closet power event tracking",
        "Temperature sensor monitoring when installed",
      ],
      pricing: [
        {
          service: "Basic Restaurant Monitoring",
          setup: "$199–$399",
          monthly: "$99/mo",
        },
        {
          service: "Restaurant Monitoring Pro",
          setup: "$399–$999",
          monthly: "$199–$299/mo",
        },
        {
          service: "Full Restaurant Uptime Monitoring",
          setup: "$1,000–$2,500",
          monthly: "$399–$599/mo",
        },
        {
          service: "Multi-Location Monitoring",
          setup: "Custom",
          monthly: "$299+/mo per location",
        },
      ],
    },
  ],

  packages: [
    {
      name: "Restaurant Network Essentials",
      description:
        "For small restaurants, cafes, food trucks, and quick-service restaurants that need a clean and reliable network foundation.",
      setup: "$750–$1,500",
      monthly: "$199–$299/mo",
      includes: [
        "Firewall/router setup",
        "Staff Wi‑Fi",
        "Guest Wi‑Fi",
        "POS network separation",
        "Basic monitoring",
        "Vendor coordination",
      ],
    },
    {
      name: "Restaurant Uptime Pro",
      description:
        "For restaurants where internet and POS downtime directly affect revenue.",
      setup: "$1,500–$3,500",
      monthly: "$299–$599/mo",
      includes: [
        "Managed network",
        "LTE/5G backup internet support",
        "Internet failover",
        "POS network monitoring",
        "Wi‑Fi monitoring",
        "Monthly uptime report",
        "Priority support",
      ],
    },
    {
      name: "Guest Experience Growth Package",
      description:
        "For restaurants that want better QR menus, reviews, loyalty signup, and guest Wi‑Fi engagement.",
      setup: "$1,000–$2,500",
      monthly: "$249–$499/mo",
      includes: [
        "Table QR Experience",
        "QR menu setup",
        "Review Generation System",
        "Birthday Club / VIP Club",
        "Guest Wi‑Fi Marketing landing page",
        "Loyalty signup link",
        "Google review QR code",
        "Monthly campaign updates",
      ],
    },
    {
      name: "POS Integration Support Package",
      description:
        "For restaurants installing, upgrading, or cleaning up their POS environment.",
      setup: "$750–$2,500 project",
      monthly: "$149–$299/mo optional support",
      includes: [
        "POS network readiness",
        "Register connectivity support",
        "Printer/KDS connectivity",
        "Menu sync support",
        "Delivery app integration support",
        "Cutover support",
        "Vendor coordination",
      ],
    },
    {
      name: "Restaurant Customer Retention Package",
      description:
        "For restaurants that want to increase repeat visits from existing customers.",
      setup: "$750–$2,000",
      monthly: "$199–$399/mo",
      includes: [
        "Loyalty rewards setup",
        "Birthday Club",
        "VIP Club",
        "Gift card setup",
        "Review Generation System",
        "Table QR signup flow",
        "Monthly offer updates",
      ],
    },
    {
      name: "Complete Restaurant Technology Stack",
      description:
        "Premium restaurant technology support without sound system installation, TV installation, or standalone digital signage.",
      setup: "$3,500–$10,000+",
      monthly: "$599–$1,499/mo",
      includes: [
        "Managed restaurant network",
        "POS integration support",
        "Staff Wi‑Fi",
        "Guest Wi‑Fi",
        "Backup internet support",
        "Restaurant monitoring",
        "Table QR Experience",
        "QR menu setup",
        "Loyalty program setup",
        "Birthday Club / VIP Club",
        "Review Generation System",
        "Guest Wi‑Fi Marketing",
        "Delivery app integration support",
        "Monthly technology review",
      ],
    },
  ],

  healthCheck: {
    name: "Restaurant Technology Health Check",
    price: "$199–$399",
    description:
      "A practical assessment of the restaurant’s network, POS connectivity, Wi‑Fi, QR/menu flow, review process, loyalty opportunities, and monitoring readiness.",
    inspect: [
      "Internet connection",
      "Firewall/router",
      "Staff Wi‑Fi",
      "Guest Wi‑Fi",
      "POS network",
      "Printers",
      "Kitchen display systems",
      "Delivery tablets",
      "Backup internet",
      "Menu links",
      "QR menu",
      "Google review link",
      "Loyalty signup process",
      "Guest Wi‑Fi marketing opportunity",
      "Network closet",
      "Cable organization",
      "Security risks",
      "Monitoring opportunities",
    ],
    reportSections: [
      "Current network condition",
      "POS connectivity risks",
      "Wi‑Fi issues",
      "Internet failover recommendation",
      "Customer-experience opportunities",
      "Review generation opportunities",
      "Loyalty/VIP program opportunities",
      "Monitoring recommendation",
      "Priority fix list",
    ],
  },

  seoServices: {
    "restaurant-networking": {
      title: "Restaurant Networking",
      description:
        "Secure restaurant networking for POS, staff Wi‑Fi, guest Wi‑Fi, kitchen devices, back-office systems, and monitoring.",
      highlights: [
        "Firewall and router setup",
        "POS network separation",
        "Guest Wi‑Fi isolation",
        "Switch and access point support",
        "Network cleanup and documentation",
      ],
    },
    "restaurant-pos-integration": {
      title: "Restaurant POS Integration",
      description:
        "POS network readiness, register connectivity, printer support, kitchen display connectivity, menu sync support, and vendor coordination.",
      highlights: [
        "POS network readiness",
        "Register and payment terminal connectivity",
        "Kitchen printer support",
        "KDS connectivity",
        "Cutover and vendor coordination",
      ],
    },
    "digital-menu-programming": {
      title: "Digital Menu Programming",
      description:
        "QR menu setup, online menu cleanup, POS menu organization, delivery menu consistency, and monthly menu update support.",
      highlights: [
        "QR menu setup",
        "POS menu cleanup",
        "Modifier cleanup",
        "Price update support",
        "Delivery menu consistency",
      ],
    },
    "restaurant-loyalty-programs": {
      title: "Restaurant Loyalty Programs",
      description:
        "Loyalty rewards setup for repeat visits, birthday rewards, VIP tiers, first-time guest offers, and QR signup flows.",
      highlights: [
        "Points-based loyalty setup",
        "Visit-based rewards",
        "Birthday rewards",
        "VIP offers",
        "Loyalty reporting",
      ],
    },
    "loyalty-card-setup": {
      title: "Loyalty Card Setup",
      description:
        "Physical and QR-based loyalty card setup, reward testing, staff instructions, and launch support.",
      highlights: [
        "Physical loyalty card coordination",
        "QR loyalty card setup",
        "Reward testing",
        "Staff instructions",
        "Launch support",
      ],
    },
    "gift-card-program-setup": {
      title: "Gift Card Program Setup",
      description:
        "Gift card program setup, testing, online gift card links, holiday campaigns, and staff redemption guidance.",
      highlights: [
        "Gift card setup",
        "Gift card testing",
        "Online gift card link",
        "Holiday promotion support",
        "Staff redemption guide",
      ],
    },
    "restaurant-delivery-app-integration": {
      title: "Restaurant Delivery App Integration",
      description:
        "Delivery app menu audits, order flow testing, POS menu comparison, modifier cleanup, and vendor coordination.",
      highlights: [
        "DoorDash menu review",
        "Uber Eats menu review",
        "Grubhub menu review",
        "Order flow testing",
        "Delivery menu cleanup",
      ],
    },
    "restaurant-wifi": {
      title: "Restaurant Wi‑Fi",
      description:
        "Staff Wi‑Fi, guest Wi‑Fi, secure Wi‑Fi access, QR Wi‑Fi access, content filtering, and access point monitoring.",
      highlights: [
        "Staff Wi‑Fi",
        "Guest Wi‑Fi",
        "QR code Wi‑Fi access",
        "Guest speed limits",
        "Access point monitoring",
      ],
    },
    "restaurant-backup-internet": {
      title: "Restaurant Backup Internet",
      description:
        "LTE, 5G, and dual-ISP failover support to keep POS, online ordering, and business systems connected during outages.",
      highlights: [
        "LTE backup internet",
        "5G backup internet",
        "Dual ISP failover",
        "Failover testing",
        "Outage monitoring",
      ],
    },
    "restaurant-technology-monitoring": {
      title: "Restaurant Technology Monitoring",
      description:
        "Monitoring for internet, backup internet, firewall, switches, Wi‑Fi, POS terminals, printers, kitchen systems, and network devices.",
      highlights: [
        "Internet monitoring",
        "Firewall/router monitoring",
        "POS network monitoring",
        "Printer monitoring",
        "Monthly uptime reporting",
      ],
    },
    "table-qr-experience": {
      title: "Table QR Experience",
      description:
        "Branded table QR codes that connect guests to menus, specials, rewards, reviews, online ordering, Wi‑Fi, and feedback forms.",
      highlights: [
        "Table QR codes",
        "Branded landing page",
        "Menu link",
        "Review link",
        "Analytics tracking",
      ],
    },
    "review-generation-system": {
      title: "Review Generation System",
      description:
        "Review QR codes, review links, receipt QR codes, table tent QR codes, response templates, and monthly review reporting.",
      highlights: [
        "Google review QR code",
        "Review request link",
        "Table tent QR code",
        "Review response templates",
        "Monthly review report",
      ],
    },
    "birthday-vip-club": {
      title: "Birthday Club / VIP Club",
      description:
        "Birthday signup forms, VIP signup forms, QR signup links, birthday rewards, VIP offers, and monthly campaign support.",
      highlights: [
        "Birthday signup form",
        "VIP signup form",
        "Birthday reward setup",
        "VIP offer setup",
        "Monthly campaign support",
      ],
    },
    "guest-wifi-marketing": {
      title: "Guest Wi‑Fi Marketing",
      description:
        "Branded guest Wi‑Fi landing pages with menu links, loyalty signup, birthday club signup, reviews, specials, and social media links.",
      highlights: [
        "Branded Wi‑Fi landing page",
        "Rewards signup",
        "Birthday club signup",
        "Google review QR",
        "Online ordering link",
      ],
    },
    "restaurant-menu-cleanup": {
      title: "Restaurant Menu Cleanup",
      description:
        "POS menu cleanup, online menu cleanup, item descriptions, category organization, modifier cleanup, and delivery menu consistency.",
      highlights: [
        "POS menu cleanup",
        "Online menu cleanup",
        "Modifier cleanup",
        "Item descriptions",
        "Delivery menu consistency",
      ],
    },
    "pos-network-readiness": {
      title: "POS Network Readiness",
      description:
        "Pre-installation restaurant network review for POS upgrades, register placement, printer connectivity, Wi‑Fi coverage, and vendor handoff.",
      highlights: [
        "Network readiness review",
        "Printer location review",
        "Register connectivity planning",
        "Wi‑Fi coverage check",
        "Vendor coordination",
      ],
    },
  },
};

module.exports = restaurantData;
