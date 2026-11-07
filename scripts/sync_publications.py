#!/usr/bin/env python3
"""Add new papers to data/site.json automatically.

Source 1 (default, free, no key): OpenAlex, looked up by the ORCID iD in profile.orcid.
Source 2 (optional): Google Scholar through SerpAPI, used when profile.scholarId is set AND the
SERPAPI_KEY secret exists. Google Scholar has no official API and blocks scrapers, so SerpAPI is the
reliable way to read it.

Rules:
  * Existing entries (yours or earlier auto ones) are NEVER changed or removed.
  * Only papers that are not in the file yet are added, at the top, tagged auto=true.
  * Papers you deleted in the editor are listed in data["ignored"] and are never added back.
Standard library only.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "site.json")
UA = "academic-site-sync/1.0"


def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def norm_title(t):
    return re.sub(r"[^a-z0-9]", "", (t or "").lower())


def norm_doi(d):
    d = (d or "").strip().lower()
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", d)


def key_for(doi, title):
    d = norm_doi(doi)
    return "doi:" + d if d else "t:" + norm_title(title)


def join_authors(names, limit=15):
    names = [n for n in names if n]
    if len(names) > limit:
        return ", ".join(names[:limit]) + ", et al."
    return ", ".join(names)


# ---------- sources ----------
def from_openalex(orcid):
    orcid = orcid.strip().replace("https://orcid.org/", "")
    if not re.fullmatch(r"\d{4}-\d{4}-\d{4}-\d{3}[\dXx]", orcid):
        raise SystemExit("profile.orcid must look like 0000-0002-1825-0097")
    params = {
        "filter": "author.orcid:https://orcid.org/" + orcid,
        "per-page": "200",
        "sort": "publication_year:desc",
        "select": "id,doi,title,publication_year,type,authorships,primary_location,open_access",
    }
    url = "https://api.openalex.org/works?" + urllib.parse.urlencode(params, safe=":/,")
    works = http_json(url).get("results", [])
    return parse_openalex(works)


def parse_openalex(works):
    out = []
    for w in works:
        title = (w.get("title") or "").strip()
        if not title or w.get("type") in ("dataset", "peer-review", "erratum", "paratext"):
            continue
        doi = w.get("doi") or ""
        loc = w.get("primary_location") or {}
        src = (loc.get("source") or {}).get("display_name") or ""
        year = w.get("publication_year")
        venue = ", ".join(x for x in [src, str(year) if year else ""] if x)
        names = [((a.get("author") or {}).get("display_name") or "") for a in (w.get("authorships") or [])]
        links = []
        page = doi or loc.get("landing_page_url") or ""
        if page:
            links.append({"label": "paper", "url": page})
        oa = (w.get("open_access") or {}).get("oa_url")
        if oa and oa != page:
            links.append({"label": "pdf", "url": oa})
        out.append({"year": str(year or ""), "title": title, "authors": join_authors(names),
                    "venue": venue, "status": "published", "links": links, "note": "",
                    "doi": doi})
    return out


def from_serpapi(scholar_id, api_key):
    params = {"engine": "google_scholar_author", "author_id": scholar_id, "api_key": api_key,
              "num": "100", "sort": "pubdate"}
    res = http_json("https://serpapi.com/search.json?" + urllib.parse.urlencode(params))
    return parse_serpapi(res.get("articles", []))


def parse_serpapi(articles):
    out = []
    for a in articles:
        title = (a.get("title") or "").strip()
        if not title:
            continue
        link = a.get("link") or ""
        year = str(a.get("year") or "")
        venue = a.get("publication") or ""
        out.append({"year": year, "title": title, "authors": a.get("authors") or "",
                    "venue": venue, "status": "published",
                    "links": [{"label": "paper", "url": link}] if link else [], "note": "",
                    "doi": ""})
    return out


# ---------- merge ----------
def merge(data, fetched):
    pubs = data.setdefault("publications", [])
    ignored = set(data.get("ignored", []))
    known_doi = {norm_doi(p.get("doi")) for p in pubs if p.get("doi")}
    known_title = {norm_title(p.get("title")) for p in pubs}
    for p in pubs:  # entries without a stored key still count as known via title or paper link
        for l in p.get("links", []):
            if "doi.org/" in (l.get("url") or ""):
                known_doi.add(norm_doi(l["url"]))
    added = []
    for w in fetched:
        key = key_for(w.get("doi"), w["title"])
        if key in ignored or ("t:" + norm_title(w["title"])) in ignored:
            continue
        if (norm_doi(w.get("doi")) and norm_doi(w["doi"]) in known_doi) or norm_title(w["title"]) in known_title:
            continue
        entry = {k: v for k, v in w.items()}
        entry["auto"] = True
        entry["key"] = key
        added.append(entry)
        known_title.add(norm_title(w["title"]))
        if norm_doi(w.get("doi")):
            known_doi.add(norm_doi(w["doi"]))
    pubs[0:0] = added
    return added


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    prof = data.get("profile", {})
    fixture = os.environ.get("SYNC_FIXTURE")
    if fixture:  # used for offline tests
        with open(fixture, encoding="utf-8") as f:
            fx = json.load(f)
        fetched = parse_openalex(fx) if fx and "authorships" in fx[0] else parse_serpapi(fx)
    elif prof.get("scholarId") and os.environ.get("SERPAPI_KEY"):
        fetched = from_serpapi(prof["scholarId"].strip(), os.environ["SERPAPI_KEY"])
    elif prof.get("orcid"):
        fetched = from_openalex(prof["orcid"])
    else:
        print("Nothing to do: set profile.orcid (or profile.scholarId plus the SERPAPI_KEY secret) in the editor.")
        return 0
    added = merge(data, fetched)
    print("Fetched %d works, added %d new." % (len(fetched), len(added)))
    for a in added:
        print(" +", a["year"], a["title"])
    if added:
        with open(DATA, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
