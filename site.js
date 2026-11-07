/* Renders every public page from data/site.json. Edit content in admin.html, not here. */
(function () {
  "use strict";

  var PAGES = [
    ["index.html", "Home", "home"],
    ["publications.html", "Publications", "publications"],
    ["group.html", "Group", "group"],
    ["bio.html", "Bio", "bio"],
    ["courses.html", "Courses", "courses"]
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Block javascript:, data: and other unsafe schemes.
  function safeUrl(u) {
    u = String(u == null ? "" : u).trim();
    var m = u.match(/^([a-z][a-z0-9+.-]*):/i);
    if (m && !/^(https?|mailto)$/i.test(m[1])) return "#";
    return u;
  }

  function a(label, u) {
    var url = safeUrl(u);
    var ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "";
    return '<a href="' + esc(url) + '"' + ext + ">" + esc(label) + "</a>";
  }

  function para(t) {
    return String(t || "")
      .split(/\n{2,}/)
      .filter(function (p) { return p.trim(); })
      .map(function (p) { return "<p>" + esc(p.trim()).replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  function authors(s, name) {
    var h = esc(s);
    if (name) {
      var n = esc(name);
      h = h.split(n).join("<b>" + n + "</b>");
    }
    return h;
  }

  function nameLink(name, url) {
    return url ? a(name, url) : esc(name);
  }

  var R = {};

  R.home = function (d) {
    var p = d.profile, h = "";
    h += '<section class="hero">';
    if (p.photo) h += '<img class="photo" src="' + esc(safeUrl(p.photo)) + '" alt="' + esc(p.name) + '">';
    h += "<div><h1>" + esc(p.name) + '</h1><p class="role">' + esc(p.title) + "<br>" + esc(p.affiliation) + "</p></div></section>";
    h += para(p.intro);

    var links = [];
    if (p.cv) links.push({ label: "CV", url: p.cv });
    (p.links || []).forEach(function (l) { links.push(l); });
    if (links.length) h += '<p class="linkrow">' + links.map(function (l) { return a(l.label, l.url); }).join(" &middot; ") + "</p>";

    h += "<h2>Research</h2>" + para(p.statement);
    if ((p.themes || []).length) {
      h += '<ul class="bul">' + p.themes.map(function (t) {
        return "<li><b>" + esc(t.title) + "</b>" + (t.desc ? " &mdash; " + esc(t.desc) : "") + "</li>";
      }).join("") + "</ul>";
    }

    var news = (d.news || []).slice(0, 6);
    if (news.length) {
      h += "<h2>News</h2><ul class=\"plain\">" + news.map(function (n) {
        return '<li><span class="date">' + esc(n.date) + "</span>" + esc(n.text) + "</li>";
      }).join("") + "</ul>";
    }

    if (d.opportunities) h += '<h2>Opportunities</h2><div class="callout">' + para(d.opportunities) + "</div>";
    return h;
  };

  R.publications = function (d) {
    var pubs = d.publications || [], name = d.profile.authorName || d.profile.name, h = "<h1>Publications</h1>";
    h += '<p class="muted">Also on ' + (d.profile.links || []).filter(function (l) { return /scholar|orcid|dblp/i.test(l.label); })
      .map(function (l) { return a(l.label, l.url); }).join(", ") + ".</p>";
    h = h.replace(/<p class="muted">Also on \.<\/p>/, "");

    function entry(p) {
      var first = (p.links || [])[0];
      var title = first ? a(p.title, first.url) : esc(p.title);
      var s = '<div class="pub"><div class="t">' + title;
      if (p.status && p.status !== "published") s += '<span class="badge">' + esc(p.status) + "</span>";
      s += '</div><div class="meta">' + authors(p.authors, name) + "<br>" + esc(p.venue) + "</div>";
      if (p.note) s += '<div class="meta"><i>' + esc(p.note) + "</i></div>";
      if ((p.links || []).length) s += '<div class="lk">' + p.links.map(function (l) { return a(l.label, l.url); }).join("") + "</div>";
      return s + "</div>";
    }

    var pending = pubs.filter(function (p) { return p.status && p.status !== "published"; });
    var done = pubs.filter(function (p) { return !p.status || p.status === "published"; });

    if (pending.length) h += "<h2>Under review and in preparation</h2>" + pending.map(entry).join("");

    var years = {};
    done.forEach(function (p) { (years[p.year || "Other"] = years[p.year || "Other"] || []).push(p); });
    Object.keys(years).sort(function (x, y) { return String(y).localeCompare(String(x), undefined, { numeric: true }); })
      .forEach(function (y) { h += '<div class="year">' + esc(y) + "</div>" + years[y].map(entry).join(""); });

    if (!pubs.length) h += '<p class="muted">No publications listed yet.</p>';
    return h;
  };

  R.group = function (d) {
    var s = d.students || {}, cur = s.current || [], past = s.past || [], h = "<h1>Group</h1>";
    h += "<h2>Current students</h2>";
    if (cur.length) {
      h += '<div class="people">' + cur.map(function (m) {
        return '<div class="person">' + (m.photo ? '<img src="' + esc(safeUrl(m.photo)) + '" alt="' + esc(m.name) + '">' : "") +
          '<div class="nm">' + nameLink(m.name, m.url) + "</div>" +
          (m.role ? '<div class="sub">' + esc(m.role) + "</div>" : "") +
          (m.project ? "<div>" + esc(m.project) + "</div>" : "") + "</div>";
      }).join("") + "</div>";
    } else h += '<p class="muted">None listed.</p>';

    if (past.length) {
      h += "<h2>Past students</h2>" + '<div class="people">' + past.map(function (m) {
        return '<div class="person"><div class="nm">' + nameLink(m.name, m.url) + "</div>" +
          (m.now ? '<div class="sub">' + esc(m.now) + "</div>" : "") + "</div>";
      }).join("") + "</div>";
    }
    if (d.opportunities) h += '<h2>Opportunities</h2><div class="callout">' + para(d.opportunities) + "</div>";
    return h;
  };

  R.bio = function (d) {
    var p = d.profile, h = "<h1>Bio</h1>";
    if (p.photo) h += '<p><img class="photo" style="width:140px;height:140px;object-fit:cover;border-radius:50%" src="' + esc(safeUrl(p.photo)) + '" alt="' + esc(p.name) + '"></p>';
    h += para(p.bio);
    if (p.cv) h += "<p>" + a("Download my CV (PDF)", p.cv) + "</p>";
    if (p.photo) h += "<p>" + a("Photo", p.photo) + "</p>";
    return h;
  };

  R.courses = function (d) {
    var c = d.courses || {}, h = "<h1>Courses</h1>";
    function sec(title, list) {
      if (!list || !list.length) return "";
      return "<h2>" + title + '</h2><ul class="bul">' + list.map(function (x) {
        return "<li>" + (x.url ? a(x.text, x.url) : esc(x.text)) + "</li>";
      }).join("") + "</ul>";
    }
    h += sec("Current courses", c.current) + sec("Former courses", c.former) + sec("Tutorials and other educational content", c.tutorials);
    if (h === "<h1>Courses</h1>") h += '<p class="muted">No courses listed yet.</p>';
    return h;
  };

  function shell(d, page, body) {
    var p = d.profile;
    var nav = '<header class="top"><nav><a class="brand" href="index.html">' + esc(p.name) + "</a>" +
      PAGES.map(function (x) { return '<a href="' + x[0] + '"' + (x[2] === page ? ' class="cur"' : "") + ">" + x[1] + "</a>"; }).join("") +
      "</nav></header>";
    var foot = '<footer class="contact">';
    if (p.email) foot += "<p>" + a(p.email, "mailto:" + p.email) + "</p>";
    if (p.address) foot += "<p>" + esc(p.address) + "</p>";
    if (d.updated) foot += "<p>Last updated: " + esc(d.updated) + "</p>";
    foot += "</footer>";
    return nav + "<main>" + body + "</main>" + foot;
  }

  function init() {
    var app = document.getElementById("app");
    var page = document.body.getAttribute("data-page") || "home";
    fetch("data/site.json?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var label = (PAGES.filter(function (x) { return x[2] === page; })[0] || [])[1] || "";
        document.title = d.profile.name + (label && page !== "home" ? " — " + label : "");
        app.innerHTML = shell(d, page, R[page](d));
      })
      .catch(function () {
        app.innerHTML = "<p>Could not load <code>data/site.json</code>. If you opened this file directly from your disk, " +
          "run a local server instead (for example <code>python3 -m http.server</code>) and visit <code>http://localhost:8000</code>.</p>";
      });
  }

  if (typeof document !== "undefined") init();
  if (typeof module !== "undefined") module.exports = { R: R, shell: shell, safeUrl: safeUrl, esc: esc };
})();
