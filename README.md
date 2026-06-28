# Overhang

**Etsy opportunity scout for 3D-printed products.** A personal research tool that surfaces what's selling in a niche and helps design a better, original version of it — rather than copying.

## What it does

- Searches Etsy by keyword using the official **Etsy Open API v3**
- Ranks listings by an opportunity score built from public traction signals (favourites, views, price, listing age)
- Flags the design gap on proven products, so you can make an improved, original design
- Niche and keyword research grounded in live web search

## Real vs. estimated

Etsy doesn't publish per-listing sales, so monthly **sales and revenue are modelled estimates** derived from public signals — directional, for ranking and comparison, not exact figures. Price, favourites, views, tags and listing age come straight from Etsy's API.

## Stack

- **Backend:** Python (Flask) — calls the official Etsy Open API v3, computes the estimates and scores
- **Frontend:** React

## Setup

1. Get a free Etsy API key: https://www.etsy.com/developers/register
2. `pip install flask flask-cors requests`
3. `export ETSY_API_KEY="your_key"` (Windows: `set ETSY_API_KEY=your_key`)
4. `python etsy_backend.py`
5. Open the frontend and point its data-source field at `http://localhost:5000`

## Note

This is a personal product-research tool. It reads **public listing data only** — no end users, no buyer data, and no automated writes to Etsy.
