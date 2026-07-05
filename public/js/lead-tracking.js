(function () {
  function sendLeadEvent(label, href) {
    if (!label || !navigator.sendBeacon) return;

    const data = new URLSearchParams({
      event: label,
      href: href || "",
      path: window.location.pathname,
    });

    navigator.sendBeacon("/lead-events", data);
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-track-lead]");
    if (!target) return;

    sendLeadEvent(target.getAttribute("data-track-lead"), target.getAttribute("href"));
  });
})();
