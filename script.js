const metricFields = [
  { key: 'reach', label: 'Reach', placeholder: 'Enter reach', required: true },
  { key: 'impressions', label: 'Impressions / Views', placeholder: 'Enter impressions or views', required: true },
  { key: 'engagement', label: 'Engagement', placeholder: 'Enter engagement', required: true },
  { key: 'followers', label: 'Followers', placeholder: 'Enter followers', required: true },
  { key: 'growth', label: 'Growth %', placeholder: 'Enter growth percentage', required: true },
  { key: 'clicks', label: 'Link Clicks', placeholder: 'Enter link clicks', required: true },
  { key: 'topPost', label: 'Top Post / Content', placeholder: 'Enter top content', required: false },
  { key: 'note', label: 'Short Note', placeholder: 'Enter a short note', required: false }
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
const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.75;
const HTML2CANVAS_SCALE = 1.25;
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

const PDF_LIBRARY_SOURCES = {
  html2canvas: [
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
  ],
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
  return value ? escapeHtml(value) : '—';
}

function createMetricInputs() {
  Object.keys(platforms).forEach((platform) => {
    const container = document.querySelector(`[data-platform-inputs="${platform}"]`);
    container.innerHTML = metricFields.map((field) => `
      <label class="field">
        <span>${field.label}${field.required ? ' <em>required</em>' : ''}</span>
        <input
          data-metric-platform="${platform}"
          data-metric-key="${field.key}"
          data-required-metric="${field.required ? 'true' : 'false'}"
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
  await loadLibraryFromFallbacks('html2canvas', () => Boolean(window.html2canvas));
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
  if (!reportPeriod.value.trim()) {
    missing.push('report month/week');
  }

  document.querySelectorAll('[data-required-metric="true"]').forEach((input) => {
    if (!input.value.trim()) {
      const panel = input.dataset.metricPlatform;
      const field = metricFields.find((item) => item.key === input.dataset.metricKey);
      missing.push(`${platforms[panel].name} ${field.label}`);
    }
  });

  if (missing.length) {
    setValidationMessage(`Please fill required fields before generating the PDF: ${missing.join(', ')}.`);
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
  return total ? total.toLocaleString() : '—';
}

function getTopPlatform(metrics, field) {
  const ranked = Object.values(metrics).filter((platform) => numberFromMetric(platform[field]) > 0);
  if (!ranked.length) {
    return { name: '—', [field]: '—' };
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

async function generatePdf() {
  renderReport();
  if (!validateRequiredMetrics()) {
    return;
  }

  downloadButton.disabled = true;
  downloadButton.textContent = 'Loading PDF tools...';
  let exportContainer;

  try {
    await ensurePdfTools();
    downloadButton.textContent = 'Generating smaller PDF...';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
    exportContainer = document.createElement('div');
    exportContainer.className = 'pdf-export';
    exportContainer.style.position = 'fixed';
    exportContainer.style.left = '-99999px';
    exportContainer.style.top = '0';
    exportContainer.innerHTML = buildReportPages(collectMetrics());
    document.body.appendChild(exportContainer);

    const pages = exportContainer.querySelectorAll('.report-page');
    if (pages.length !== 6) {
      throw new Error(`Expected 6 report pages, found ${pages.length}.`);
    }

    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await html2canvas(pages[index], {
        scale: HTML2CANVAS_SCALE,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imageData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      if (index > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(imageData, 'JPEG', 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT, undefined, 'FAST');
    }

    const safePeriod = (reportPeriod.value || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    pdf.save(`webtezza-${reportType.value.toLowerCase()}-${safePeriod || 'report'}.pdf`);
  } catch (error) {
    console.warn('PDF libraries unavailable. Falling back to browser print.', error);
    alert('The PDF libraries could not load or the PDF could not be generated. The report preview still works locally, and your browser print dialog will open so you can choose Save as PDF.');
    window.print();
  } finally {
    if (exportContainer) {
      exportContainer.remove();
    }
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
