const pricingData = {
  serviceAreas: "Austin, Manor, Houston",

  intro:
    "Standard pricing applies to Austin, Manor, and Houston service areas. Onsite work outside the standard service area may require a trip charge or custom quote.",

  anchorMap: {
    "managed-vpn": "From $79/mo",
    "private-cloud": "From $149/mo",
    "network-monitoring": "From $99/mo",
    "business-wifi": "From $149/mo",
    "backup-internet": "From $99/mo + carrier",
    "restaurant-technology": "From $249/mo",
  },

  rateCard: [
    {
      service: "Remote Support / Standard Technical Support",
      rate: "$95/hr",
    },
    {
      service: "Network / VPN / Wi-Fi / POS Support",
      rate: "$125/hr",
    },
    {
      service: "Senior Network / Security / Architecture Work",
      rate: "$150/hr",
    },
    {
      service: "Emergency / After-Hours Support",
      rate: "$175/hr",
    },
    {
      service: "Onsite Minimum",
      rate: "2 hours",
    },
    {
      service: "Project Management / Vendor Coordination",
      rate: "$125/hr",
    },
    {
      service: "Travel outside normal service area",
      rate: "Quote or trip fee",
    },
  ],

  categories: [
    {
      slug: "managed-vpn",
      title: "Managed VPN Services",
      description:
        "Secure remote access and site-to-site VPN services for small businesses, restaurants, home offices, and multi-site environments.",
      plans: [
        {
          service: "Remote Access VPN Essentials",
          setup: "$299",
          monthly: "$79/mo",
          includes: [
            "Up to 5 users",
            "VPN configuration",
            "Basic firewall rule review",
            "Secure remote access setup",
            "Monthly tunnel health check",
            "Basic documentation",
          ],
        },
        {
          service: "Business Remote Access VPN",
          setup: "$499",
          monthly: "$149/mo",
          includes: [
            "Up to 15 users",
            "User access policy setup",
            "VPN monitoring",
            "Basic access review",
            "Monthly health report",
            "Priority support",
          ],
        },
        {
          service: "Site-to-Site VPN",
          setup: "$750/site pair",
          monthly: "$199/mo",
          includes: [
            "Tunnel configuration",
            "Firewall coordination",
            "Route testing",
            "Failover review",
            "Monthly tunnel monitoring",
            "Basic incident response",
          ],
        },
        {
          service: "Multi-Site VPN Pro",
          setup: "$1,500+",
          monthly: "$349/mo base + $99/mo per remote site",
        },
        {
          service: "VPN Health Check / Repair",
          setup: "$199-$399",
          monthly: "—",
        },
        {
          service: "Emergency VPN Restoration",
          setup: "—",
          monthly: "$175/hr",
        },
      ],
      notes: [
        "Additional users for Remote Access VPN Essentials: $8/user/month.",
        "Additional users for Business Remote Access VPN: $7/user/month.",
      ],
    },

    {
      slug: "private-cloud",
      title: "Private Cloud Services",
      description:
        "Managed private storage, backup, access control, restore assistance, and recovery support for businesses that want more control over their data.",
      plans: [
        {
          service: "Private Cloud Starter",
          setup: "$499",
          monthly: "$149/mo",
          includes: [
            "Up to 500GB storage",
            "Up to 5 users",
            "Secure file access",
            "Basic folder structure",
            "Access control setup",
            "Monthly health check",
          ],
        },
        {
          service: "Business Private Cloud",
          setup: "$999",
          monthly: "$299/mo",
          includes: [
            "Up to 1TB storage",
            "Up to 15 users",
            "Secure access controls",
            "User permissions",
            "Basic backup policy",
            "Monthly usage review",
            "Restore assistance",
          ],
        },
        {
          service: "Private Cloud Pro",
          setup: "$1,999",
          monthly: "$599/mo",
          includes: [
            "Up to 3TB storage",
            "Up to 25 users",
            "Role-based access",
            "Backup and recovery planning",
            "Monitoring",
            "Monthly report",
            "Priority support",
          ],
        },
        {
          service: "Managed Cloud Backup Add-On",
          setup: "$199",
          monthly: "$99/mo",
        },
        {
          service: "Additional Storage",
          setup: "—",
          monthly: "$35/TB/mo",
        },
        {
          service: "Workstation Backup",
          setup: "$99/device setup",
          monthly: "$15/device/mo",
        },
        {
          service: "Server Backup",
          setup: "$299/server setup",
          monthly: "$49/server/mo",
        },
      ],
    },

    {
      slug: "network-monitoring",
      title: "Network Monitoring Services",
      description:
        "NOC-style monitoring for internet uptime, routers, firewalls, switches, access points, business devices, and critical network services.",
      plans: [
        {
          service: "Uptime Monitoring Lite",
          setup: "$199",
          monthly: "$99/mo",
          includes: [
            "Internet uptime monitoring",
            "Firewall/router reachability",
            "Up to 5 monitored devices",
            "Basic email alerts",
            "Monthly uptime summary",
          ],
        },
        {
          service: "Network Watch Pro",
          setup: "$499",
          monthly: "$249/mo",
          includes: [
            "Up to 15 monitored devices",
            "Firewall/router monitoring",
            "Switch monitoring",
            "Wi-Fi AP monitoring",
            "Internet outage alerts",
            "Device offline alerts",
            "Monthly report",
            "Basic troubleshooting",
          ],
        },
        {
          service: "NOC Monitoring Plus",
          setup: "$999",
          monthly: "$499/mo",
          includes: [
            "Up to 30 monitored devices",
            "Internet, firewall, switch, and Wi-Fi monitoring",
            "POS/device monitoring where supported",
            "Alert triage",
            "Monthly trend report",
            "Priority response",
            "Quarterly improvement recommendations",
          ],
        },
        {
          service: "Additional Monitored Device",
          setup: "—",
          monthly: "$8-$15/device/mo",
        },
        {
          service: "Monthly Network Health Report",
          setup: "Included in Pro+",
          monthly: "—",
        },
        {
          service: "Emergency Network Incident Support",
          setup: "—",
          monthly: "$175/hr",
        },
      ],
    },

    {
      slug: "business-wifi",
      title: "Business Wi-Fi Services",
      description:
        "Managed Wi-Fi for small businesses, restaurants, offices, patios, and high-use spaces that need stable coverage and secure guest separation.",
      plans: [
        {
          service: "Wi-Fi Site Survey",
          setup: "$249-$399",
          monthly: "—",
        },
        {
          service: "Managed Wi-Fi Essentials",
          setup: "$750-$1,500",
          monthly: "$149/mo",
          includes: [
            "1-2 access points",
            "Staff Wi-Fi",
            "Guest Wi-Fi",
            "SSID setup",
            "Basic security configuration",
            "Monthly health check",
            "Firmware coordination",
          ],
        },
        {
          service: "Managed Wi-Fi Pro",
          setup: "$1,500-$3,500",
          monthly: "$299/mo",
          includes: [
            "3-5 access points",
            "Staff and guest Wi-Fi separation",
            "Coverage tuning",
            "Content filtering option",
            "Guest speed limits",
            "AP monitoring",
            "Monthly report",
          ],
        },
        {
          service: "Multi-Zone / High-Density Wi-Fi",
          setup: "Custom",
          monthly: "$499+/mo",
        },
        {
          service: "Additional Managed Access Point",
          setup: "Hardware/setup separate",
          monthly: "$39/mo per AP",
        },
        {
          service: "Guest Wi-Fi Portal / QR Access",
          setup: "$299-$599",
          monthly: "$49-$99/mo",
        },
      ],
      notes: [
        "Hardware is quoted separately unless bundled in a project proposal.",
      ],
    },

    {
      slug: "backup-internet",
      title: "Backup Internet Services",
      description:
        "LTE, 5G, and dual-ISP failover services that help keep payments, POS, cloud access, and business systems online during internet outages.",
      plans: [
        {
          service: "LTE Backup Internet Setup",
          setup: "$499-$999",
          monthly: "$99/mo + carrier cost",
          includes: [
            "LTE router setup",
            "Firewall failover configuration",
            "Basic test failover",
            "Documentation",
            "Monthly connection check",
          ],
        },
        {
          service: "5G Backup Internet Pro",
          setup: "$750-$1,500",
          monthly: "$149-$249/mo + carrier cost",
          includes: [
            "5G router setup",
            "Failover testing",
            "Signal placement review",
            "Firewall integration",
            "Monthly failover test",
            "Outage alerts",
          ],
        },
        {
          service: "Dual ISP Failover Management",
          setup: "$750-$1,500",
          monthly: "$149-$249/mo",
        },
        {
          service: "Business Continuity Internet Package",
          setup: "$1,500-$2,500",
          monthly: "$299/mo + carrier cost",
          includes: [
            "Primary ISP monitoring",
            "Backup ISP or cellular failover",
            "Monthly failover testing",
            "Outage notification",
            "Router/firewall support",
            "Quarterly review",
          ],
        },
        {
          service: "Monthly Failover Test",
          setup: "Included in Pro+",
          monthly: "$49/mo standalone",
        },
        {
          service: "Emergency Internet Failover Support",
          setup: "—",
          monthly: "$175/hr",
        },
      ],
      notes: [
        "Carrier data plans are billed separately because pricing varies by provider, data usage, and location.",
      ],
    },

    {
      slug: "restaurant-technology",
      title: "Restaurant Technology Services",
      description:
        "Restaurant networking, POS support, QR menus, loyalty tools, review generation, guest Wi-Fi marketing, delivery app support, backup internet, and monitoring.",
      plans: [
        {
          service: "Restaurant Technology Health Check",
          setup: "$299-$399",
          monthly: "—",
          includes: [
            "Internet review",
            "Firewall/router review",
            "Staff Wi-Fi check",
            "Guest Wi-Fi check",
            "POS network check",
            "Printer/KDS connectivity review",
            "Delivery tablet review",
            "QR menu review",
            "Google review link review",
            "Loyalty signup review",
            "Monitoring opportunity report",
          ],
        },
        {
          service: "Restaurant Network Essentials",
          setup: "$995-$1,995",
          monthly: "$249/mo",
          includes: [
            "Firewall/router setup",
            "Staff Wi-Fi",
            "Guest Wi-Fi",
            "POS network separation",
            "Basic monitoring",
            "Vendor coordination",
            "Monthly health check",
          ],
        },
        {
          service: "Restaurant Uptime Pro",
          setup: "$1,500-$3,500",
          monthly: "$399-$599/mo",
          includes: [
            "Managed network",
            "Backup internet support",
            "POS network monitoring",
            "Wi-Fi monitoring",
            "Monthly uptime report",
            "Priority support",
          ],
        },
        {
          service: "POS Network Readiness Assessment",
          setup: "$399",
          monthly: "—",
        },
        {
          service: "POS Integration / Cutover Support",
          setup: "$750-$2,500",
          monthly: "—",
        },
        {
          service: "Monthly POS Support Add-On",
          setup: "—",
          monthly: "$199-$299/mo",
        },
        {
          service: "QR Menu / Digital Menu Programming",
          setup: "$399-$999",
          monthly: "$99-$199/mo",
        },
        {
          service: "Table QR Experience",
          setup: "$399-$1,500",
          monthly: "$99-$199/mo",
        },
        {
          service: "Review Generation System",
          setup: "$399-$799",
          monthly: "$99-$199/mo",
        },
        {
          service: "Birthday Club / VIP Club",
          setup: "$499-$1,500",
          monthly: "$149-$299/mo",
        },
        {
          service: "Guest Wi-Fi Marketing",
          setup: "$750-$1,500",
          monthly: "$199-$399/mo",
        },
        {
          service: "Restaurant Monitoring Pro",
          setup: "$499-$999",
          monthly: "$199-$399/mo",
        },
        {
          service: "Complete Restaurant Technology Stack",
          setup: "$4,500-$12,000+",
          monthly: "$799-$1,499/mo",
          includes: [
            "Managed restaurant network",
            "POS integration support",
            "Staff Wi-Fi",
            "Guest Wi-Fi",
            "Backup internet support",
            "Restaurant monitoring",
            "QR menu",
            "Table QR Experience",
            "Loyalty program setup",
            "Review generation",
            "Guest Wi-Fi marketing",
            "Delivery app integration support",
            "Monthly technology review",
          ],
        },
      ],
    },
  ],

  rules: [
    "Hardware, carrier service, cabling, permits, and third-party software subscriptions are not included unless listed in the quote.",
    "Monthly plans include remote monitoring and standard support during business hours.",
    "Emergency, after-hours, cabling, advanced security, and multi-location projects may require custom quotes.",
    "Final pricing depends on site size, number of devices, internet providers, POS environment, cloud storage usage, and support requirements.",
  ],
};

module.exports = pricingData;
