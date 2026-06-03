const metricFields = [
  { key: 'reach', label: 'Reach', placeholder: '24,500' },
  { key: 'impressions', label: 'Impressions / Views', placeholder: '58,900' },
  { key: 'engagement', label: 'Engagement', placeholder: '3,420' },
  { key: 'followers', label: 'Followers', placeholder: '12,700' },
  { key: 'growth', label: 'Growth %', placeholder: '+4.2%' },
  { key: 'clicks', label: 'Link Clicks', placeholder: '680' },
  { key: 'topPost', label: 'Top Post / Content', placeholder: 'Summer offer reel' },
  { key: 'note', label: 'Short Note', placeholder: 'Audience responded well to...' }
];

const platformDefaults = {
  facebook: {
    name: 'Facebook',
    reach: '24,500',
    impressions: '58,900',
    engagement: '3,420',
    followers: '12,700',
    growth: '+4.2%',
    clicks: '680',
    topPost: 'Brand update post',
    note: 'Stable reach with strong response to practical, benefit-led posts.'
  },
  instagram: {
    name: 'Instagram',
    reach: '31,200',
    impressions: '74,300',
    engagement: '5,860',
    followers: '18,450',
    growth: '+6.8%',
    clicks: '540',
    topPost: 'Product lifestyle reel',
    note: 'Reels and visual storytelling created the strongest engagement lift.'
  },
  tiktok: {
    name: 'TikTok',
    reach: '42,800',
    impressions: '96,100',
    engagement: '7,240',
    followers: '9,300',
    growth: '+9.1%',
    clicks: '310',
    topPost: 'Behind-the-scenes clip',
    note: 'Short, energetic videos helped attract new viewers and grow awareness.'
  }
};

const uploads = {
  logo: '',
  facebook: '',
  instagram: '',
  tiktok: ''
};

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

function createMetricInputs() {
  Object.keys(platformDefaults).forEach((platform) => {
    const container = document.querySelector(`[data-platform-inputs="${platform}"]`);
    container.innerHTML = metricFields.map((field) => `
      <label class="field">
        <span>${field.label}</span>
        <input
          data-metric-platform="${platform}"
          data-metric-key="${field.key}"
          type="text"
          value="${escapeHtml(platformDefaults[platform][field.key])}"
          placeholder="${escapeHtml(field.placeholder)}"
        />
      </label>
    `).join('');
  });
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
    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
        uploads[key] = '';
        image.removeAttribute('src');
        image.closest('.upload-card').classList.remove('has-image');
        renderReport();
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        uploads[key] = reader.result;
        image.src = reader.result;
        image.closest('.upload-card').classList.add('has-image');
        renderReport();
      });
      reader.readAsDataURL(file);
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clonePlatformDefaults() {
  return Object.keys(platformDefaults).reduce((copy, platform) => {
    copy[platform] = Object.assign({}, platformDefaults[platform]);
    return copy;
  }, {});
}

function showPreviewError(error) {
  console.error('Preview render failed.', error);
  reportPreview.innerHTML = `
    <div class="preview-error" role="alert">
      <strong>Preview could not render.</strong>
      <p>Please refresh the page and try again. The app keeps all data local in your browser.</p>
      <small>${escapeHtml(error.message || error)}</small>
    </div>
  `;
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
  const metrics = clonePlatformDefaults();
  document.querySelectorAll('[data-metric-platform]').forEach((input) => {
    const platform = input.dataset.metricPlatform;
    const key = input.dataset.metricKey;
    metrics[platform][key] = input.value.trim() || '—';
  });
  return metrics;
}

function numberFromMetric(value) {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTopPlatform(metrics, field) {
  return Object.values(metrics).reduce((winner, current) => {
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
      <div class="stat-label">${label}</div>
      <div class="stat-value">${escapeHtml(value)}</div>
      ${note ? `<div class="stat-note">${escapeHtml(note)}</div>` : ''}
    </article>
  `;
}

function screenshotMarkup(platformKey, platformName) {
  if (uploads[platformKey]) {
    return `<img src="${uploads[platformKey]}" alt="${platformName} uploaded overview screenshot" />`;
  }
  return `<div class="image-placeholder">Upload the ${platformName} overview screenshot to place it here.</div>`;
}

function platformPage(platformKey, pageNumber, metrics) {
  const platform = metrics[platformKey];
  return `
    <section class="report-page">
      <header class="report-header">
        ${logoMarkup()}
        <span class="platform-tag">${escapeHtml(platform.name)}</span>
      </header>
      <p class="report-kicker">Page ${pageNumber} · Channel Detail</p>
      <h2 class="report-title">${escapeHtml(platform.name)} Performance</h2>
      <p class="report-subtitle">${escapeHtml(platform.name)} delivered measurable activity during ${escapeHtml(reportPeriod.value)}. The focus is to keep the strongest content formats moving while improving consistency and conversion touchpoints.</p>
      <div class="stat-grid">
        ${statCard('Reach', platform.reach, 'People reached')}
        ${statCard('Views / Impressions', platform.impressions, 'Content visibility')}
        ${statCard('Engagement', platform.engagement, 'Reactions, comments, shares, saves')}
        ${statCard('Audience Growth', platform.growth, 'Follower movement')}
      </div>
      <div class="two-panel">
        <div class="screenshot-box">
          <h3>Uploaded Overview</h3>
          ${screenshotMarkup(platformKey, platform.name)}
        </div>
        <div class="insight-box">
          <h3>What This Means</h3>
          <p>${escapeHtml(platform.note)}</p>
          <ul class="bullet-list">
            <li>Top content: <strong>${escapeHtml(platform.topPost)}</strong>.</li>
            <li>Follower base: <strong>${escapeHtml(platform.followers)}</strong>.</li>
            <li>Traffic signal: <strong>${escapeHtml(platform.clicks)}</strong> link clicks.</li>
          </ul>
        </div>
      </div>
      ${pageFooter(pageNumber)}
    </section>
  `;
}

function buildReportPages(metrics) {
  const topReach = getTopPlatform(metrics, 'reach');
  const topEngagement = getTopPlatform(metrics, 'engagement');
  const totalReach = Object.values(metrics).reduce((sum, platform) => sum + numberFromMetric(platform.reach), 0).toLocaleString();
  const totalEngagement = Object.values(metrics).reduce((sum, platform) => sum + numberFromMetric(platform.engagement), 0).toLocaleString();
  const period = reportPeriod.value || 'Selected Period';
  const type = reportType.value;

  return `
    <section class="report-page cover">
      <header class="report-header">
        ${logoMarkup(true)}
        <span>${escapeHtml(period)}</span>
      </header>
      <p class="report-kicker">${escapeHtml(type)} Performance Snapshot</p>
      <h2 class="report-title">Social Media Performance Report</h2>
      <p class="report-subtitle">A clear Webtezza-style overview of Facebook, Instagram, and TikTok performance for ${escapeHtml(period)}, designed for quick decisions and practical next steps.</p>
      <div class="stat-grid">
        ${statCard('Total Reach', totalReach, 'Across Facebook, Instagram, and TikTok')}
        ${statCard('Total Engagement', totalEngagement, 'Combined platform interactions')}
        ${statCard('Top Reach Platform', topReach.name, `${topReach.reach} reach`)}
        ${statCard('Top Engagement Platform', topEngagement.name, `${topEngagement.engagement} engagements`)}
      </div>
      <div class="insight-box" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.18); color: white;">
        <h3 style="color:white;">Executive Summary</h3>
        <p style="color:#d8eaff;">The report shows where audience attention is strongest, which platform is creating the most engagement, and which actions can help Webtezza turn social visibility into better brand momentum.</p>
      </div>
      ${pageFooter(1)}
    </section>

    <section class="report-page">
      <header class="report-header">${logoMarkup()}<span>${escapeHtml(period)}</span></header>
      <p class="report-kicker">Page 2 · Platform Comparison</p>
      <h2 class="report-title">Platform Comparison</h2>
      <p class="report-subtitle">This page compares the three core social channels so performance patterns are easy to spot at a glance.</p>
      <table class="comparison-table">
        <thead>
          <tr><th>Platform</th><th>Reach</th><th>Views</th><th>Engagement</th><th>Growth</th><th>Clicks</th></tr>
        </thead>
        <tbody>
          ${Object.values(metrics).map((platform) => `
            <tr>
              <td><strong>${escapeHtml(platform.name)}</strong></td>
              <td>${escapeHtml(platform.reach)}</td>
              <td>${escapeHtml(platform.impressions)}</td>
              <td>${escapeHtml(platform.engagement)}</td>
              <td>${escapeHtml(platform.growth)}</td>
              <td>${escapeHtml(platform.clicks)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="two-panel">
        <div class="comparison-card">
          <h3>Best Visibility</h3>
          <p><strong>${escapeHtml(topReach.name)}</strong> generated the highest reach. Keep using the themes and formats that helped this audience discover the brand.</p>
        </div>
        <div class="comparison-card">
          <h3>Best Engagement</h3>
          <p><strong>${escapeHtml(topEngagement.name)}</strong> led engagement. This is the clearest signal for content that feels useful, timely, or easy to interact with.</p>
        </div>
      </div>
      ${pageFooter(2)}
    </section>

    ${platformPage('facebook', 3, metrics)}
    ${platformPage('instagram', 4, metrics)}
    ${platformPage('tiktok', 5, metrics)}

    <section class="report-page">
      <header class="report-header">${logoMarkup()}<span>${escapeHtml(period)}</span></header>
      <p class="report-kicker">Page 6 · Key Insights and Action Plan</p>
      <h2 class="report-title">Key Insights and Action Plan</h2>
      <p class="report-subtitle">The next step is to repeat what worked, simplify what did not, and build a steady content rhythm that supports brand awareness and qualified action.</p>
      <div class="action-list">
        <div class="action-item"><span>1</span><div><strong>Double down on the top-performing format.</strong><p>${escapeHtml(topEngagement.name)} created the strongest engagement, so use its winning content style as a model for the next posting cycle.</p></div></div>
        <div class="action-item"><span>2</span><div><strong>Turn reach into clear calls to action.</strong><p>Add simple next steps to posts with high visibility, such as visiting a page, sending a message, or saving the content.</p></div></div>
        <div class="action-item"><span>3</span><div><strong>Keep creative short, direct, and human.</strong><p>Use benefit-led captions, clean visuals, and quick explanations that make the audience understand the value fast.</p></div></div>
        <div class="action-item"><span>4</span><div><strong>Review results every cycle.</strong><p>Compare reach, engagement, growth, and clicks each ${escapeHtml(type.toLowerCase().replace(' report', ''))} to keep improving the content plan.</p></div></div>
      </div>
      <div class="two-panel">
        <div class="action-box"><h3>Content Focus</h3><p>Prioritize educational posts, proof-led stories, short videos, and practical brand updates that show Webtezza's value clearly.</p></div>
        <div class="action-box"><h3>Measurement Focus</h3><p>Watch engagement rate, follower growth, and link clicks to understand whether awareness is turning into audience action.</p></div>
      </div>
      ${pageFooter(6)}
    </section>
  `;
}

function renderReport() {
  try {
    const metrics = collectMetrics();
    reportPreview.innerHTML = buildReportPages(metrics);
  } catch (error) {
    showPreviewError(error);
  }
}

async function generatePdf() {
  renderReport();
  downloadButton.disabled = true;
  downloadButton.textContent = 'Loading PDF tools...';
  let exportContainer;

  try {
    await ensurePdfTools();
    downloadButton.textContent = 'Generating PDF...';
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    exportContainer = document.createElement('div');
    exportContainer.className = 'pdf-export';
    exportContainer.style.position = 'fixed';
    exportContainer.style.left = '-99999px';
    exportContainer.style.top = '0';
    exportContainer.innerHTML = buildReportPages(collectMetrics());
    document.body.appendChild(exportContainer);

    const pages = exportContainer.querySelectorAll('.report-page');
    for (let index = 0; index < pages.length; index += 1) {
      const canvas = await html2canvas(pages[index], {
        scale: 2,
        useCORS: true,
        backgroundColor: null
      });
      const imageData = canvas.toDataURL('image/png');
      if (index > 0) {
        pdf.addPage('letter', 'portrait');
      }
      pdf.addImage(imageData, 'PNG', 0, 0, 612, 792);
    }

    const safePeriod = (reportPeriod.value || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    pdf.save(`webtezza-${reportType.value.toLowerCase()}-${safePeriod}.pdf`);
  } catch (error) {
    console.warn('PDF libraries unavailable. Falling back to browser print.', error);
    alert('The PDF libraries could not load from jsDelivr or unpkg. The report preview still works locally, and your browser print dialog will open so you can choose Save as PDF.');
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
downloadButton.addEventListener('click', generatePdf);
document.addEventListener('input', (event) => {
  if (event.target.matches('[data-metric-platform]')) {
    renderReport();
  }
});
