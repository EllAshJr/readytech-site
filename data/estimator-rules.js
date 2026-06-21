"use strict";

const businessTypes = [
  { value: "restaurant", label: "Restaurant / Cafe / Bar" },
  { value: "retail", label: "Retail Store" },
  { value: "professional-office", label: "Professional Office" },
  { value: "medical-dental", label: "Medical / Dental Office" },
  { value: "construction-field", label: "Construction / Field Office" },
  { value: "warehouse", label: "Warehouse / Light Industrial" },
  { value: "home-office", label: "Home Office / Residential" },
  { value: "nonprofit-church", label: "Nonprofit / Church" },
  { value: "multi-location", label: "Multi-Location / Franchise" },
  { value: "other", label: "Other" },
];

const services = [
  {
    slug: "managed-vpn",
    label: "Managed VPN Services",
    description: "Remote-access and site-to-site VPN design, setup, monitoring, and repair.",
  },
  {
    slug: "private-cloud",
    label: "Private Cloud Services",
    description: "Private storage, permissions, backup, restore assistance, and remote access.",
  },
  {
    slug: "network-monitoring",
    label: "Network Monitoring Services",
    description: "NOC-style uptime, firewall, switch, Wi-Fi, server, POS, and device monitoring.",
  },
  {
    slug: "business-wifi",
    label: "Business Wi-Fi Services",
    description: "Staff and guest Wi-Fi, access-point management, coverage tuning, and portals.",
  },
  {
    slug: "backup-internet",
    label: "Backup Internet Services",
    description: "LTE, 5G, or dual-ISP failover design, testing, and monitoring.",
  },
  {
    slug: "restaurant-technology",
    label: "Restaurant Technology Services",
    description: "Restaurant networking, POS support, QR menus, loyalty, reviews, and monitoring.",
  },
];

const recommendations = {
  restaurant: [
    "restaurant-technology",
    "business-wifi",
    "backup-internet",
    "network-monitoring",
    "managed-vpn",
  ],
  retail: ["business-wifi", "backup-internet", "network-monitoring", "managed-vpn"],
  "professional-office": [
    "managed-vpn",
    "private-cloud",
    "network-monitoring",
    "business-wifi",
    "backup-internet",
  ],
  "medical-dental": [
    "managed-vpn",
    "private-cloud",
    "network-monitoring",
    "business-wifi",
    "backup-internet",
  ],
  "construction-field": ["managed-vpn", "backup-internet", "business-wifi", "network-monitoring"],
  warehouse: ["business-wifi", "network-monitoring", "backup-internet", "managed-vpn"],
  "home-office": ["managed-vpn", "private-cloud", "backup-internet"],
  "nonprofit-church": ["business-wifi", "network-monitoring", "private-cloud", "backup-internet"],
  "multi-location": [
    "managed-vpn",
    "network-monitoring",
    "business-wifi",
    "backup-internet",
    "private-cloud",
  ],
  other: [],
};

const rejectionReasons = [
  "Price too high",
  "Not ready yet",
  "Selected another provider",
  "Services did not match my needs",
  "Need to revise scope",
  "Other",
];

const allowedServiceSlugs = new Set(services.map((service) => service.slug));
const allowedBusinessTypes = new Set(businessTypes.map((type) => type.value));

module.exports = {
  businessTypes,
  services,
  recommendations,
  rejectionReasons,
  allowedServiceSlugs,
  allowedBusinessTypes,
  estimateValidityDays: 14,
};
