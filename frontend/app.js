/* Browser JavaScript: render the interface and call the backend with fetch(). */
const $ = id => document.getElementById(id);
let user = null, registerMode = false, page = 1, pages = 1, activeReport = null;
let photoData = null, photoReady = true, loadNumber = 0;
async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method, credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('Server did not return JSON. Check npm start and the browser address.'); }
  if (!response.ok) {
    if (response.status === 401 && user) showSignedOut();
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}
function message(text, error = false) {
  $('message').textContent = text; $('message').className = error ? 'error' : ''; $('message').hidden = !text;
}
function inlineError(id, text = '') { $(id).textContent = text; $(id).hidden = !text; }
async function busy(form, action, errorId) {
  const button = form.querySelector('button[type="submit"], button:not([type])');
  if (button.disabled) return;
  button.disabled = true;
  if (errorId) inlineError(errorId); else message('');
  try { await action(); } catch (error) { if (errorId) inlineError(errorId, error.message); else message(error.message, true); }
  finally { button.disabled = false; }
}
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text; // textContent prevents user text becoming executable HTML.
  if (className) el.className = className;
  return el;
}
function badge(value, prefix = '') { return element('span', value, `badge ${prefix}${value.toLowerCase().replaceAll(' ', '-')}`); }
function date(value) { return new Date(value).toLocaleString(); }
function populate(select, values, first) {
  select.replaceChildren();
  if (first) select.add(new Option(first, ''));
  values.forEach(value => select.add(new Option(value, value)));
}
function mode(register) {
  registerMode = register; $('nameLabel').hidden = !register; $('name').required = register;
  $('password').autocomplete = register ? 'new-password' : 'current-password';
  $('authTitle').textContent = register ? 'Join CampusFix' : 'Welcome back';
  $('authHint').textContent = register ? 'Create a student account to submit reports.' : 'Sign in to view and manage your reports.';
  $('authSubmit').textContent = register ? 'Create account' : 'Sign in';
  $('loginTab').classList.toggle('active', !register); $('registerTab').classList.toggle('active', register);
  message('');
}
$('loginTab').onclick = () => mode(false); $('registerTab').onclick = () => mode(true);
function showSignedOut() {
  user = null; loadNumber++; $('dashboard').hidden = true; $('account').hidden = true; $('authView').hidden = false;
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  $('reportList').replaceChildren(); $('detailContent').replaceChildren(); $('password').value = '';
}
async function showDashboard() {
  $('authView').hidden = true; $('dashboard').hidden = false; $('account').hidden = false;
  $('userLabel').textContent = `${user.name} · ${user.role}`;
  const admin = user.role === 'admin';
  $('roleLabel').textContent = admin ? 'ADMINISTRATION WORKSPACE' : 'STUDENT WORKSPACE';
  $('dashboardTitle').textContent = admin ? 'Campus overview' : 'My reports';
  $('dashboardHint').textContent = admin ? 'Review campus issues and keep students informed.' : 'Keep track of the issues you have reported.';
  const meta = await api('/reports/meta');
  populate($('statusFilter'), meta.statuses, 'All statuses'); populate($('updateStatus'), meta.statuses);
  populate($('categoryFilter'), meta.categories, 'All categories'); populate($('newCategory'), meta.categories);
  $('search').value = ''; page = 1; await loadReports();
}
$('authForm').onsubmit = event => {
  event.preventDefault(); busy(event.currentTarget, async () => {
    const body = { email: $('email').value, password: $('password').value };
    if (registerMode) body.name = $('name').value;
    const data = await api(`/auth/${registerMode ? 'register' : 'login'}`, { method: 'POST', body });
    user = data.user; $('password').value = ''; await showDashboard();
  });
};
$('logout').onclick = async () => {
  $('logout').disabled = true;
  try { await api('/auth/logout', { method: 'POST', body: {} }); showSignedOut(); message('Signed out.'); }
  catch (error) { message(error.message, true); } finally { $('logout').disabled = false; }
};
async function loadReports() {
  const version = ++loadNumber;
  $('reportList').replaceChildren(element('p', 'Loading reports…', 'muted'));
  const query = new URLSearchParams({ page });
  if ($('search').value.trim()) query.set('q', $('search').value.trim());
  if ($('statusFilter').value) query.set('status', $('statusFilter').value);
  if ($('categoryFilter').value) query.set('category', $('categoryFilter').value);
  try {
    const [data, stats] = await Promise.all([api(`/reports?${query}`), api('/reports/stats')]);
    if (version !== loadNumber || !user) return;
    pages = data.pages;
    if (page > pages) { page = pages; return loadReports(); }
    $('totalStat').textContent = stats.total;
    $('pendingStat').textContent = stats.counts.Submitted + stats.counts['Under Review'];
    $('progressStat').textContent = stats.counts['In Progress']; $('resolvedStat').textContent = stats.counts.Resolved;
    $('resultsLabel').textContent = `${data.total} matching report${data.total === 1 ? '' : 's'}`;
    $('reportList').replaceChildren();
    if (!data.reports.length) $('reportList').append(element('div', 'No reports found. Submit a new report or change your filters.', 'empty'));
    data.reports.forEach(report => {
      const card = element('article', undefined, 'report-card'); const content = element('div', undefined, 'content');
      const badges = element('div', undefined, 'badges'); badges.append(badge(report.status, 'status-'), badge(report.type), badge(`${report.priority} priority`, 'priority-'));
      content.append(badges, element('h3', report.title), element('p', `${report.location} · ${report.category}`, 'muted'),
        element('p', `${date(report.createdAt)}${user.role === 'admin' ? ` · ${report.reporter?.name || 'Unknown reporter'}` : ''}`, 'muted'));
      const button = element('button', 'View report', 'secondary'); button.onclick = () => openReport(report._id);
      card.append(content, button); $('reportList').append(card);
    });
    $('pageLabel').textContent = `Page ${page} of ${pages}`; $('prevPage').disabled = page <= 1; $('nextPage').disabled = page >= pages;
  } catch (error) {
    if (version !== loadNumber) return;
    $('reportList').replaceChildren(element('div', 'Could not load reports. Use Apply filters to retry.', 'empty'));
    message(error.message, true);
  }
}
$('filterForm').onsubmit = event => { event.preventDefault(); page = 1; loadReports(); };
$('resetFilters').onclick = () => { $('filterForm').reset(); page = 1; loadReports(); };
$('prevPage').onclick = () => { if (page > 1) { page--; loadReports(); } };
$('nextPage').onclick = () => { if (page < pages) { page++; loadReports(); } };
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close());
$('newReport').onclick = () => {
  $('reportForm').reset(); photoVersion++; photoData = null; photoReady = true; $('photoPreview').hidden = true;
  inlineError('reportError'); $('reportDialog').showModal();
};
let photoVersion = 0;
$('photo').onchange = async () => {
  const version = ++photoVersion; photoData = null; photoReady = false; $('photoPreview').hidden = true; inlineError('reportError');
  const file = $('photo').files[0];
  if (!file) { photoReady = true; return; }
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    inlineError('reportError', 'Choose a JPEG, PNG or WebP no larger than 2 MB.'); $('photo').value = ''; photoReady = true; return;
  }
  try {
    const result = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Cannot read this photo.')); reader.readAsDataURL(file); });
    if (version !== photoVersion) return;
    photoData = result; $('photoPreview').src = result; $('photoPreview').hidden = false;
  } catch (error) { inlineError('reportError', error.message); $('photo').value = ''; }
  finally { if (version === photoVersion) photoReady = true; }
};
$('reportForm').onsubmit = event => {
  event.preventDefault(); busy(event.currentTarget, async () => {
    if (!photoReady) throw new Error('Please wait for the photo to finish loading.');
    const body = Object.fromEntries(new FormData($('reportForm'))); if (photoData) body.photo = photoData;
    await api('/reports', { method: 'POST', body }); $('reportDialog').close();
    $('filterForm').reset(); page = 1; await loadReports(); message('Report submitted. Administration can now review it.');
  }, 'reportError');
};
function renderDetail(report) {
  activeReport = report._id;
  const root = $('detailContent'); root.replaceChildren();
  const badges = element('div', undefined, 'badges'); badges.append(badge(report.status, 'status-'), badge(report.type), badge(`${report.priority} priority`));
  root.append(badges, element('h3', report.title));
  const grid = element('div', undefined, 'detail-grid');
  for (const [label, value] of [['Location',report.location],['Category',report.category],['Reported by',report.reporter?.name || 'Unknown'],['Submitted',date(report.createdAt)]]) {
    const item = element('div'); item.append(element('small',label), element('span',value)); grid.append(item);
  }
  root.append(grid, element('p', report.description, 'detail-text'));
  if (report.hasPhoto) { const img = element('img'); img.src = `/api/reports/${report._id}/photo`; img.alt = 'Photo attached to this report'; img.className = 'detail-photo'; root.append(img); }
  root.append(element('h3','Progress history'));
  const timeline = element('ol', undefined, 'timeline');
  report.updates.forEach(update => { const li = element('li'); li.append(element('strong',update.status), element('p',update.note), element('small',`${update.author} · ${date(update.at)}`)); timeline.append(li); });
  root.append(timeline); $('updateForm').hidden = user.role !== 'admin';
  $('updateStatus').value = report.status; $('updateNote').value = ''; inlineError('updateError');
}
async function openReport(id) {
  try { const data = await api(`/reports/${id}`); if (!user) return; renderDetail(data.report); if (!$('detailDialog').open) $('detailDialog').showModal(); }
  catch (error) { message(error.message, true); }
}
$('updateForm').onsubmit = event => {
  event.preventDefault(); busy(event.currentTarget, async () => {
    const data = await api(`/reports/${activeReport}/status`, { method: 'PATCH', body: { status: $('updateStatus').value, note: $('updateNote').value } });
    renderDetail(data.report); await loadReports(); message('Report updated. The reporter can see your note.');
  }, 'updateError');
};
(async () => {
  try { const data = await api('/auth/me'); user = data.user; await showDashboard(); }
  catch (error) { showSignedOut(); if (!/sign in|session expired/i.test(error.message)) message(error.message, true); }
})();
