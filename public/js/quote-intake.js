"use strict";

(function () {
  const businessType = document.getElementById("business-type");
  const serviceCheckboxes = [...document.querySelectorAll("[data-service-checkbox]")];
  const serviceSections = [...document.querySelectorAll("[data-service-section]")];
  const recommendationNote = document.getElementById("recommendation-note");
  const recommendations = window.READYTECH_QUOTE_RECOMMENDATIONS || {};

  function updateSections() {
    const selected = new Set(
      serviceCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value),
    );

    for (const section of serviceSections) {
      section.hidden = !selected.has(section.dataset.serviceSection);
    }
  }

  function recommendServices() {
    if (!businessType) return;
    const recommended = recommendations[businessType.value] || [];
    if (recommended.length === 0) {
      if (recommendationNote) recommendationNote.textContent = "Select the services that best match your project.";
      return;
    }

    const labels = [];
    for (const checkbox of serviceCheckboxes) {
      if (recommended.includes(checkbox.value)) {
        labels.push(checkbox.closest("label")?.querySelector("strong")?.textContent || checkbox.value);
      }
    }

    if (recommendationNote) {
      recommendationNote.textContent = `Common choices for this business type: ${labels.join(", ")}. You remain in control of the selections.`;
    }
  }

  function applyRecommendationsOnce() {
    if (!businessType || !businessType.value) return;
    const anySelected = serviceCheckboxes.some((checkbox) => checkbox.checked);
    if (anySelected) return;

    const recommended = recommendations[businessType.value] || [];
    for (const checkbox of serviceCheckboxes) {
      checkbox.checked = recommended.includes(checkbox.value);
    }
    updateSections();
  }

  for (const checkbox of serviceCheckboxes) {
    checkbox.addEventListener("change", updateSections);
  }

  if (businessType) {
    businessType.addEventListener("change", function () {
      recommendServices();
      applyRecommendationsOnce();
    });
  }

  recommendServices();
  updateSections();
})();

/* READYTECH TECHNICAL FIELD TOOLTIPS */
(function () {
  "use strict";

  /*
   * Only fields listed here receive an information icon.
   * Common fields such as name, email, phone, city, ZIP,
   * square footage, and number of locations are intentionally omitted.
   */
  const HELP_TEXT = Object.freeze({
    equipment_known:
      "Tell us whether you know the brands or models of your current router, firewall, switches, or Wi-Fi equipment.",

    /* Managed VPN */
    vpn_type:
      "Remote access connects people to one business location. Site-to-site securely connects two or more locations.",
    vpn_users:
      "Count the people who will connect securely from outside the business.",
    vpn_firewall_brand:
      "The manufacturer of the device controlling your internet traffic, such as Fortinet, Meraki, or UniFi.",
    vpn_mfa:
      "Multi-factor authentication adds a second sign-in step, such as a phone code or authentication app.",
    vpn_state:
      "Tell us whether this is a new VPN, a working VPN, or a VPN that is currently down.",
    vpn_monitoring:
      "ReadyTech watches the VPN connection and alerts you when it becomes unavailable.",
    vpn_after_hours:
      "Choose Yes when installation must happen after closing to avoid interrupting business.",

    /* Private Cloud */
    cloud_storage_gb:
      "Estimate the amount of data you need to store. About 1,000 GB equals 1 TB.",
    cloud_growth_percent:
      "Estimate how much your stored data may increase during the next 12 months.",
    cloud_workstations:
      "Count desktop and laptop computers that need automatic backup.",
    cloud_servers:
      "Count physical or virtual servers that need automatic backup.",
    cloud_migration:
      "Choose Yes when existing files must be moved into the new private cloud.",
    cloud_backup_frequency:
      "How often new or changed information should be copied into a backup.",
    cloud_retention_days:
      "The number of days older backup versions should remain available.",
    cloud_remote_access:
      "Allows approved users to reach business files securely while away from the location.",
    cloud_restore_assistance:
      "ReadyTech helps recover files after deletion, damage, ransomware, or equipment failure.",
    cloud_managed_backup:
      "Adds ongoing backup monitoring, testing, and support.",

    /* Network Monitoring */
    monitor_routers:
      "Count the routers or firewalls that connect your locations to the internet.",
    monitor_switches:
      "Managed switches connect wired devices and can report their health and availability.",
    monitor_access_points:
      "Wi-Fi access points are the devices that broadcast your wireless network.",
    monitor_servers:
      "Count physical or virtual servers whose availability should be monitored.",
    monitor_critical_devices:
      "Count POS, payment, or other devices whose outage would interrupt business.",
    monitor_printers:
      "Include important printers and KDS devices. KDS means Kitchen Display System.",
    monitor_alerting:
      "Business-hours coverage watches during the workday. 24/7 coverage watches at all times.",
    monitor_response:
      "Priority response provides faster review and escalation when an alert occurs.",
    monitor_reporting:
      "A monthly report summarizes outages, device health, trends, and recommended improvements.",

    /* Business Wi-Fi */
    wifi_access_points:
      "Count the devices that broadcast Wi-Fi throughout the property. Enter 0 when unsure.",
    wifi_concurrent_devices:
      "Estimate how many phones, tablets, POS devices, and computers use Wi-Fi at the busiest time.",
    wifi_portal:
      "A branded sign-in page or QR code customers use before joining guest Wi-Fi.",
    wifi_cabling:
      "Ethernet cabling may be needed to connect Wi-Fi access points to your network.",
    wifi_dead_zones:
      "Areas where Wi-Fi is weak, unreliable, slow, or completely unavailable.",
    wifi_filtering:
      "Blocks selected unsafe, malicious, or inappropriate websites on the network.",

    /* Backup Internet */
    backup_type:
      "LTE and 5G use cellular service. Dual ISP uses a second wired internet provider.",
    backup_speed:
      "The minimum internet speed your business needs while the primary connection is down.",
    backup_router:
      "A cellular router connects your business network to LTE or 5G backup internet.",
    backup_carrier:
      "An active cellular data plan from a provider such as AT&T, T-Mobile, or Verizon.",
    backup_auto_failover:
      "Automatically switches the business to backup internet when the primary connection fails.",
    backup_testing:
      "A scheduled test confirms the backup internet connection still works.",
    backup_downtime:
      "The longest time the business can remain offline before operations are seriously affected.",

    /* Restaurant Technology */
    restaurant_pos_vendor:
      "The company providing your point-of-sale system, such as Toast, Square, Clover, or SpotOn.",
    restaurant_pos_terminals:
      "Count the registers or devices staff use to enter customer orders.",
    restaurant_payment_terminals:
      "Count the card readers used to accept customer payments.",
    restaurant_printers:
      "Count receipt printers and kitchen ticket printers.",
    restaurant_kds:
      "Kitchen Display Systems are screens that show incoming orders to kitchen staff.",
    restaurant_access_points:
      "Count the devices currently broadcasting Wi-Fi inside the restaurant.",
    restaurant_network_level:
      "Choose the base restaurant networking package. Additional services can be selected below.",
    restaurant_pos_readiness:
      "Checks the network before a new POS installation or major POS upgrade.",
    restaurant_pos_cutover:
      "Coordinates the move from the old POS environment to the new POS environment.",
    restaurant_pos_support:
      "Ongoing help with POS connectivity, printers, payment terminals, and related network issues.",
    restaurant_qr_menu:
      "A mobile-friendly menu customers open by scanning a QR code.",
    restaurant_table_qr:
      "A branded QR experience for menus, rewards, reviews, feedback, or online ordering.",
    restaurant_loyalty:
      "A points-based or visit-based rewards program that encourages repeat business.",
    restaurant_guest_wifi_marketing:
      "Uses the guest Wi-Fi sign-in page to promote menus, rewards, reviews, and special offers.",
    restaurant_monitoring:
      "Watches internet, Wi-Fi, POS connectivity, and important restaurant devices for outages.",
    restaurant_after_hours:
      "Performs POS work after closing to reduce disruption to restaurant operations.",
    restaurant_complete_stack:
      "Bundles networking, POS support, Wi-Fi, monitoring, QR tools, loyalty, and delivery integrations.",
  });

  let openIcon = null;

  function readableFieldName(label, field) {
    const copy = label.cloneNode(true);

    copy
      .querySelectorAll("input, select, textarea, button, small")
      .forEach((element) => element.remove());

    const text = copy.textContent.replace(/\s+/g, " ").trim();

    return (
      text ||
      field.name
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  }

  function closeTooltip(icon) {
    if (!icon) return;

    icon.classList.remove("is-open");
    icon.setAttribute("aria-expanded", "false");

    if (openIcon === icon) {
      openIcon = null;
    }
  }

  function closeOpenTooltip(except = null) {
    if (openIcon && openIcon !== except) {
      closeTooltip(openIcon);
    }
  }

  function addTooltip(field, text, index) {
    const label = field.closest("label");

    if (!label) return;

    if (
      label.parentElement &&
      label.parentElement.classList.contains("quote-field-with-info")
    ) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "quote-field-with-info";

    if (label.classList.contains("quote-inline-check")) {
      wrapper.classList.add("quote-inline-info");
    }

    label.parentNode.insertBefore(wrapper, label);
    wrapper.appendChild(label);

    const readableName = readableFieldName(label, field);
    const tooltipId = `quote-tooltip-${field.name}-${index}`;

    const icon = document.createElement("button");
    icon.type = "button";
    icon.className = "quote-info-icon";
    icon.dataset.infoFor = field.name;
    icon.setAttribute("aria-label", `Information about ${readableName}`);
    icon.setAttribute("aria-describedby", tooltipId);
    icon.setAttribute("aria-expanded", "false");

    const iconLetter = document.createElement("span");
    iconLetter.className = "quote-info-letter";
    iconLetter.setAttribute("aria-hidden", "true");
    iconLetter.textContent = "i";

    const tooltip = document.createElement("span");
    tooltip.id = tooltipId;
    tooltip.className = "quote-info-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.textContent = text;

    icon.appendChild(iconLetter);
    icon.appendChild(tooltip);
    wrapper.appendChild(icon);

    icon.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const opening = !icon.classList.contains("is-open");

      closeOpenTooltip(icon);
      icon.classList.toggle("is-open", opening);
      icon.setAttribute("aria-expanded", String(opening));

      if (opening) {
        openIcon = icon;
      } else if (openIcon === icon) {
        openIcon = null;
      }
    });

    icon.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeTooltip(icon);
        icon.focus();
      }
    });
  }

  Object.entries(HELP_TEXT).forEach(function ([fieldName, helpText]) {
    const fields = document.querySelectorAll(`[name="${fieldName}"]`);

    fields.forEach(function (field, index) {
      addTooltip(field, helpText, index);
    });
  });

  const disclaimer = document.querySelector(".quote-disclaimer");

  if (disclaimer && !document.querySelector(".quote-info-note")) {
    const note = document.createElement("p");
    note.className = "quote-info-note";
    note.innerHTML =
      '<span class="quote-info-sample" aria-hidden="true">i</span>' +
      " Hover, focus, or tap an information icon for a plain-language explanation.";

    disclaimer.insertAdjacentElement("afterend", note);
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".quote-info-icon")) {
      closeOpenTooltip();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeOpenTooltip();
    }
  });
})();
/* END READYTECH TECHNICAL FIELD TOOLTIPS */
