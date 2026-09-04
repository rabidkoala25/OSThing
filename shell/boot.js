/** Boot screen: shows the sprite-driven boot logo while the shell initializes. */
(function () {
  window.WebOS = window.WebOS || {};

  const MIN_BOOT_MS = 900;
  let startedAt = 0;
  let fillTimer = null;

  window.WebOS.Boot = {
    start() {
      startedAt = Date.now();
      const logoPath = window.WebOS.Sprites.path("boot_logo");
      if (logoPath) document.getElementById("boot-logo-img").src = logoPath;

      const fill = document.getElementById("boot-bar-fill");
      let pct = 0;
      fillTimer = setInterval(() => {
        pct = Math.min(90, pct + Math.random() * 12);
        fill.style.width = `${pct}%`;
      }, 120);
    },

    async finish() {
      const fill = document.getElementById("boot-bar-fill");
      clearInterval(fillTimer);
      fill.style.width = "100%";

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_BOOT_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_BOOT_MS - elapsed));
      }

      const screen = document.getElementById("boot-screen");
      screen.classList.add("boot-hidden");
      setTimeout(() => screen.remove(), 500);
    },
  };
})();
