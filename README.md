# Webtezza Report Generator

A static, browser-only web app for creating a six-page Webtezza-style social media performance PDF report. It uses HTML, CSS, and JavaScript only. The report preview works without third-party scripts, and PDF export lazy-loads html2canvas and jsPDF from jsDelivr with unpkg fallbacks only when you click the export button.

## Features

- Choose a **Monthly Report** or **Weekly Report**.
- Enter the report month or week range.
- Upload a Webtezza header/logo image.
- Upload Facebook, Instagram, and TikTok overview screenshots.
- Enter platform metrics manually for reach, impressions/views, engagement, followers, growth, clicks, top content, and notes.
- Generate a clean six-page PDF report:
  1. Monthly/Weekly Performance Snapshot
  2. Platform Comparison
  3. Facebook Performance
  4. Instagram Performance
  5. TikTok Performance
  6. Key Insights and Action Plan
- Keep all uploaded files and metrics local in the browser. No backend, API, database, or paid service is used.
- Keep the live report preview working even if PDF library CDNs are blocked. If both PDF library fallbacks fail, the app opens the browser print dialog so you can choose **Save as PDF**.

## Local Usage

Open `index.html` in a modern browser, fill in the form, upload screenshots, and click **Generate 6-Page PDF**.

If you prefer a local static server, run one of these commands from the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages Deployment

1. Push this repository to GitHub.
2. Open the repository settings.
3. Go to **Pages**.
4. Choose the branch that contains `index.html`.
5. Select the repository root as the publishing folder.
6. Save and open the generated GitHub Pages URL.

## Privacy

This app does not upload screenshots, logos, or metrics anywhere. Files are read as local browser data URLs and used only to render the on-page preview and PDF export.

## Files

- `index.html` — app structure and GitHub Pages-ready entry point.
- `style.css` — Webtezza dark navy/blue interface and report page design.
- `script.js` — form behavior, local image previews, report rendering, lazy-loaded PDF export, and browser print fallback.
- `README.md` — usage and GitHub Pages deployment guide.
