# Webtezza Report Generator

A static, browser-only web app for creating a six-page Webtezza-style social media performance PDF report. The form starts empty, the PDF uses only the metrics you manually enter, and uploaded images are resized locally before export.

## Features

- Choose a **Monthly Report** or **Weekly Report**.
- Enter the report month or week range.
- Upload a Webtezza header/logo image.
- Upload Facebook, Instagram, and TikTok overview screenshots.
- Enter platform metrics manually for reach, impressions/views, engagement, followers, growth, clicks, top content, and notes.
- Validate required metrics before PDF generation.
- Reset all entered data and uploaded images with **Reset All Data**.
- Generate a clean six-page A4 PDF report:
  1. Monthly/Weekly Performance Snapshot
  2. Platform Comparison
  3. Facebook Performance
  4. Instagram Performance
  5. TikTok Performance
  6. Key Insights and Action Plan
- Keep all uploaded files and metrics local in the browser. No backend, API, database, or paid service is used.
- Reduce PDF size by resizing uploaded images to a maximum width of 1600px, converting them to JPEG quality 0.75, rendering pages at html2canvas scale 1.25, and adding pages to jsPDF as compressed JPEG images.
- Keep the live report preview working even if PDF library CDNs are blocked. If both PDF library fallbacks fail, the app opens the browser print dialog so you can choose **Save as PDF**.

## Local Usage

Open `index.html` in a modern browser, fill in the form, upload screenshots, and click **Generate 6-Page PDF**.

If you prefer a local static server, run this command from the project folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How to Test and Generate a Smaller PDF

1. Start the local server with `python3 -m http.server 8000`.
2. Open `http://localhost:8000` in a browser.
3. Confirm the metric fields are empty by default.
4. Click **Generate 6-Page PDF** with empty required metrics and confirm the warning message appears.
5. Enter required metrics for Facebook, Instagram, and TikTok.
6. Upload the Webtezza header/logo and platform screenshots. The app resizes uploaded images locally before using them in the preview and PDF.
7. Click **Refresh Preview** and confirm the report remains exactly six pages.
8. Click **Generate 6-Page PDF**.
9. Check the downloaded file size. For normal dashboard screenshots, the JPEG image resizing and compressed PDF export should keep the file much smaller than the previous large PDF.

## GitHub Pages Deployment

1. Push this repository to GitHub.
2. Open the repository settings.
3. Go to **Pages**.
4. Choose the branch that contains `index.html`.
5. Select the repository root as the publishing folder.
6. Save and open the generated GitHub Pages URL.

## Privacy

This app does not upload screenshots, logos, or metrics anywhere. Files are converted to local browser data URLs and used only to render the on-page preview and PDF export.

## Files

- `index.html` — app structure and GitHub Pages-ready entry point.
- `style.css` — Webtezza dark navy/blue interface and clean A4 report page design.
- `script.js` — form behavior, validation, local image resizing, report rendering, lazy-loaded PDF export, and browser print fallback.
- `README.md` — usage, testing, and GitHub Pages deployment guide.
