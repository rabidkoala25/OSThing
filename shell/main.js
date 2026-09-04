/** Boot orchestration: load manifests, load apps, then reveal the desktop. */
(async function () {
  await window.WebOS.Sprites.load();

  window.WebOS.Boot.start();

  const cursorPath = window.WebOS.Sprites.path("cursor");
  if (cursorPath) {
    document.getElementById("os-root").style.cursor = `url('${cursorPath}') 0 0, auto`;
  }

  await window.WebOS.Apps.loadManifest();
  await window.WebOS.Apps.loadAll();

  window.WebOS.Desktop.init();
  window.WebOS.Taskbar.init();

  await window.WebOS.Boot.finish();
})();
