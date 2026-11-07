/* Owner-only "Edit this page" button. It appears only in a browser where you have opened admin.html before,
   so visitors never see it. It opens the editor in a side drawer and shows your changes live on the page. */
(function () {
  "use strict";
  try { if (!localStorage.getItem("site_editor")) return; } catch (e) { return; }

  var page = document.body.getAttribute("data-page") || "home";
  var tabFor = { home: "Profile", publications: "Publications", group: "Students", bio: "Profile", courses: "Courses" };
  var tab = tabFor[page] || "Profile";

  var css = document.createElement("style");
  css.textContent =
    "#ed-btn{position:fixed;right:18px;bottom:18px;z-index:9998;padding:10px 16px;border:0;border-radius:24px;background:#1a56a0;color:#fff;font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.25)}" +
    "#ed-drawer{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);z-index:9999;background:#fff;box-shadow:-4px 0 18px rgba(0,0,0,.25);display:none;flex-direction:column}" +
    "#ed-drawer.open{display:flex}" +
    "#ed-head{display:flex;gap:10px;align-items:center;padding:8px 12px;background:#f5f6f8;border-bottom:1px solid #dfe2e6;font:14px -apple-system,Segoe UI,Roboto,sans-serif;color:#1d1d1f}" +
    "#ed-head b{margin-right:auto}#ed-head a{color:#1a56a0}" +
    "#ed-head button{border:1px solid #ccd;background:#fff;border-radius:6px;padding:4px 10px;cursor:pointer}" +
    "#ed-frame{flex:1;border:0;width:100%}";
  document.head.appendChild(css);

  var btn = document.createElement("button");
  btn.id = "ed-btn";
  btn.type = "button";
  btn.textContent = "✎ Edit this page";

  var drawer = document.createElement("div");
  drawer.id = "ed-drawer";
  drawer.innerHTML =
    '<div id="ed-head"><b>Editing</b><a href="admin.html#' + tab + '" target="_blank" rel="noopener">Open in new tab</a>' +
    '<button type="button" id="ed-close">Close</button></div>';
  var frame = document.createElement("iframe");
  frame.id = "ed-frame";
  frame.title = "Site editor";
  drawer.appendChild(frame);

  btn.addEventListener("click", function () {
    if (!frame.getAttribute("src")) frame.setAttribute("src", "admin.html?embed=1#" + tab);
    drawer.classList.add("open");
    btn.style.display = "none";
  });
  drawer.querySelector("#ed-close").addEventListener("click", function () {
    drawer.classList.remove("open");
    btn.style.display = "";
  });

  window.addEventListener("message", function (ev) {
    if (ev.origin !== location.origin) return;
    var m = ev.data;
    if (m && m.type === "site-data" && window.SiteRender && m.data && m.data.profile) window.SiteRender.draw(m.data);
  });

  document.body.appendChild(btn);
  document.body.appendChild(drawer);
})();
