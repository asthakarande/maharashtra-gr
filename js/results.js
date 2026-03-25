// results.js
// Handles filtering, rendering GR cards, and pagination on results.html
// Compatible with data format: { title, department, date, text, pdf }

// ── CONFIG ───────────────────────────────────────────────────────────────────
const PER_PAGE = 10;

// ── READ URL PARAMS ──────────────────────────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
const selDept = params.get('dept')  || '';   // short key e.g. "pwd"
const selQ    = params.get('q')     || '';   // keyword
const selFrom = params.get('from')  || '';   // YYYY-MM-DD
const selTo   = params.get('to')    || '';   // YYYY-MM-DD
let   curPage = parseInt(params.get('page') || '1', 10);
if (isNaN(curPage) || curPage < 1) curPage = 1;

// ── DOM REFS ─────────────────────────────────────────────────────────────────
const headerDeptName  = document.getElementById('headerDeptName');
const filterTagsEl    = document.getElementById('filterTags');
const resultsHeading  = document.getElementById('resultsHeading');
const resultsSubtitle = document.getElementById('resultsSubtitle');
const pageIndicator   = document.getElementById('pageIndicator');
const grList          = document.getElementById('grList');
const paginationEl    = document.getElementById('pagination');
const noResults       = document.getElementById('noResults');
const noResultsMsg    = document.getElementById('noResultsMsg');
const noResultsHdg    = document.getElementById('noResultsHeading');

// ── HELPERS ──────────────────────────────────────────────────────────────────
function getDeptName(key) {
  return (typeof DEPT_NAMES !== 'undefined' && DEPT_NAMES[key]) ? DEPT_NAMES[key] : key;
}

function deptHasData(key) {
  return typeof DEPTS_WITH_DATA !== 'undefined' && DEPTS_WITH_DATA.includes(key);
}

// Convert full department name from data → short key
function deptNameToKey(fullName) {
  if (typeof DEPT_NAME_TO_KEY === 'undefined') return '';
  // Try exact match first
  if (DEPT_NAME_TO_KEY[fullName]) return DEPT_NAME_TO_KEY[fullName];
  // Try case-insensitive match
  const lower = (fullName || '').toLowerCase().trim();
  for (const [name, key] of Object.entries(DEPT_NAME_TO_KEY)) {
    if (name.toLowerCase() === lower) return key;
  }
  return '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return dateStr; }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, query) {
  if (!query) return escHtml(text);
  const escaped = escHtml(text);
  const re = new RegExp('(' + escRegex(escHtml(query)) + ')', 'gi');
  return escaped.replace(re, '<mark style="background:#FFF3CD;color:inherit;border-radius:2px;padding:0 1px;">$1</mark>');
}

// Clean up a title — remove leading invisible/special chars, trim extra dots
function cleanTitle(title) {
  // Remove leading unicode junk characters (like the ﾠ in your sample)
  return (title || '').replace(/^[\s\uFFA0\u200B\u00A0\uFEFF]+/, '').trim();
}

// ── FILTER ───────────────────────────────────────────────────────────────────
function filterData() {
  if (!selDept) return [];

  return GR_DATA.filter(gr => {
    // Match department: convert gr.department full name → key, compare with selDept
    const grKey = deptNameToKey(gr.department);
    if (grKey !== selDept) return false;

    // Keyword filter (searches title)
    if (selQ) {
      const q = selQ.toLowerCase();
      const title = cleanTitle(gr.title).toLowerCase();
      if (!title.includes(q)) return false;
    }

    // Date from
    if (selFrom && gr.date && gr.date < selFrom) return false;

    // Date to
    if (selTo && gr.date && gr.date > selTo) return false;

    return true;
  });
}

// ── BUILD FILTER TAGS ────────────────────────────────────────────────────────
function buildFilterTags() {
  const tags = [];
  if (selDept) {
    tags.push(`<span class="filter-tag">&#9962; ${escHtml(getDeptName(selDept))}</span>`);
  }
  if (selQ) {
    tags.push(`<span class="filter-tag keyword">&#128269; "${escHtml(selQ)}"</span>`);
  }
  if (selFrom || selTo) {
    const from = selFrom ? formatDate(selFrom) : '…';
    const to   = selTo   ? formatDate(selTo)   : '…';
    tags.push(`<span class="filter-tag date">&#128197; ${from} – ${to}</span>`);
  }
  filterTagsEl.innerHTML = tags.join('');
}

// ── RENDER GR CARDS ──────────────────────────────────────────────────────────
function renderCards(items, startIndex) {
  if (!items.length) { grList.innerHTML = ''; return; }

  grList.innerHTML = items.map((gr, i) => {
    const serial   = startIndex + i + 1;
    const title    = cleanTitle(gr.title);
    const titleHL  = highlight(title, selQ);
    const pdfPath  = gr.pdf || '';           // already full relative path
    const dateDisp = gr.date ? formatDate(gr.date) : 'Date N/A';
    const deptDisp = gr.department || getDeptName(selDept);

    // Derive a filename for the download attribute
    const fileName = pdfPath.split('/').pop() || 'document.pdf';

    return `
      <div class="gr-card" role="article" aria-label="GR ${serial}">

        <div class="gr-serial">${serial}</div>

        <div class="gr-info">
          <p class="gr-title" title="${escHtml(title)}">${titleHL}</p>
          <div class="gr-meta">
            <span class="gr-badge dept">&#9962; ${escHtml(deptDisp)}</span>
            <span class="gr-badge date">&#128197; ${escHtml(dateDisp)}</span>
          </div>
        </div>

        <div class="gr-actions">
          <a class="btn-open"
             href="https://docs.google.com/gview?url=${encodeURIComponent(pdfPath)}&embedded=true"
             target="_blank"
             rel="noopener noreferrer"
             title="Open PDF in new tab">
            &#128065; View
          </a>
          <a class="btn-dl"
             href="${escHtml(pdfPath)}"
             download="${escHtml(fileName)}"
             title="Download PDF">
            &#8659; Download
          </a>
        </div>

      </div>
    `;
  }).join('');
}

// ── PAGINATION ────────────────────────────────────────────────────────────────
function renderPagination(total, current) {
  const totalPages = Math.ceil(total / PER_PAGE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';

  html += `<button class="pg-btn prev-next" onclick="goPage(${current - 1})"
             ${current <= 1 ? 'disabled' : ''} aria-label="Previous">&#8592;</button>`;

  getPageRange(current, totalPages).forEach(p => {
    if (p === '...') {
      html += `<span class="pg-ellipsis">…</span>`;
    } else {
      html += `<button class="pg-btn ${p === current ? 'active' : ''}"
                 onclick="goPage(${p})" aria-label="Page ${p}"
                 ${p === current ? 'aria-current="page"' : ''}>${p}</button>`;
    }
  });

  html += `<button class="pg-btn prev-next" onclick="goPage(${current + 1})"
             ${current >= totalPages ? 'disabled' : ''} aria-label="Next">&#8594;</button>`;

  paginationEl.innerHTML = html;
}

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const result = [1];
  const left  = current - 2;
  const right = current + 2;
  if (left > 2)  result.push('...');
  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) result.push(i);
  if (right < total - 1) result.push('...');
  result.push(total);
  return result;
}

function goPage(p) {
  const np = new URLSearchParams(window.location.search);
  np.set('page', p);
  window.location.href = 'results.html?' + np.toString();
}

// ── MAIN INIT ────────────────────────────────────────────────────────────────
function init() {
  const deptName = getDeptName(selDept);
  headerDeptName.textContent = deptName;
  document.title = deptName + ' GRs – Maharashtra GR Portal';

  buildFilterTags();

  // Department has no data yet
  if (!deptHasData(selDept)) {
    grList.innerHTML = '';
    paginationEl.innerHTML = '';
    noResults.classList.remove('hidden');
    noResultsHdg.textContent = 'Data Not Available';
    noResultsMsg.innerHTML =
      `Government Resolutions for <strong>${escHtml(deptName)}</strong> are not yet available.<br>
       Currently only <strong>Public Works Department</strong> GRs are loaded.`;
    resultsHeading.textContent = deptName;
    resultsSubtitle.textContent = 'No data available for this department.';
    pageIndicator.textContent = '';
    return;
  }

  const filtered  = filterData();
  const total     = filtered.length;
  const totalPgs  = Math.max(1, Math.ceil(total / PER_PAGE));
  if (curPage > totalPgs) curPage = totalPgs;

  resultsHeading.textContent = deptName + ' – Government Resolutions';

  if (total === 0) {
    resultsSubtitle.textContent = 'No GRs match your search criteria.';
    pageIndicator.textContent = '';
    grList.innerHTML = '';
    paginationEl.innerHTML = '';
    noResults.classList.remove('hidden');
    noResultsHdg.textContent = 'No Records Found';
    noResultsMsg.innerHTML =
      `No GRs match your filters. Try a different keyword or adjust the date range.`;
    return;
  }

  noResults.classList.add('hidden');

  const startIdx  = (curPage - 1) * PER_PAGE;
  const endIdx    = Math.min(startIdx + PER_PAGE, total);
  const pageItems = filtered.slice(startIdx, endIdx);

  resultsSubtitle.textContent = `Showing ${startIdx + 1}–${endIdx} of ${total} Government Resolutions`;
  pageIndicator.textContent   = `Page ${curPage} of ${totalPgs}`;

  renderCards(pageItems, startIdx);
  renderPagination(total, curPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

init();
