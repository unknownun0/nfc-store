const token = window.location.pathname.split('/account/')[1];

function show(id) {
  ['loadingView', 'activateView', 'detailsView', 'errorView'].forEach((v) => {
    document.getElementById(v).style.display = v === id ? 'block' : 'none';
  });
}

async function init() {
  if (!token) return showError('No account token in the URL.');

  const statusRes = await fetch(`/api/account/${token}/status`);
  if (!statusRes.ok) {
    const d = await statusRes.json();
    return showError(d.error || 'Account not found');
  }
  const status = await statusRes.json();

  if (status.status === 'pending') {
    show('activateView');
  } else {
    loadDetails();
  }
}

function showError(text) {
  document.getElementById('errorText').textContent = text;
  show('errorView');
}

document.getElementById('activateBtn').addEventListener('click', async () => {
  const code = document.getElementById('code').value.trim();
  const password = document.getElementById('password').value;
  const msgEl = document.getElementById('activateMsg');

  const res = await fetch(`/api/account/${token}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    msgEl.innerHTML = `<div class="msg error">${data.error}</div>`;
    return;
  }

  msgEl.innerHTML = `<div class="msg success">Account activated!</div>`;
  loadDetails();
});

async function loadDetails() {
  const res = await fetch(`/api/account/${token}`);
  if (!res.ok) {
    const d = await res.json();
    return showError(d.error || 'Could not load account');
  }
  const data = await res.json();

  document.getElementById('clientName').textContent = data.client.name;
  document.getElementById('clientEmail').textContent = data.client.email;
  document.getElementById('clientNfc').textContent = data.client.nfc_uid || '-';
  document.getElementById('clientSince').textContent = new Date(data.client.created_at).toLocaleDateString();

  document.getElementById('ordersBody').innerHTML = data.orders.length
    ? data.orders
        .map((o) => `<tr><td>#${o.id}</td><td>$${o.total.toFixed(2)}</td><td>${new Date(o.created_at).toLocaleDateString()}</td></tr>`)
        .join('')
    : `<tr><td colspan="3" style="color:#9aa2b1">No orders yet</td></tr>`;

  show('detailsView');
}

init();
