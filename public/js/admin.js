function getToken() { return localStorage.getItem('adminToken'); }
function setToken(t) { localStorage.setItem('adminToken', t); }
function clearToken() { localStorage.removeItem('adminToken'); }

function showView() {
  const loggedIn = !!getToken();
  document.getElementById('loginView').style.display = loggedIn ? 'none' : 'block';
  document.getElementById('dashView').style.display = loggedIn ? 'block' : 'none';
  if (loggedIn) loadClients();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  const msgEl = document.getElementById('loginMsg');
  if (!res.ok) {
    msgEl.innerHTML = `<div class="msg error">${data.error}</div>`;
    return;
  }
  setToken(data.token);
  showView();
});

document.getElementById('logoutLink').addEventListener('click', (e) => {
  e.preventDefault();
  clearToken();
  showView();
});

async function authedFetch(url, options = {}) {
  options.headers = { ...(options.headers || {}), Authorization: `Bearer ${getToken()}` };
  return fetch(url, options);
}

document.getElementById('createBtn').addEventListener('click', async () => {
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const nfc_uid = document.getElementById('cNfc').value.trim();
  const msgEl = document.getElementById('createMsg');
  const resultEl = document.getElementById('newClientResult');
  resultEl.innerHTML = '';

  if (!name || !email) {
    msgEl.innerHTML = `<div class="msg error">Name and email are required.</div>`;
    return;
  }

  const res = await authedFetch('/api/admin/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, nfc_uid }),
  });
  const data = await res.json();

  if (!res.ok) {
    msgEl.innerHTML = `<div class="msg error">${data.error}</div>`;
    return;
  }

  msgEl.innerHTML = `<div class="msg success">Account created and activation email sent to ${email}.</div>`;
  resultEl.innerHTML = `
    <div class="qr-box">
      <img src="${data.qr}" alt="QR code" />
      <div>
        <div style="margin-bottom:6px;font-weight:600">Account link (also encoded in the QR):</div>
        <div class="link-text">${data.accountUrl}</div>
      </div>
    </div>`;

  document.getElementById('cName').value = '';
  document.getElementById('cEmail').value = '';
  document.getElementById('cNfc').value = '';
  loadClients();
});

async function loadClients() {
  const res = await authedFetch('/api/admin/clients');
  if (!res.ok) return;
  const clients = await res.json();
  const body = document.getElementById('clientsBody');
  body.innerHTML = clients
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.nfc_uid || '-'}</td>
      <td><span class="badge ${c.status}">${c.status}</span></td>
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
      <td>
        <button class="secondary" onclick="showQr(${c.id})">Show QR/link</button>
        ${c.status === 'pending' ? `<button class="secondary" onclick="resendCode(${c.id})">Resend code</button>` : ''}
      </td>
    </tr>
    <tr id="qrRow-${c.id}" style="display:none"><td colspan="6"><div id="qrBox-${c.id}"></div></td></tr>
  `
    )
    .join('');
}

async function showQr(id) {
  const row = document.getElementById(`qrRow-${id}`);
  const box = document.getElementById(`qrBox-${id}`);
  if (row.style.display === 'table-row') {
    row.style.display = 'none';
    return;
  }
  const res = await authedFetch(`/api/admin/clients/${id}/qr`);
  const data = await res.json();
  box.innerHTML = `
    <div class="qr-box">
      <img src="${data.qr}" alt="QR code" />
      <div class="link-text">${data.accountUrl}</div>
    </div>`;
  row.style.display = 'table-row';
}

async function resendCode(id) {
  const res = await authedFetch(`/api/admin/clients/${id}/resend-code`, { method: 'POST' });
  const data = await res.json();
  alert(res.ok ? 'Activation code resent.' : data.error);
}

showView();
