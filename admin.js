/* In-browser editor for data/site.json. Nothing is sent anywhere except to api.github.com when you press Publish. */
(function () {
  "use strict";

  var DRAFT_KEY = "site_draft_v1";
  var CFG_KEY = "site_gh_cfg_v1";
  var data = null;
  var tab = "Profile";
  var dirty = false;

  function $(s) { return document.querySelector(s); }

  function el(tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === "class") e.className = v;
      else if (k === "value") e.value = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) e.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var kids = [].concat(arguments[i]);
      kids.forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        e.append(c instanceof Node ? c : document.createTextNode(String(c)));
      });
    }
    return e;
  }

  function btn(label, fn, cls) { return el("button", { type: "button", onclick: fn, class: cls || "" }, label); }

  // ---------- status / draft ----------
  function setStatus(msg, kind) {
    var s = $("#status");
    s.textContent = msg;
    s.className = kind || "";
  }

  // When opened inside the page's edit drawer, show every change live on the page behind it.
  function preview() {
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: "site-data", data: data }, location.origin);
    } catch (e) { /* ignore */ }
  }

  function changed() {
    dirty = true;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    setStatus("Unpublished changes (draft kept in this browser)", "dirty");
    preview();
  }

  // ---------- link text helpers ----------
  function linksToText(arr) {
    return (arr || []).map(function (l) { return l.label + " | " + l.url; }).join("\n");
  }
  function textToLinks(t) {
    return String(t).split("\n").map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) {
      var i = s.indexOf("|");
      if (i < 0) return /^https?:/i.test(s) ? { label: "link", url: s } : { label: s, url: "" };
      return { label: s.slice(0, i).trim(), url: s.slice(i + 1).trim() };
    });
  }

  // ---------- generic field ----------
  function field(obj, f) {
    var type = f.type || "text", input;
    if (type === "textarea" || type === "links") input = el("textarea", { rows: f.rows || (type === "links" ? 3 : 4) });
    else if (type === "select") input = el("select", {}, f.options.map(function (o) { return el("option", { value: o }, o); }));
    else input = el("input", { type: "text" });

    if (type === "links") input.value = linksToText(obj[f.key]);
    else input.value = obj[f.key] == null ? "" : obj[f.key];

    input.addEventListener("input", function () {
      obj[f.key] = type === "links" ? textToLinks(input.value) : input.value;
      changed();
    });
    return el("div", { class: "field" + (f.wide ? " wide" : "") },
      el("label", {}, f.label), input, f.hint ? el("div", { class: "hint" }, f.hint) : null);
  }

  function form(obj, fields) {
    return el("div", { class: "grid" }, fields.map(function (f) { return field(obj, f); }));
  }

  // ---------- list editor (add / delete / reorder) ----------
  function listEditor(arr, fields, blank, titleFn, addTop, onDelete) {
    var wrap = el("div");
    function move(i, d) {
      var j = i + d;
      if (j < 0 || j >= arr.length) return;
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      changed(); draw();
    }
    function draw() {
      wrap.innerHTML = "";
      wrap.append(btn("+ Add new", function () {
        if (addTop) arr.unshift(blank()); else arr.push(blank());
        changed(); draw();
      }, "primary"));
      wrap.append(el("div", { style: "height:12px" }));
      if (!arr.length) wrap.append(el("p", { class: "hint" }, "Nothing here yet."));
      arr.forEach(function (item, i) {
        wrap.append(el("div", { class: "card" },
          el("div", { class: "cardhead" },
            el("strong", {}, titleFn ? titleFn(item, i) : "#" + (i + 1)),
            el("span", { class: "btns" },
              btn("↑", function () { move(i, -1); }),
              btn("↓", function () { move(i, 1); }),
              btn("Delete", function () {
                if (confirm("Delete this item?")) { if (onDelete) onDelete(item); arr.splice(i, 1); changed(); draw(); }
              }))),
          form(item, fields)));
      });
    }
    draw();
    return wrap;
  }

  // ---------- tabs ----------
  var TABS = {
    Profile: function (p) {
      p.append(el("h2", {}, "About you"));
      p.append(form(data.profile, [
        { key: "name", label: "Name" },
        { key: "authorName", label: "Name as it appears in author lists (shown in bold)" },
        { key: "title", label: "Position" },
        { key: "affiliation", label: "Affiliation" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
        { key: "photo", label: "Photo path or URL", hint: "Upload a photo in the Files tab, then it is filled in automatically." },
        { key: "cv", label: "CV path or URL", hint: "Upload your CV in the Files tab, or paste a link." },
        { key: "intro", label: "Short intro on the home page (first person)", type: "textarea", wide: true },
        { key: "statement", label: "Research statement (one paragraph)", type: "textarea", wide: true },
        { key: "bio", label: "Bio page text (third person, about 100 words)", type: "textarea", rows: 6, wide: true }
      ]));
      p.append(el("h2", {}, "Profile links"));
      p.append(form(data.profile, [
        { key: "links", label: "One per line: Label | URL  (Google Scholar, ORCID, GitHub, LinkedIn, ...)", type: "links", rows: 6, wide: true }
      ]));
      p.append(el("h2", {}, "Automatic publication sync"));
      p.append(el("p", { class: "hint" }, "Fill in ONE of these so new papers are added automatically every week. ORCID (free, most reliable) is recommended. A Google Scholar ID works too, but needs a SerpAPI key (see README)."));
      p.append(form(data.profile, [
        { key: "orcid", label: "ORCID iD (e.g. 0000-0002-1825-0097)", hint: "Create one free at orcid.org, then add your papers there." },
        { key: "scholarId", label: "Google Scholar ID (the user=... part of your profile link)" }
      ]));
      p.append(el("h2", {}, "Research themes"));
      p.append(listEditor(data.profile.themes = data.profile.themes || [], [
        { key: "title", label: "Theme" },
        { key: "desc", label: "One-line description" }
      ], function () { return { title: "", desc: "" }; }, function (t) { return t.title || "New theme"; }));
    },

    News: function (p) {
      p.append(el("p", { class: "hint" }, "The newest six items are shown on the home page. New items are added at the top."));
      p.append(listEditor(data.news = data.news || [], [
        { key: "date", label: "Date (any format, e.g. 2026-11 or Nov 2026)" },
        { key: "text", label: "News", type: "textarea", rows: 2, wide: true }
      ], function () { return { date: new Date().toISOString().slice(0, 7), text: "" }; },
      function (n) { return (n.date || "") + "  " + (n.text || "").slice(0, 60); }, true));
    },

    Publications: function (p) {
      p.append(el("p", { class: "hint" }, "Papers tagged (auto) were added by the weekly sync from ORCID or Google Scholar. You can edit them (add code links, notes) and your edits are kept. Deleting one stops it coming back. Set status to \"under review\" or \"in preparation\" and the paper moves to its own section."));
      var syncOut = el("pre", { id: "log" }, "");
      p.append(btn("Sync publications now", function () { syncOut.textContent = "Starting ..."; dispatchSync(syncOut); }));
      p.append(" ");
      p.append(el("span", { class: "hint" }, "Needs a token with Actions: Read and write. After it runs (about a minute), reload this editor to see new papers."));
      p.append(syncOut);
      p.append(el("div", { style: "height:12px" }));
      p.append(listEditor(data.publications = data.publications || [], [
        { key: "year", label: "Year" },
        { key: "status", label: "Status", type: "select", options: ["published", "under review", "in preparation"] },
        { key: "title", label: "Title", wide: true },
        { key: "authors", label: "Authors", wide: true },
        { key: "venue", label: "Venue (journal or conference, year)", wide: true },
        { key: "links", label: "Links, one per line: Label | URL  (paper, arXiv, code, dataset, slides)", type: "links", wide: true },
        { key: "note", label: "Note (optional, e.g. Best Paper Award)", wide: true }
      ], function () {
        return { year: String(new Date().getFullYear()), title: "", authors: data.profile.authorName || data.profile.name, venue: "", status: "published", links: [], note: "" };
      }, function (x) { return (x.year || "") + "  " + (x.title || "New publication") + (x.auto ? "  (auto)" : ""); }, true,
      function (x) {
        if (!x.key) return;
        data.ignored = data.ignored || [];
        if (data.ignored.indexOf(x.key) < 0) data.ignored.push(x.key);
      }));
    },

    Students: function (p) {
      data.students = data.students || { current: [], past: [] };
      p.append(el("h2", {}, "Current students"));
      p.append(listEditor(data.students.current = data.students.current || [], [
        { key: "name", label: "Name" },
        { key: "url", label: "Their website or profile link" },
        { key: "role", label: "Role (e.g. MS student, intern)" },
        { key: "photo", label: "Photo path or URL (optional)" },
        { key: "project", label: "Project they work on", type: "textarea", rows: 2, wide: true }
      ], function () { return { name: "", url: "", role: "", project: "", photo: "" }; },
      function (s) { return s.name || "New student"; }));
      p.append(el("h2", {}, "Past students"));
      p.append(listEditor(data.students.past = data.students.past || [], [
        { key: "name", label: "Name" },
        { key: "url", label: "Their website or profile link" },
        { key: "now", label: "Where they are now", wide: true }
      ], function () { return { name: "", url: "", now: "" }; },
      function (s) { return s.name || "New past student"; }));
    },

    Courses: function (p) {
      data.courses = data.courses || { current: [], former: [], tutorials: [] };
      [["current", "Current courses"], ["former", "Former courses"], ["tutorials", "Tutorials and other educational content"]].forEach(function (g) {
        p.append(el("h2", {}, g[1]));
        p.append(listEditor(data.courses[g[0]] = data.courses[g[0]] || [], [
          { key: "text", label: "Course code, title and term" },
          { key: "url", label: "Link (optional)" }
        ], function () { return { text: "", url: "" }; }, function (c) { return c.text || "New course"; }));
      });
    },

    Opportunities: function (p) {
      p.append(el("p", { class: "hint" }, "Shown on the Home and Group pages. Leave empty to hide it."));
      p.append(form(data, [{ key: "opportunities", label: "Note for prospective students and collaborators", type: "textarea", rows: 6, wide: true }]));
    },

    Files: function (p) {
      p.append(el("p", {}, "Upload your CV, photo or other images straight to your GitHub repository (needs the connection details from the Publish tab)."));
      var file = el("input", { type: "file" });
      var kind = el("select", {},
        el("option", { value: "cv" }, "My CV (saved as assets/cv.pdf)"),
        el("option", { value: "photo" }, "My profile photo (assets/photo.<ext>)"),
        el("option", { value: "other" }, "Another file, e.g. a student photo (assets/<filename>)"));
      var out = el("pre", { id: "log" }, "");
      p.append(el("div", { class: "field" }, el("label", {}, "File"), file));
      p.append(el("div", { class: "field" }, el("label", {}, "Use it as"), kind));
      p.append(btn("Upload to GitHub", function () {
        var f = file.files[0];
        if (!f) { out.textContent = "Choose a file first."; return; }
        var ext = (f.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        var path = kind.value === "cv" ? "assets/cv.pdf" : kind.value === "photo" ? "assets/photo." + (ext || "jpg") : "assets/" + f.name.replace(/[^A-Za-z0-9._-]/g, "_");
        out.textContent = "Uploading " + path + " ...";
        var rd = new FileReader();
        rd.onload = function () {
          putFile(path, String(rd.result).split(",")[1], "Upload " + path)
            .then(function () {
              if (kind.value === "cv") data.profile.cv = path;
              if (kind.value === "photo") data.profile.photo = path;
              changed();
              out.textContent = "Uploaded. Path to use in other fields: " + path + "\nNow press \"Publish to GitHub\" to save the updated site data.";
            })
            .catch(function (e) { out.textContent = "Upload failed: " + e.message; });
        };
        rd.readAsDataURL(f);
      }, "primary"));
      p.append(el("div", { style: "height:12px" }));
      p.append(out);
    },

    Publish: function (p) {
      var cfg = loadCfg();
      var repo = el("input", { type: "text", value: cfg.repo || "", placeholder: "username/username.github.io" });
      var branch = el("input", { type: "text", value: cfg.branch || "main" });
      var token = el("input", { type: "password", value: cfg.token || "", placeholder: "github_pat_..." });
      var remember = el("input", { type: "checkbox" });
      remember.checked = !!cfg.remember;
      var out = el("pre", { id: "log" }, "");
      function save() {
        var c = { repo: repo.value.trim(), branch: branch.value.trim() || "main", remember: remember.checked, token: token.value.trim() };
        sessionCfg = c;
        try {
          localStorage.setItem(CFG_KEY, JSON.stringify(remember.checked ? c : { repo: c.repo, branch: c.branch, remember: false }));
        } catch (e) { /* ignore */ }
      }
      p.append(el("p", {}, "Connect once, then every change is a single click. Create a fine-grained token at GitHub → Settings → Developer settings → Personal access tokens, limited to this one repository with Contents: Read and write."));
      p.append(el("div", { class: "field" }, el("label", {}, "Repository (owner/name)"), repo));
      p.append(el("div", { class: "field" }, el("label", {}, "Branch"), branch));
      p.append(el("div", { class: "field" }, el("label", {}, "Token (kept only in this browser)"), token));
      p.append(el("label", {}, remember, " Remember the token on this device (leave unticked on shared computers)"));
      p.append(el("div", { style: "height:12px" }));
      p.append(btn("Save connection", function () { save(); out.textContent = "Saved."; }));
      p.append(" ");
      p.append(btn("Test connection", function () {
        save(); out.textContent = "Testing ...";
        gh("GET", "data/site.json").then(function (r) {
          out.textContent = r.status === 200 ? "Connected. data/site.json found." : "Reached GitHub, but got status " + r.status + ": " + (r.json && r.json.message || "");
        }).catch(function (e) { out.textContent = "Failed: " + e.message; });
      }));
      p.append(" ");
      p.append(btn("Publish to GitHub", function () { save(); publish(out); }, "primary"));
      p.append(el("div", { style: "height:12px" }));
      p.append(out);
      p.append(el("h2", {}, "This device"));
      p.append(btn("Hide the “Edit this page” button and forget my token", function () {
        try { localStorage.removeItem("site_editor"); localStorage.removeItem(CFG_KEY); } catch (e) { /* ignore */ }
        sessionCfg = null;
        out.textContent = "Done. Open admin.html again any time to bring the button back.";
      }));
    }
  };

  // ---------- GitHub ----------
  var sessionCfg = null;
  function loadCfg() {
    if (sessionCfg) return sessionCfg;
    try { return JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); } catch (e) { return {}; }
  }

  function gh(method, path, body) {
    var c = loadCfg();
    if (!c.repo || !c.token) return Promise.reject(new Error("Fill in repository and token in the Publish tab first."));
    var url = "https://api.github.com/repos/" + c.repo + "/contents/" + path.split("/").map(encodeURIComponent).join("/");
    if (method === "GET") url += "?ref=" + encodeURIComponent(c.branch || "main");
    return fetch(url, {
      method: method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + c.token,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; });
    });
  }

  function putFile(path, b64, message) {
    var c = loadCfg();
    return gh("GET", path).then(function (r) {
      var sha = r.status === 200 ? r.json.sha : undefined;
      if (r.status !== 200 && r.status !== 404) throw new Error((r.json && r.json.message) || "GitHub status " + r.status);
      return gh("PUT", path, { message: message, content: b64, branch: c.branch || "main", sha: sha });
    }).then(function (r) {
      if (r.status !== 200 && r.status !== 201) throw new Error((r.json && r.json.message) || "GitHub status " + r.status);
      return r;
    });
  }

  function dispatchSync(out) {
    var c = loadCfg();
    if (!c.repo || !c.token) { out.textContent = "Fill in repository and token in the Publish tab first."; return; }
    fetch("https://api.github.com/repos/" + c.repo + "/actions/workflows/sync-publications.yml/dispatches", {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + c.token, "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ ref: c.branch || "main" })
    }).then(function (r) {
      if (r.status === 204) out.textContent = "Sync started. New papers appear in about a minute. Reload this editor afterwards.";
      else return r.json().catch(function () { return {}; }).then(function (j) {
        out.textContent = "Could not start the sync (status " + r.status + "): " + (j.message || "") +
          (r.status === 404 ? "\nIs .github/workflows/sync-publications.yml uploaded?" : "") +
          (r.status === 403 || r.status === 401 ? "\nYour token needs Actions: Read and write." : "");
      });
    }).catch(function (e) { out.textContent = "Failed: " + e.message; });
  }

  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function publish(out) {
    out = out || { textContent: "" };
    data.updated = new Date().toISOString().slice(0, 10);
    out.textContent = "Publishing ...";
    putFile("data/site.json", utf8ToB64(JSON.stringify(data, null, 2) + "\n"), "Update site content")
      .then(function () {
        dirty = false;
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
        setStatus("Published. The live site updates in about a minute.", "ok");
        preview();
        out.textContent = "Done. GitHub Pages will refresh the site in about a minute.";
      })
      .catch(function (e) { out.textContent = "Publish failed: " + e.message; setStatus("Publish failed", "dirty"); });
  }

  // ---------- UI ----------
  function drawTabs() {
    var t = $("#tabs");
    t.innerHTML = "";
    Object.keys(TABS).forEach(function (name) {
      t.append(el("button", { type: "button", class: name === tab ? "on" : "", onclick: function () { tab = name; render(); } }, name));
    });
  }

  function render() {
    drawTabs();
    var p = $("#panel");
    p.innerHTML = "";
    TABS[tab](p);
  }

  function download() {
    data.updated = new Date().toISOString().slice(0, 10);
    var blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
    var a = el("a", { href: URL.createObjectURL(blob), download: "site.json" });
    document.body.append(a); a.click(); a.remove();
  }

  function start() {
    try { localStorage.setItem("site_editor", "1"); } catch (e) { /* ignore */ }
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (TABS[h]) tab = h;
    if (/[?&]embed=1/.test(location.search)) document.body.classList.add("embed");
    $("#btnDownload").addEventListener("click", download);
    $("#btnPublish").addEventListener("click", function () {
      var c = loadCfg();
      if (!c.repo || !c.token) {
        tab = "Publish"; render();
        setStatus("Enter your repository and token, then press Publish to GitHub.", "dirty");
        return;
      }
      publish($("#log"));
    });
    $("#btnDiscard").addEventListener("click", function () {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
      location.reload();
    });

    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { /* ignore */ }

    fetch("data/site.json?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (live) {
        if (draft) { data = draft; dirty = true; $("#banner").style.display = "block"; setStatus("Unpublished changes (draft kept in this browser)", "dirty"); }
        else { data = live; setStatus("Loaded live data. Edit, then press Publish."); }
        data.profile = data.profile || {};
        render();
      })
      .catch(function () {
        if (draft) { data = draft; render(); setStatus("Offline draft loaded", "dirty"); return; }
        $("#panel").textContent = "Could not load data/site.json. Open this page from your published site, or run a local server (python3 -m http.server).";
        setStatus("Could not load data", "dirty");
      });
  }

  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  if (typeof document !== "undefined") start();
})();
