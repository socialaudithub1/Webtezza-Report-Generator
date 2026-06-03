const metricFields = [
  { key: 'reach', label: 'Reach', placeholder: 'Enter reach', numeric: true },
  { key: 'impressions', label: 'Impressions / Views', placeholder: 'Enter impressions or views', numeric: true },
  { key: 'engagement', label: 'Engagement', placeholder: 'Enter engagement', numeric: true },
  { key: 'followers', label: 'Followers', placeholder: 'Enter followers', numeric: true },
  { key: 'growth', label: 'Growth %', placeholder: 'Enter growth percentage', numeric: true },
  { key: 'clicks', label: 'Link Clicks', placeholder: 'Enter link clicks', numeric: true },
  { key: 'topPost', label: 'Top Post / Content', placeholder: 'Enter top content', numeric: false },
  { key: 'note', label: 'Short Note', placeholder: 'Enter a short note', numeric: false }
];

const platforms = {
  facebook: { name: 'Facebook' },
  instagram: { name: 'Instagram' },
  tiktok: { name: 'TikTok' }
};

const emptyMetricValues = metricFields.reduce((values, field) => {
  values[field.key] = '';
  return values;
}, {});

const uploads = {
  logo: '',
  facebook: '',
  instagram: '',
  tiktok: ''
};

const uploadInputs = ['logoUpload', 'facebookUpload', 'instagramUpload', 'tiktokUpload'];
const MAX_IMAGE_WIDTH = 1000;
const JPEG_QUALITY = 0.6;
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

const PDF_LIBRARY_SOURCES = {
  jspdf: [
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
  ]
};

const reportPreview = document.getElementById('reportPreview');
const reportType = document.getElementById('reportType');
const reportPeriod = document.getElementById('reportPeriod');
const downloadButton = document.getElementById('downloadButton');
const previewButton = document.getElementById('previewButton');
const resetButton = document.getElementById('resetButton');
const validationMessage = document.getElementById('validationMessage');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function displayValue(value) {
  return value ? escapeHtml(value) : 'N/A';
}

function pdfValue(value) {
  return value ? String(value) : 'N/A';
}

function createMetricInputs() {
  Object.keys(platforms).forEach((platform) => {
    const container = document.querySelector(`[data-platform-inputs="${platform}"]`);
    container.innerHTML = metricFields.map((field) => `
      <label class="field">
        <span>${field.label}</span>
        <input
          data-metric-platform="${platform}"
          data-metric-key="${field.key}"
          type="text"
          value=""
          placeholder="${escapeHtml(field.placeholder)}"
        />
      </label>
    `).join('');
  });
}

function setValidationMessage(message) {
  validationMessage.textContent = message;
  validationMessage.hidden = !message;
}

function setUpTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const platform = tab.dataset.platform;
      document.querySelectorAll('.tab').forEach((button) => button.classList.remove('active'));
      document.querySelectorAll('.platform-panel').forEach((panel) => panel.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-panel="${platform}"]`).classList.add('active');
    });
  });
}

function resizeImageToJpeg(file, maxWidth = MAX_IMAGE_WIDTH, quality = JPEG_QUALITY) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const image = new Image();
      image.addEventListener('load', () => {
        const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      });
      image.addEventListener('error', () => reject(new Error('The selected image could not be loaded.')));
      image.src = reader.result;
    });
    reader.addEventListener('error', () => reject(new Error('The selected image could not be read.')));
    reader.readAsDataURL(file);
  });
}

function setUpUploads() {
  const uploadConfig = [
    { id: 'logoUpload', preview: 'logoPreview', key: 'logo' },
    { id: 'facebookUpload', preview: 'facebookPreview', key: 'facebook' },
    { id: 'instagramUpload', preview: 'instagramPreview', key: 'instagram' },
    { id: 'tiktokUpload', preview: 'tiktokPreview', key: 'tiktok' }
  ];

  uploadConfig.forEach(({ id, preview, key }) => {
    const input = document.getElementById(id);
    const image = document.getElementById(preview);
    input.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) {
        uploads[key] = '';
        image.removeAttribute('src');
        image.closest('.upload-card').classList.remove('has-image');
        renderReport();
        return;
      }

      try {
        const resizedImage = await resizeImageToJpeg(file);
        uploads[key] = resizedImage;
        image.src = resizedImage;
        image.closest('.upload-card').classList.add('has-image');
        setValidationMessage('');
        renderReport();
      } catch (error) {
        setValidationMessage(error.message);
      }
    });
  });
}

function loadExternalScript(url) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript && existingScript.dataset.loaded === 'true') {
      resolve();
      return;
    }

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error(`Could not load ${url}`));
    }, { once: true });
    document.head.appendChild(script);
  });
}

async function loadLibraryFromFallbacks(name, isReady) {
  if (isReady()) {
    return;
  }

  const failures = [];
  for (const url of PDF_LIBRARY_SOURCES[name]) {
    try {
      await loadExternalScript(url);
      if (isReady()) {
        return;
      }
      failures.push(`${url} loaded, but ${name} was not available`);
    } catch (error) {
      failures.push(error.message);
    }
  }

  throw new Error(`${name} failed to load. ${failures.join(' | ')}`);
}

async function ensurePdfTools() {
  await loadLibraryFromFallbacks('jspdf', () => Boolean(window.jspdf && window.jspdf.jsPDF));
}

function collectMetrics() {
  const metrics = {};
  Object.keys(platforms).forEach((platform) => {
    metrics[platform] = Object.assign({ name: platforms[platform].name }, emptyMetricValues);
  });

  document.querySelectorAll('[data-metric-platform]').forEach((input) => {
    const platform = input.dataset.metricPlatform;
    const key = input.dataset.metricKey;
    metrics[platform][key] = input.value.trim();
  });
  return metrics;
}

function validateRequiredMetrics() {
  const missing = [];
  if (!reportType.value.trim()) {
    missing.push('report type');
  }
  if (!reportPeriod.value.trim()) {
    missing.push('report month/week');
  }

  if (missing.length) {
    setValidationMessage(`Please enter ${missing.join(' and ')} before generating the PDF. Metrics are optional and will show as N/A if left empty.`);
    return false;
  }

  setValidationMessage('');
  return true;
}

function numberFromMetric(value) {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function totalMetric(metrics, field) {
  const total = Object.values(metrics).reduce((sum, platform) => sum + numberFromMetric(platform[field]), 0);
  return total.toLocaleString();
}

function getTopPlatform(metrics, field) {
  const ranked = Object.values(metrics).filter((platform) => numberFromMetric(platform[field]) > 0);
  if (!ranked.length) {
    return { name: '', [field]: '' };
  }
  return ranked.reduce((winner, current) => {
    return numberFromMetric(current[field]) > numberFromMetric(winner[field]) ? current : winner;
  });
}

function logoMarkup(isCover = false) {
  if (uploads.logo) {
    return `<img class="brand-logo" src="${uploads.logo}" alt="Webtezza logo" />`;
  }
  return `
    <div class="logo-fallback" aria-label="Webtezza">
      <span class="logo-mark"></span>
      <span>${isCover ? 'Webtezza' : 'WEBTEZZA'}</span>
    </div>
  `;
}

function pageFooter(pageNumber) {
  return `
    <div class="footer-note">
      <span>Webtezza ${escapeHtml(reportType.value)} Performance Report</span>
      <span>Page ${pageNumber} of 6</span>
    </div>
  `;
}

function statCard(label, value, note = '') {
  return `
    <article class="stat-card">
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${displayValue(value)}</div>
      ${note ? `<div class="stat-note">${escapeHtml(note)}</div>` : ''}
    </article>
  `;
}

function screenshotMarkup(platformKey, platformName) {
  if (uploads[platformKey]) {
    return `<img src="${uploads[platformKey]}" alt="${escapeHtml(platformName)} uploaded overview screenshot" />`;
  }
  return `<div class="image-placeholder">Upload the ${escapeHtml(platformName)} overview screenshot to place it here.</div>`;
}

function platformPage(platformKey, pageNumber, metrics) {
  const platform = metrics[platformKey];
  const note = platform.note || 'Add a short note to explain what changed and what to improve next.';
  return `
    <section class="report-page">
      <header class="report-header report-header-dark">
        ${logoMarkup()}
        <div><strong>${escapeHtml(platform.name)}</strong><span>${displayValue(reportPeriod.value)}</span></div>
      </header>
      <p class="report-kicker">Page ${pageNumber} · Channel Detail</p>
      <h2 class="report-title navy-title">${escapeHtml(platform.name)} Performance</h2>
      <div class="stat-grid compact-stats">
        ${statCard('Reach', platform.reach)}
        ${statCard('Views / Impressions', platform.impressions)}
        ${statCard('Engagement', platform.engagement)}
        ${statCard('Growth', platform.growth)}
      </div>
      <div class="two-panel platform-detail">
        <div class="screenshot-box">
          <h3>Overview Screenshot</h3>
          ${screenshotMarkup(platformKey, platform.name)}
        </div>
        <div class="insight-box">
          <h3>Summary</h3>
          <ul class="bullet-list">
            <li>Followers: <strong>${displayValue(platform.followers)}</strong></li>
            <li>Link clicks: <strong>${displayValue(platform.clicks)}</strong></li>
            <li>Top content: <strong>${displayValue(platform.topPost)}</strong></li>
          </ul>
          <p>${escapeHtml(note)}</p>
        </div>
      </div>
      ${pageFooter(pageNumber)}
    </section>
  `;
}

function buildReportPages(metrics) {
  const topReach = getTopPlatform(metrics, 'reach');
  const topEngagement = getTopPlatform(metrics, 'engagement');
  const period = reportPeriod.value.trim() || 'Report Period';
  const type = reportType.value;

  return `
    <section class="report-page cover">
      <header class="report-header cover-header">
        ${logoMarkup(true)}
        <span>${escapeHtml(period)}</span>
      </header>
      <p class="report-kicker">${escapeHtml(type)} Performance Snapshot</p>
      <h2 class="report-title">Social Media Performance Report</h2>
      <p class="report-subtitle">A clean six-page Webtezza report built from your uploaded screenshots and manually entered social metrics.</p>
      <div class="stat-grid">
        ${statCard('Total Reach', totalMetric(metrics, 'reach'), 'Calculated from your entries')}
        ${statCard('Total Engagement', totalMetric(metrics, 'engagement'), 'Calculated from your entries')}
        ${statCard('Top Reach Platform', topReach.name, displayValue(topReach.reach))}
        ${statCard('Top Engagement Platform', topEngagement.name, displayValue(topEngagement.engagement))}
      </div>
      <div class="cover-summary">
        <h3>Report Summary</h3>
        <p>This report highlights channel performance, compares platforms, and closes with a short action plan for the next reporting period.</p>
      </div>
      ${pageFooter(1)}
    </section>

    <section class="report-page">
      <header class="report-header report-header-dark">${logoMarkup()}<span>${escapeHtml(period)}</span></header>
      <p class="report-kicker">Page 2 · Platform Comparison</p>
      <h2 class="report-title navy-title">Platform Comparison</h2>
      <p class="report-subtitle">A side-by-side view of the numbers entered for Facebook, Instagram, and TikTok.</p>
      <table class="comparison-table">
        <thead>
          <tr><th>Platform</th><th>Reach</th><th>Views</th><th>Engagement</th><th>Followers</th><th>Growth</th><th>Clicks</th></tr>
        </thead>
        <tbody>
          ${Object.values(metrics).map((platform) => `
            <tr>
              <td><strong>${escapeHtml(platform.name)}</strong></td>
              <td>${displayValue(platform.reach)}</td>
              <td>${displayValue(platform.impressions)}</td>
              <td>${displayValue(platform.engagement)}</td>
              <td>${displayValue(platform.followers)}</td>
              <td>${displayValue(platform.growth)}</td>
              <td>${displayValue(platform.clicks)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="two-panel comparison-highlights">
        <div class="comparison-card"><h3>Highest Reach</h3><p>${displayValue(topReach.name)} ${topReach.reach && topReach.reach !== '—' ? `led reach with ${displayValue(topReach.reach)}.` : 'will appear here after metrics are entered.'}</p></div>
        <div class="comparison-card"><h3>Highest Engagement</h3><p>${displayValue(topEngagement.name)} ${topEngagement.engagement && topEngagement.engagement !== '—' ? `led engagement with ${displayValue(topEngagement.engagement)}.` : 'will appear here after metrics are entered.'}</p></div>
      </div>
      ${pageFooter(2)}
    </section>

    ${platformPage('facebook', 3, metrics)}
    ${platformPage('instagram', 4, metrics)}
    ${platformPage('tiktok', 5, metrics)}

    <section class="report-page action-page">
      <header class="report-header report-header-dark">${logoMarkup()}<span>${escapeHtml(period)}</span></header>
      <p class="report-kicker">Page 6 · Key Insights and Action Plan</p>
      <h2 class="report-title navy-title">Key Insights and Action Plan</h2>
      <div class="action-summary">
        <h3>Key Insight</h3>
        <p>Use the strongest platform result as the lead content direction for the next ${escapeHtml(type.toLowerCase().replace(' report', ''))} cycle.</p>
      </div>
      <div class="action-list short-actions">
        <div class="action-item"><span>1</span><div><strong>Repeat what worked.</strong><p>Recreate the format, topic, and timing of the best-performing content.</p></div></div>
        <div class="action-item"><span>2</span><div><strong>Improve conversion.</strong><p>Add one clear call to action to posts with strong reach or engagement.</p></div></div>
        <div class="action-item"><span>3</span><div><strong>Review next cycle.</strong><p>Compare reach, engagement, growth, and clicks before adjusting the plan.</p></div></div>
      </div>
      <div class="action-box final-note"><h3>Next Focus</h3><p>Keep the plan simple: publish consistently, track the same metrics, and prioritize content that creates measurable audience response.</p></div>
      ${pageFooter(6)}
    </section>
  `;
}

function renderReport() {
  try {
    const metrics = collectMetrics();
    reportPreview.innerHTML = buildReportPages(metrics);
  } catch (error) {
    console.error('Preview render failed.', error);
    reportPreview.innerHTML = `
      <div class="preview-error" role="alert">
        <strong>Preview could not render.</strong>
        <p>Please refresh the page and try again. The app keeps all data local in your browser.</p>
        <small>${escapeHtml(error.message || error)}</small>
      </div>
    `;
  }
}

function resetForm() {
  reportPeriod.value = '';
  document.querySelectorAll('[data-metric-platform]').forEach((input) => {
    input.value = '';
  });
  Object.keys(uploads).forEach((key) => {
    uploads[key] = '';
  });
  uploadInputs.forEach((id) => {
    const input = document.getElementById(id);
    input.value = '';
  });
  document.querySelectorAll('.upload-card').forEach((card) => {
    card.classList.remove('has-image');
    const image = card.querySelector('img');
    image.removeAttribute('src');
  });
  setValidationMessage('');
  renderReport();
}

function addPdfHeader(pdf, title, pageNumber, period, isCover = false) {
  if (isCover) {
    pdf.setFillColor(7, 24, 42);
    pdf.rect(0, 0, A4_WIDTH_PT, 130, 'F');
    pdf.setFillColor(15, 95, 184);
    pdf.rect(0, 126, A4_WIDTH_PT, 4, 'F');
    pdf.setTextColor(255, 255, 255);
  } else {
    pdf.setFillColor(8, 27, 49);
    pdf.rect(0, 0, A4_WIDTH_PT, 62, 'F');
    pdf.setTextColor(255, 255, 255);
  }

  if (uploads.logo) {
    try {
      const logoProps = pdf.getImageProperties(uploads.logo);
      const logoWidth = Math.min(120, logoProps.width * 40 / logoProps.height);
      pdf.addImage(uploads.logo, 'JPEG', 40, isCover ? 34 : 18, logoWidth, 40, undefined, 'FAST');
    } catch (error) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('WEBTEZZA', 40, isCover ? 58 : 36);
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('WEBTEZZA', 40, isCover ? 58 : 36);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(period, A4_WIDTH_PT - 40, isCover ? 58 : 36, { align: 'right' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCover ? 28 : 18);
  pdf.text(title, 40, isCover ? 102 : 96);
}

function addPdfFooter(pdf, pageNumber) {
  pdf.setDrawColor(210, 224, 240);
  pdf.line(40, A4_HEIGHT_PT - 34, A4_WIDTH_PT - 40, A4_HEIGHT_PT - 34);
  pdf.setTextColor(110, 130, 150);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Webtezza ${reportType.value} Performance Report`, 40, A4_HEIGHT_PT - 18);
  pdf.text(`Page ${pageNumber} of 6`, A4_WIDTH_PT - 40, A4_HEIGHT_PT - 18, { align: 'right' });
}

function addWrappedText(pdf, text, x, y, width, lineHeight = 13) {
  const lines = pdf.splitTextToSize(text, width);
  pdf.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function addPdfStat(pdf, label, value, x, y, width, height) {
  pdf.setFillColor(247, 251, 255);
  pdf.setDrawColor(220, 232, 246);
  pdf.roundedRect(x, y, width, height, 8, 8, 'FD');
  pdf.setTextColor(105, 125, 150);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(label.toUpperCase(), x + 10, y + 16);
  pdf.setTextColor(11, 41, 75);
  pdf.setFontSize(15);
  pdf.text(pdfValue(value), x + 10, y + 36, { maxWidth: width - 20 });
}

function addScreenshotToPdf(pdf, dataUrl, x, y, maxWidth, maxHeight) {
  if (!dataUrl) {
    pdf.setFillColor(238, 245, 255);
    pdf.setDrawColor(220, 232, 246);
    pdf.roundedRect(x, y, maxWidth, maxHeight, 8, 8, 'FD');
    pdf.setTextColor(124, 144, 170);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Screenshot not uploaded', x + maxWidth / 2, y + maxHeight / 2, { align: 'center' });
    return;
  }

  const props = pdf.getImageProperties(dataUrl);
  const ratio = Math.min(maxWidth / props.width, maxHeight / props.height);
  const width = props.width * ratio;
  const height = props.height * ratio;
  pdf.addImage(dataUrl, 'JPEG', x, y, width, height, undefined, 'FAST');
}

function addComparisonTable(pdf, metrics, x, y) {
  const columns = ['Platform', 'Reach', 'Views', 'Engagement', 'Followers', 'Growth', 'Clicks'];
  const widths = [80, 70, 76, 76, 76, 58, 58];
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setFillColor(11, 49, 88);
  pdf.setTextColor(255, 255, 255);
  let cursorX = x;
  columns.forEach((column, index) => {
    pdf.rect(cursorX, y, widths[index], 24, 'F');
    pdf.text(column, cursorX + 5, y + 15);
    cursorX += widths[index];
  });

  pdf.setFont('helvetica', 'normal');
  Object.values(metrics).forEach((platform, rowIndex) => {
    cursorX = x;
    const rowY = y + 24 + (rowIndex * 28);
    const values = [platform.name, platform.reach, platform.impressions, platform.engagement, platform.followers, platform.growth, platform.clicks];
    pdf.setFillColor(rowIndex % 2 ? 255 : 247, rowIndex % 2 ? 255 : 251, rowIndex % 2 ? 255 : 255);
    pdf.setTextColor(55, 75, 100);
    values.forEach((value, index) => {
      pdf.rect(cursorX, rowY, widths[index], 28, 'F');
      pdf.text(pdfValue(value), cursorX + 5, rowY + 17, { maxWidth: widths[index] - 10 });
      cursorX += widths[index];
    });
  });
}

function addPlatformPdfPage(pdf, platformKey, pageNumber, metrics, period) {
  const platform = metrics[platformKey];
  addPdfHeader(pdf, `${platform.name} Performance`, pageNumber, period);
  addPdfFooter(pdf, pageNumber);

  const startY = 130;
  addPdfStat(pdf, 'Reach', platform.reach, 40, startY, 118, 52);
  addPdfStat(pdf, 'Views / Impressions', platform.impressions, 170, startY, 130, 52);
  addPdfStat(pdf, 'Engagement', platform.engagement, 312, startY, 118, 52);
  addPdfStat(pdf, 'Growth', platform.growth, 442, startY, 113, 52);

  pdf.setTextColor(11, 41, 75);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Overview Screenshot', 40, 220);
  addScreenshotToPdf(pdf, uploads[platformKey], 40, 235, 330, 255);

  pdf.setFillColor(247, 251, 255);
  pdf.setDrawColor(220, 232, 246);
  pdf.roundedRect(390, 235, 165, 255, 8, 8, 'FD');
  pdf.setTextColor(11, 41, 75);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Summary', 405, 258);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(70, 90, 115);
  let y = 282;
  y = addWrappedText(pdf, `Followers: ${pdfValue(platform.followers)}`, 405, y, 135, 14) + 4;
  y = addWrappedText(pdf, `Link clicks: ${pdfValue(platform.clicks)}`, 405, y, 135, 14) + 4;
  y = addWrappedText(pdf, `Top content: ${pdfValue(platform.topPost)}`, 405, y, 135, 14) + 8;
  addWrappedText(pdf, platform.note || 'No note provided.', 405, y, 135, 14);
}

async function generatePdf() {
  renderReport();
  if (!validateRequiredMetrics()) {
    return;
  }

  downloadButton.disabled = true;
  downloadButton.textContent = 'Loading PDF tools...';

  try {
    await ensurePdfTools();
    downloadButton.textContent = 'Generating small PDF...';
    const { jsPDF } = window.jspdf;
    const metrics = collectMetrics();
    const period = reportPeriod.value.trim();
    const type = reportType.value;
    const topReach = getTopPlatform(metrics, 'reach');
    const topEngagement = getTopPlatform(metrics, 'engagement');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });

    addPdfHeader(pdf, 'Social Media Performance Report', 1, period, true);
    addPdfFooter(pdf, 1);
    pdf.setTextColor(210, 234, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    addWrappedText(pdf, `A six-page ${type.toLowerCase()} report built from your uploaded screenshots and manually entered social metrics. Empty metrics display as N/A.`, 40, 155, 500, 15);
    addPdfStat(pdf, 'Total Reach', totalMetric(metrics, 'reach'), 40, 230, 240, 64);
    addPdfStat(pdf, 'Total Engagement', totalMetric(metrics, 'engagement'), 315, 230, 240, 64);
    addPdfStat(pdf, 'Top Reach Platform', topReach.name, 40, 315, 240, 64);
    addPdfStat(pdf, 'Top Engagement Platform', topEngagement.name, 315, 315, 240, 64);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Summary', 40, 450);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    addWrappedText(pdf, 'Use this report to compare channels, review platform screenshots, and set a short action plan for the next reporting period.', 40, 472, 500, 15);

    pdf.addPage('a4', 'portrait');
    addPdfHeader(pdf, 'Platform Comparison', 2, period);
    addPdfFooter(pdf, 2);
    pdf.setTextColor(88, 112, 141);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Empty metric fields show as N/A. Empty number fields count as 0 only for totals and ranking.', 40, 125);
    addComparisonTable(pdf, metrics, 40, 150);
    pdf.setTextColor(11, 41, 75);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Highlights', 40, 290);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(70, 90, 115);
    addWrappedText(pdf, `Highest reach: ${pdfValue(topReach.name)}. Highest engagement: ${pdfValue(topEngagement.name)}.`, 40, 312, 500, 15);

    ['facebook', 'instagram', 'tiktok'].forEach((platformKey, index) => {
      pdf.addPage('a4', 'portrait');
      addPlatformPdfPage(pdf, platformKey, index + 3, metrics, period);
    });

    pdf.addPage('a4', 'portrait');
    addPdfHeader(pdf, 'Key Insights and Action Plan', 6, period);
    addPdfFooter(pdf, 6);
    pdf.setTextColor(11, 41, 75);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Short Action Plan', 40, 135);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(70, 90, 115);
    let actionY = 165;
    actionY = addWrappedText(pdf, '1. Repeat the strongest content format from the best-performing platform.', 40, actionY, 500, 16) + 8;
    actionY = addWrappedText(pdf, '2. Add one clear call to action to posts with strong reach or engagement.', 40, actionY, 500, 16) + 8;
    addWrappedText(pdf, '3. Review reach, engagement, growth, and clicks in the next report cycle.', 40, actionY, 500, 16);

    if (pdf.getNumberOfPages() !== 6) {
      throw new Error(`Expected 6 report pages, found ${pdf.getNumberOfPages()}.`);
    }

    const safePeriod = (reportPeriod.value || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    pdf.save(`webtezza-${reportType.value.toLowerCase()}-${safePeriod || 'report'}.pdf`);
  } catch (error) {
    console.warn('PDF libraries unavailable. Falling back to browser print.', error);
    alert('The PDF libraries could not load or the PDF could not be generated. The report preview still works locally, and your browser print dialog will open so you can choose Save as PDF.');
    window.print();
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = 'Generate 6-Page PDF';
  }
}

createMetricInputs();
setUpTabs();
setUpUploads();
renderReport();

reportType.addEventListener('change', renderReport);
reportPeriod.addEventListener('input', renderReport);
previewButton.addEventListener('click', renderReport);
resetButton.addEventListener('click', resetForm);
downloadButton.addEventListener('click', generatePdf);
document.addEventListener('input', (event) => {
  if (event.target.matches('[data-metric-platform]')) {
    setValidationMessage('');
    renderReport();
  }
});
