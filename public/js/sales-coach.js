"use strict";

(function () {
  const copyButton = document.querySelector("[data-copy-sales-plan]");
  const source = document.querySelector(".sales-copy-source");

  if (copyButton && source) {
    copyButton.addEventListener("click", async () => {
      const original = copyButton.textContent;
      try {
        await navigator.clipboard.writeText(source.value);
        copyButton.textContent = "Copied";
      } catch {
        source.removeAttribute("aria-hidden");
        source.style.position = "static";
        source.style.width = "100%";
        source.style.height = "220px";
        source.style.opacity = "1";
        source.select();
        document.execCommand("copy");
        source.style.position = "fixed";
        source.style.left = "-10000px";
        source.style.width = "1px";
        source.style.height = "1px";
        source.style.opacity = "0";
        source.setAttribute("aria-hidden", "true");
        copyButton.textContent = "Copied";
      }

      window.setTimeout(() => {
        copyButton.textContent = original;
      }, 1800);
    });
  }
})();
