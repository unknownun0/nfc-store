let products = [];
let cart = {}; // productId -> quantity

async function loadProducts() {
  const res = await fetch('/api/shop/products');
  products = await res.json();
  renderProducts();
}

function renderProducts() {
  const el = document.getElementById('products');
  el.innerHTML = products
    .map(
      (p) => `
    <div class="card">
      <h3>${p.name}</h3>
      <div class="desc">${p.description || ''}</div>
      <div class="price">$${p.price.toFixed(2)}</div>
      <button onclick="addToCart(${p.id})">Add to cart</button>
    </div>`
    )
    .join('');
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cartItems');
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    el.innerHTML = '<p style="color:#9aa2b1;font-size:13px">Cart is empty</p>';
  } else {
    el.innerHTML = ids
      .map((id) => {
        const p = products.find((x) => x.id == id);
        return `<div class="cart-item"><span>${p.name} x${cart[id]}</span><span>$${(p.price * cart[id]).toFixed(2)}</span></div>`;
      })
      .join('');
  }
  const total = ids.reduce((sum, id) => sum + products.find((x) => x.id == id).price * cart[id], 0);
  document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

function showMsg(text, type) {
  document.getElementById('checkoutMsg').innerHTML = `<div class="msg ${type}">${text}</div>`;
}

document.getElementById('checkoutBtn').addEventListener('click', async () => {
  const ids = Object.keys(cart);
  if (ids.length === 0) return showMsg('Your cart is empty.', 'error');

  const name = document.getElementById('ckName').value.trim();
  const email = document.getElementById('ckEmail').value.trim();
  if (!name || !email) return showMsg('Please enter your name and email.', 'error');

  const items = ids.map((id) => ({ productId: Number(id), quantity: cart[id] }));

  const res = await fetch('/api/shop/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, guest_name: name, guest_email: email }),
  });
  const data = await res.json();

  if (!res.ok) return showMsg(data.error || 'Checkout failed', 'error');

  showMsg(`Order #${data.orderId} placed - total $${data.total.toFixed(2)}. Thank you!`, 'success');
  cart = {};
  renderCart();
});

loadProducts();
renderCart();
