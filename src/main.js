import { db, auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const app = document.getElementById('app');

let currentVendor = null; // { id, ...data }
let currentPage = 'dashboard';
let products = [];
let orders = [];
let unsubOrders = null;
let vendorStores = []; // all stores owned by this vendor account

// ── Auth state ──
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const vendorSnap = await getDocs(
      query(collection(db, 'vendors'), where('ownerId', '==', user.uid))
    );
    if (!vendorSnap.empty) {
      vendorStores = vendorSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (vendorStores.length === 1) {
        currentVendor = vendorStores[0];
        renderDashboard();
      } else {
        renderStoreSelector();
      }
    } else {
      renderSetupVendor(user);
    }
  } else {
    currentVendor = null;
    vendorStores = [];
    renderLogin();
  }
});

function renderStoreSelector() {
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1>Select Store</h1>
        <p>Choose which store to manage</p>
        ${vendorStores.map((s) => `
          <button class="btn btn-secondary store-pick" data-id="${s.id}" style="width:100%;margin-bottom:8px;justify-content:center">
            ${s.name} <span style="color:#636e72;font-size:12px;margin-left:8px">${s.category}</span>
          </button>
        `).join('')}
        <button class="btn btn-secondary" id="logout-selector" style="width:100%;margin-top:16px;justify-content:center">Sign Out</button>
      </div>
    </div>
  `;
  document.querySelectorAll('.store-pick').forEach((btn) => {
    btn.onclick = () => {
      currentVendor = vendorStores.find((s) => s.id === btn.dataset.id);
      renderDashboard();
    };
  });
  document.getElementById('logout-selector').onclick = () => signOut(auth);
}

// ── Login page ──
function renderLogin() {
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1>Kali Vendor</h1>
        <p>Sign in to manage your store</p>
        <div id="login-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="email" placeholder="vendor@example.com" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" placeholder="Enter password" />
          </div>
          <div id="auth-error" class="error-msg"></div>
          <button class="btn btn-primary" id="login-btn" style="margin-top:12px">Sign In</button>
          <button class="btn btn-secondary" id="register-btn" style="margin-top:8px;width:100%;justify-content:center">Create Account</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const pw = document.getElementById('password').value;
    const errEl = document.getElementById('auth-error');
    if (!email || !pw) {
      errEl.textContent = 'Please enter both email and password.';
      return;
    }
    try {
      errEl.textContent = 'Signing in...';
      await signInWithEmailAndPassword(auth, email, pw);
    } catch (e) {
      errEl.textContent = e.message;
    }
  };
  document.getElementById('register-btn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const pw = document.getElementById('password').value;
    const errEl = document.getElementById('auth-error');
    if (!email || !pw) {
      errEl.textContent = 'Please enter both email and password.';
      return;
    }
    if (pw.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters.';
      return;
    }
    try {
      errEl.textContent = 'Creating account...';
      await createUserWithEmailAndPassword(auth, email, pw);
    } catch (e) {
      errEl.textContent = e.message;
    }
  };
}

// ── Setup vendor profile (first time) ──
function renderSetupVendor(user) {
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1>Setup Your Store</h1>
        <p>Create your vendor profile to get started</p>
        <div class="form-group"><label>Store Name</label><input id="v-name" placeholder="e.g. Mama Nkechi Kitchen" /></div>
        <div class="form-group"><label>Description</label><textarea id="v-desc" rows="2" placeholder="What do you sell?"></textarea></div>
        <div class="form-group"><label>Category</label>
          <select id="v-cat">
            <option>Restaurants</option><option>Fast Food</option><option>Groceries</option><option>Pharmacy</option><option>Bakery</option>
          </select>
        </div>
        <div class="form-group"><label>Address</label><input id="v-addr" placeholder="Store address" /></div>
        <div class="form-group"><label>Delivery Fee</label><input id="v-fee" type="number" value="500" /></div>
        <div class="form-group"><label>Min Order</label><input id="v-min" type="number" value="1000" /></div>
        <div class="form-group"><label>Prep Time (minutes)</label><input id="v-prep" type="number" value="25" /></div>
        <div id="setup-error" class="error-msg"></div>
        <button class="btn btn-primary" id="setup-btn" style="margin-top:12px">Create Store</button>
      </div>
    </div>
  `;
  document.getElementById('setup-btn').onclick = async () => {
    const name = document.getElementById('v-name').value.trim();
    if (!name) return;
    try {
      const vendorData = {
        name,
        description: document.getElementById('v-desc').value.trim(),
        imageUrl: '',
        logoUrl: '',
        category: document.getElementById('v-cat').value,
        rating: 0,
        reviewCount: 0,
        prepTimeMinutes: parseInt(document.getElementById('v-prep').value) || 25,
        deliveryFee: parseFloat(document.getElementById('v-fee').value) || 500,
        minOrder: parseFloat(document.getElementById('v-min').value) || 1000,
        isOpen: true,
        address: document.getElementById('v-addr').value.trim(),
        tags: [],
        ownerId: user.uid,
      };
      const ref = await addDoc(collection(db, 'vendors'), vendorData);
      currentVendor = { id: ref.id, ...vendorData };
      renderDashboard();
    } catch (e) {
      document.getElementById('setup-error').textContent = e.message;
    }
  };
}

// ── Main dashboard layout ──
function renderDashboard() {
  app.innerHTML = `
    <div class="layout">
      <nav class="sidebar">
        <div class="sidebar-brand">
          <h2>Kali Vendor</h2>
          <span>${currentVendor.name}</span>
        </div>
        <div class="store-status">
          <div class="dot ${currentVendor.isOpen ? 'open' : 'closed'}"></div>
          <span>${currentVendor.isOpen ? 'Store Open' : 'Store Closed'}</span>
          <label class="toggle-switch" style="margin-left:auto">
            <input type="checkbox" id="store-toggle" ${currentVendor.isOpen ? 'checked' : ''} />
            <div class="toggle-slider"></div>
          </label>
        </div>
        <div class="sidebar-nav">
          <a data-page="dashboard" class="active"><span class="material-icons">dashboard</span><span>Dashboard</span></a>
          <a data-page="orders"><span class="material-icons">receipt_long</span><span>Orders</span></a>
          <a data-page="products"><span class="material-icons">restaurant_menu</span><span>Products</span></a>
          <a data-page="profile"><span class="material-icons">store</span><span>Profile</span></a>
          ${vendorStores.length > 1 ? '<a id="switch-store-btn"><span class="material-icons">swap_horiz</span><span>Switch Store</span></a>' : ''}
          <a id="logout-btn"><span class="material-icons">logout</span><span>Sign Out</span></a>
        </div>
      </nav>
      <div class="main-content" id="page-content"></div>
    </div>
    <div class="modal-overlay" id="modal-overlay"><div class="modal" id="modal-body"></div></div>
  `;

  // Nav clicks
  document.querySelectorAll('.sidebar-nav a[data-page]').forEach((a) => {
    a.onclick = () => {
      document.querySelectorAll('.sidebar-nav a').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
      currentPage = a.dataset.page;
      renderPage();
    };
  });

  document.getElementById('logout-btn').onclick = () => signOut(auth);

  const switchBtn = document.getElementById('switch-store-btn');
  if (switchBtn) switchBtn.onclick = () => renderStoreSelector();

  document.getElementById('store-toggle').onchange = async (e) => {
    const isOpen = e.target.checked;
    await updateDoc(doc(db, 'vendors', currentVendor.id), { isOpen });
    currentVendor.isOpen = isOpen;
    const dot = document.querySelector('.store-status .dot');
    const label = document.querySelector('.store-status span:nth-child(2)');
    dot.className = `dot ${isOpen ? 'open' : 'closed'}`;
    label.textContent = isOpen ? 'Store Open' : 'Store Closed';
  };

  document.getElementById('modal-overlay').onclick = (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  };

  loadData();
}

async function loadData() {
  // Load products
  const pSnap = await getDocs(
    query(collection(db, 'products'), where('vendorId', '==', currentVendor.id))
  );
  products = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Listen to orders
  if (unsubOrders) unsubOrders();
  const oQuery = query(
    collection(db, 'orders'),
    where('vendorId', '==', currentVendor.id),
    orderBy('createdAt', 'desc')
  );
  unsubOrders = onSnapshot(oQuery, (snap) => {
    orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (currentPage === 'dashboard' || currentPage === 'orders') renderPage();
  });

  renderPage();
}

function renderPage() {
  const content = document.getElementById('page-content');
  if (!content) return;
  switch (currentPage) {
    case 'dashboard': renderDashboardPage(content); break;
    case 'orders': renderOrdersPage(content); break;
    case 'products': renderProductsPage(content); break;
    case 'profile': renderProfilePage(content); break;
  }
}

// ── Dashboard page ──
function renderDashboardPage(el) {
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const todayOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return d.toDateString() === new Date().toDateString();
  });
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  el.innerHTML = `
    <div class="page-header"><h1>Dashboard</h1></div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon" style="background:#ff6b35"><span class="material-icons">pending_actions</span></div>
        <div class="label">Active Orders</div>
        <div class="value">${activeOrders.length}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#0984e3"><span class="material-icons">today</span></div>
        <div class="label">Today's Orders</div>
        <div class="value">${todayOrders.length}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#00b894"><span class="material-icons">payments</span></div>
        <div class="label">Today's Revenue</div>
        <div class="value">${formatPrice(todayRevenue)}</div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#6c5ce7"><span class="material-icons">inventory_2</span></div>
        <div class="label">Products</div>
        <div class="value">${products.length}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Active Orders</h3></div>
      ${activeOrders.length === 0
        ? '<div class="empty-state"><span class="material-icons">inbox</span><p>No active orders</p></div>'
        : `<table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${activeOrders.slice(0, 10).map((o) => `
              <tr>
                <td>#${o.id.slice(-6)}</td>
                <td>${o.deliveryAddress || 'N/A'}</td>
                <td>${(o.items || []).length} items</td>
                <td>${formatPrice(o.total)}</td>
                <td><span class="badge badge-${o.status}">${o.status}</span></td>
                <td>${getOrderActions(o)}</td>
              </tr>
            `).join('')}</tbody>
          </table>`
      }
    </div>
  `;
  bindOrderActions();
}

// ── Orders page ──
function renderOrdersPage(el) {
  el.innerHTML = `
    <div class="page-header"><h1>Orders</h1></div>
    <div class="card">
      ${orders.length === 0
        ? '<div class="empty-state"><span class="material-icons">receipt_long</span><p>No orders yet</p></div>'
        : `<table>
            <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Action</th></tr></thead>
            <tbody>${orders.map((o) => `
              <tr>
                <td>#${o.id.slice(-6)}</td>
                <td>${(o.items || []).map((i) => `${i.name} x${i.quantity}`).join(', ')}</td>
                <td>${formatPrice(o.total)}</td>
                <td><span class="badge badge-${o.status}">${o.status}</span></td>
                <td>${formatTime(o.createdAt)}</td>
                <td>${getOrderActions(o)}</td>
              </tr>
            `).join('')}</tbody>
          </table>`
      }
    </div>
  `;
  bindOrderActions();
}

function getOrderActions(order) {
  const statusFlow = ['pending', 'confirmed', 'preparing', 'ready'];
  const idx = statusFlow.indexOf(order.status);
  if (idx === -1) return '-';
  const next = idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  let html = '';
  if (next) {
    html += `<button class="btn btn-success btn-small order-action" data-id="${order.id}" data-status="${next}">Mark ${next}</button>`;
  }
  if (order.status === 'pending') {
    html += ` <button class="btn btn-danger btn-small order-action" data-id="${order.id}" data-status="cancelled">Cancel</button>`;
  }
  return html;
}

function bindOrderActions() {
  document.querySelectorAll('.order-action').forEach((btn) => {
    btn.onclick = async () => {
      const { id, status } = btn.dataset;
      await updateDoc(doc(db, 'orders', id), { status });
    };
  });
}

// ── Products page ──
function renderProductsPage(el) {
  el.innerHTML = `
    <div class="page-header">
      <h1>Products</h1>
      <button class="btn btn-primary" id="add-product-btn"><span class="material-icons">add</span> Add Product</button>
    </div>
    ${products.length === 0
      ? '<div class="empty-state"><span class="material-icons">restaurant_menu</span><p>No products yet. Add your first product.</p></div>'
      : `<div class="product-grid">${products.map((p) => `
          <div class="product-card">
            <h4>${p.name}</h4>
            <div class="category">${p.menuCategory || ''}</div>
            <p style="font-size:13px;color:#636e72;margin-bottom:8px">${p.description || ''}</p>
            <div>
              ${p.discountPrice
                ? `<span class="price">${formatPrice(p.discountPrice)}</span><span class="original-price">${formatPrice(p.price)}</span>`
                : `<span class="price">${formatPrice(p.price)}</span>`
              }
            </div>
            <div class="availability">
              <label class="toggle-switch">
                <input type="checkbox" class="product-toggle" data-id="${p.id}" ${p.isAvailable ? 'checked' : ''} />
                <div class="toggle-slider"></div>
              </label>
              ${p.isAvailable ? 'Available' : 'Unavailable'}
            </div>
            <div class="actions">
              <button class="btn btn-secondary btn-small edit-product" data-id="${p.id}">Edit</button>
              <button class="btn btn-danger btn-small delete-product" data-id="${p.id}">Delete</button>
            </div>
          </div>
        `).join('')}</div>`
    }
  `;

  document.getElementById('add-product-btn').onclick = () => showProductModal();

  document.querySelectorAll('.product-toggle').forEach((t) => {
    t.onchange = async (e) => {
      const id = e.target.dataset.id;
      await updateDoc(doc(db, 'products', id), { isAvailable: e.target.checked });
      const p = products.find((x) => x.id === id);
      if (p) p.isAvailable = e.target.checked;
    };
  });

  document.querySelectorAll('.edit-product').forEach((btn) => {
    btn.onclick = () => {
      const p = products.find((x) => x.id === btn.dataset.id);
      if (p) showProductModal(p);
    };
  });

  document.querySelectorAll('.delete-product').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Delete this product?')) return;
      await deleteDoc(doc(db, 'products', btn.dataset.id));
      products = products.filter((x) => x.id !== btn.dataset.id);
      renderProductsPage(el);
    };
  });
}

function showProductModal(existing = null) {
  const modal = document.getElementById('modal-body');
  modal.innerHTML = `
    <h2>${existing ? 'Edit' : 'Add'} Product</h2>
    <div class="form-group"><label>Name</label><input id="p-name" value="${existing?.name || ''}" /></div>
    <div class="form-group"><label>Description</label><textarea id="p-desc" rows="2">${existing?.description || ''}</textarea></div>
    <div class="form-group"><label>Menu Category</label><input id="p-cat" value="${existing?.menuCategory || ''}" placeholder="e.g. Rice Dishes, Burgers" /></div>
    <div class="form-group"><label>Price</label><input id="p-price" type="number" value="${existing?.price || ''}" /></div>
    <div class="form-group"><label>Discount Price (optional)</label><input id="p-discount" type="number" value="${existing?.discountPrice || ''}" /></div>
    <div class="form-group"><label>Tags (comma separated)</label><input id="p-tags" value="${(existing?.tags || []).join(', ')}" /></div>
    <div class="form-group"><label>Image URL (optional)</label><input id="p-image" value="${existing?.imageUrl || ''}" /></div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save">Save</button>
    </div>
  `;
  openModal();

  document.getElementById('modal-cancel').onclick = closeModal;
  document.getElementById('modal-save').onclick = async () => {
    const name = document.getElementById('p-name').value.trim();
    const price = parseFloat(document.getElementById('p-price').value);
    if (!name || !price) return;

    const discountVal = document.getElementById('p-discount').value;
    const data = {
      vendorId: currentVendor.id,
      name,
      description: document.getElementById('p-desc').value.trim(),
      menuCategory: document.getElementById('p-cat').value.trim(),
      price,
      discountPrice: discountVal ? parseFloat(discountVal) : null,
      isAvailable: existing ? existing.isAvailable : true,
      tags: document.getElementById('p-tags').value.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: document.getElementById('p-image').value.trim(),
    };

    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), data);
      Object.assign(existing, data);
    } else {
      const ref = await addDoc(collection(db, 'products'), data);
      products.push({ id: ref.id, ...data });
    }
    closeModal();
    renderPage();
  };
}

// ── Profile page ──
function renderProfilePage(el) {
  const v = currentVendor;
  el.innerHTML = `
    <div class="page-header"><h1>Store Profile</h1></div>
    <div class="card">
      <div class="form-group"><label>Store Name</label><input id="pf-name" value="${v.name}" /></div>
      <div class="form-group"><label>Description</label><textarea id="pf-desc" rows="3">${v.description || ''}</textarea></div>
      <div class="form-group"><label>Category</label>
        <select id="pf-cat">
          ${['Restaurants', 'Fast Food', 'Groceries', 'Pharmacy', 'Bakery'].map((c) =>
            `<option ${c === v.category ? 'selected' : ''}>${c}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group"><label>Address</label><input id="pf-addr" value="${v.address || ''}" /></div>
      <div class="form-group"><label>Delivery Fee</label><input id="pf-fee" type="number" value="${v.deliveryFee || 0}" /></div>
      <div class="form-group"><label>Min Order</label><input id="pf-min" type="number" value="${v.minOrder || 0}" /></div>
      <div class="form-group"><label>Prep Time (minutes)</label><input id="pf-prep" type="number" value="${v.prepTimeMinutes || 25}" /></div>
      <div class="form-group"><label>Tags (comma separated)</label><input id="pf-tags" value="${(v.tags || []).join(', ')}" /></div>
      <div class="form-group"><label>Image URL</label><input id="pf-img" value="${v.imageUrl || ''}" /></div>
      <div class="form-group"><label>Logo URL</label><input id="pf-logo" value="${v.logoUrl || ''}" /></div>
      <button class="btn btn-primary" id="save-profile" style="margin-top:12px">Save Changes</button>
      <span id="profile-msg" style="margin-left:12px;color:#00b894;font-size:13px"></span>
    </div>
  `;

  document.getElementById('save-profile').onclick = async () => {
    const data = {
      name: document.getElementById('pf-name').value.trim(),
      description: document.getElementById('pf-desc').value.trim(),
      category: document.getElementById('pf-cat').value,
      address: document.getElementById('pf-addr').value.trim(),
      deliveryFee: parseFloat(document.getElementById('pf-fee').value) || 0,
      minOrder: parseFloat(document.getElementById('pf-min').value) || 0,
      prepTimeMinutes: parseInt(document.getElementById('pf-prep').value) || 25,
      tags: document.getElementById('pf-tags').value.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: document.getElementById('pf-img').value.trim(),
      logoUrl: document.getElementById('pf-logo').value.trim(),
    };
    await updateDoc(doc(db, 'vendors', currentVendor.id), data);
    Object.assign(currentVendor, data);
    document.querySelector('.sidebar-brand span').textContent = data.name;
    document.getElementById('profile-msg').textContent = 'Saved!';
    setTimeout(() => {
      const msg = document.getElementById('profile-msg');
      if (msg) msg.textContent = '';
    }, 2000);
  };
}

// ── Helpers ──
function formatPrice(amount) {
  return '\u20A6' + (amount || 0).toLocaleString();
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}
