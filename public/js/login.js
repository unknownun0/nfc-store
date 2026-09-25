document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msgEl = document.getElementById('loginMsg');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    msgEl.innerHTML = `<div class="msg error">${data.error}</div>`;
    return;
  }

  const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
  const me = await meRes.json();

  document.querySelector('.center-card').style.display = 'none';
  document.getElementById('clientName').textContent = me.client.name;
  document.getElementById('clientEmail').textContent = me.client.email;
  document.getElementById('clientNfc').textContent = me.client.nfc_uid || '-';
  document.getElementById('ordersBody').innerHTML = me.orders.length
    ? me.orders
        .map((o) => `<tr><td>#${o.id}</td><td>$${o.total.toFixed(2)}</td><td>${new Date(o.created_at).toLocaleDateString()}</td></tr>`)
        .join('')
    : `<tr><td colspan="3" style="color:#9aa2b1">No orders yet</td></tr>`;
  document.getElementById('detailsView').style.display = 'block';
});
