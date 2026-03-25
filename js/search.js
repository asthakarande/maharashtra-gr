// search.js
// Handles the search form on index.html

document.getElementById('searchForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const dept     = document.getElementById('department');
  const keyword  = document.getElementById('keyword').value.trim();
  const fromDate = document.getElementById('fromDate').value;
  const toDate   = document.getElementById('toDate').value;
  const deptErr  = document.getElementById('dept-error');

  // Validate department
  if (!dept.value) {
    dept.classList.add('error');
    deptErr.classList.add('visible');
    dept.focus();
    return;
  }

  dept.classList.remove('error');
  deptErr.classList.remove('visible');

  // Validate date range
  if (fromDate && toDate && fromDate > toDate) {
    alert('⚠ "From Date" cannot be later than "To Date". Please fix the date range.');
    return;
  }

  // Build URL params
  const params = new URLSearchParams();
  params.set('dept', dept.value);
  if (keyword)  params.set('q', keyword);
  if (fromDate) params.set('from', fromDate);
  if (toDate)   params.set('to', toDate);
  params.set('page', '1');

  // Animate button
  const btn = document.getElementById('searchBtn');
  btn.textContent = 'Loading…';
  btn.disabled = true;

  // Redirect
  window.location.href = 'results.html?' + params.toString();
});

// Clear error on change
document.getElementById('department').addEventListener('change', function () {
  this.classList.remove('error');
  document.getElementById('dept-error').classList.remove('visible');
});
