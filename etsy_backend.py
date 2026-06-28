#!/usr/bin/env python3
"""
Overhang — Etsy data backend for 3D-printing opportunity research.

WHAT THIS IS
------------
A small local server that pulls REAL listing data from the official Etsy
Open API v3 (the same data source Everbee/eRank/RankHero use) and computes
an estimated-sales figure plus an opportunity score for a keyword search.

WHAT IS REAL vs ESTIMATED
-------------------------
REAL (straight from Etsy):  price, tags, num_favorers, views (when returned),
                            listing age, shop, listing URL.
ESTIMATED (modelled here):  monthly sales, monthly revenue, opportunity score.
Etsy does NOT expose per-listing sales anywhere — not in the API, not on the
page. Every tool estimates. So do we, transparently, with the constants below.
Treat sales/revenue as DIRECTIONAL (good for ranking & comparison), not exact.

This uses ONLY the official API with your own free key. No scraping. No ToS
violation. Marketplace keyword search (findAllListingsActive) needs only an
API key — no OAuth flow.

SETUP
-----
1. Get a free key:  https://www.etsy.com/developers/register
   Register an app -> copy the "keystring".
2. pip install flask flask-cors requests
3. export ETSY_API_KEY="your_keystring_here"      (Windows: set ETSY_API_KEY=...)
4. python etsy_backend.py
5. Point the Overhang frontend's data-source field at  http://localhost:5000

ENDPOINTS
---------
GET /health
GET /opportunities?keywords=articulated+dragon&limit=40&min_price=5&max_price=60
"""

import os
import time
import math
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------
ETSY_API_KEY = os.environ.get("ETSY_API_KEY", "").strip()
ETSY_BASE = "https://api.etsy.com/v3/application"

# --- Estimation model -------------------------------------------------------
# Transparent and tunable. This is the same CLASS of method the paid tools use:
# infer sales from public traction signals. Numbers are deliberately conservative.
# Only a fraction of buyers leave a review; favourites and views convert at low rates.
REVIEW_TO_SALES   = 12     # assume ~1 review per 12 completed sales
FAVORITES_TO_SALES = 0.6   # assume lifetime sales ~= 0.6x favourites (very rough proxy)
VIEW_CONVERSION   = 0.015  # ~1.5% of lifetime views convert to a sale
# Opportunity scoring weights (for ranking WITHIN a result set)
W_DEMAND   = 0.55          # how much traction the item has (favourites/views velocity)
W_PRICE    = 0.20          # price sits in a printable, profitable band
W_FRESH    = 0.25          # younger listings with traction = rising, less entrenched
PRINT_SWEET_SPOT = (12, 45)  # AUD-ish band where 3D-printed goods tend to sell well

app = Flask(__name__)
CORS(app)  # allow the browser frontend (incl. claude.ai artifact) to call this


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def _price(listing):
    p = listing.get("price") or {}
    try:
        return round(int(p.get("amount", 0)) / int(p.get("divisor", 1) or 1), 2)
    except Exception:
        return 0.0


def _age_months(listing):
    ts = listing.get("original_creation_timestamp") or listing.get("created_timestamp")
    if not ts:
        return 1.0
    months = (time.time() - float(ts)) / (60 * 60 * 24 * 30.44)
    return max(round(months, 1), 0.5)


def _estimate(listing):
    """Return (est_total_sales, signal_used) from whichever real signal exists."""
    reviews = listing.get("num_reviews")  # often absent on search results
    favorers = listing.get("num_favorers")
    views = listing.get("views")

    if reviews:
        return round(reviews * REVIEW_TO_SALES), "reviews"
    if views:
        return round(views * VIEW_CONVERSION), "views"
    if favorers:
        return round(favorers * FAVORITES_TO_SALES), "favourites"
    return 0, "none"


def _log_norm(value, ceiling):
    """0..1 on a log scale so a few mega-listings don't flatten everything."""
    if value <= 0:
        return 0.0
    return min(math.log1p(value) / math.log1p(ceiling), 1.0)


def _opportunity_score(est_monthly_sales, price, age_months):
    demand = _log_norm(est_monthly_sales, 300)  # 300/mo ~= top of scale
    lo, hi = PRINT_SWEET_SPOT
    if lo <= price <= hi:
        price_fit = 1.0
    elif price < lo:
        price_fit = max(0.0, price / lo)
    else:
        price_fit = max(0.0, hi / price)
    # reward proven-but-not-ancient listings: traction that's recent is more "stealable"
    freshness = 1.0 if age_months <= 18 else max(0.3, 18 / age_months)
    score = (W_DEMAND * demand) + (W_PRICE * price_fit) + (W_FRESH * freshness * demand)
    return round(min(score, 1.0) * 100)


def _shape(listing):
    price = _price(listing)
    age_m = _age_months(listing)
    est_total, signal = _estimate(listing)
    est_monthly = round(est_total / age_m, 1) if est_total else 0
    return {
        "listing_id": listing.get("listing_id"),
        "title": listing.get("title", "").strip(),
        "url": listing.get("url"),
        # --- REAL signals from Etsy ---
        "price": price,
        "currency": (listing.get("price") or {}).get("currency_code", ""),
        "favourites": listing.get("num_favorers"),
        "views": listing.get("views"),
        "reviews": listing.get("num_reviews"),
        "age_months": age_m,
        "tags": listing.get("tags", [])[:13],
        # --- ESTIMATED (modelled, directional) ---
        "est_total_sales": est_total,
        "est_monthly_sales": est_monthly,
        "est_monthly_revenue": round(est_monthly * price, 2),
        "estimate_signal": signal,        # which real signal drove the estimate
        "opportunity_score": _opportunity_score(est_monthly, price, age_m),
    }


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@app.get("/health")
def health():
    return jsonify({"ok": True, "has_key": bool(ETSY_API_KEY)})


@app.get("/opportunities")
def opportunities():
    if not ETSY_API_KEY:
        return jsonify({"error": "No ETSY_API_KEY set. See setup notes at the top of this file."}), 400

    keywords = (request.args.get("keywords") or "").strip()
    if not keywords:
        return jsonify({"error": "Pass ?keywords=... (e.g. 'articulated dragon')."}), 400

    limit = min(int(request.args.get("limit", 40)), 100)
    params = {
        "keywords": keywords,
        "limit": limit,
        "state": "active",
        "sort_on": "score",       # Etsy's relevance/popularity sort
        "sort_order": "down",
    }
    if request.args.get("min_price"):
        params["min_price"] = request.args["min_price"]
    if request.args.get("max_price"):
        params["max_price"] = request.args["max_price"]

    try:
        r = requests.get(
            f"{ETSY_BASE}/listings/active",
            headers={"x-api-key": ETSY_API_KEY},
            params=params,
            timeout=20,
        )
    except requests.RequestException as e:
        return jsonify({"error": f"Could not reach Etsy: {e}"}), 502

    if r.status_code == 401 or r.status_code == 403:
        return jsonify({"error": "Etsy rejected the API key (401/403). Check the keystring is correct and the app is approved."}), 502
    if r.status_code == 429:
        return jsonify({"error": "Etsy rate limit hit (429). Wait a moment and retry."}), 429
    if not r.ok:
        return jsonify({"error": f"Etsy returned {r.status_code}: {r.text[:200]}"}), 502

    results = r.json().get("results", [])
    shaped = [_shape(l) for l in results]
    shaped.sort(key=lambda x: x["opportunity_score"], reverse=True)

    return jsonify({
        "keywords": keywords,
        "count": len(shaped),
        "disclaimer": "Sales/revenue are MODELLED estimates from public signals, not Etsy-reported figures.",
        "results": shaped,
    })


if __name__ == "__main__":
    if not ETSY_API_KEY:
        print("\n[!] ETSY_API_KEY is not set. Get a free key at "
              "https://www.etsy.com/developers/register then:\n"
              '    export ETSY_API_KEY="your_keystring"\n')
    print(">> Overhang backend running on http://localhost:5000")
    print(">> Point the frontend data-source field at that URL.\n")
    app.run(host="127.0.0.1", port=5000, debug=False)
