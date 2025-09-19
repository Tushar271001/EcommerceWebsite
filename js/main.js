
// main.js - Unified Cart + Account (per-user carts)

// ===============================
// LocalStorage Helpers
// ===============================
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("loggedInUser")) || null;
}
function setLoggedInUser(user) {
  if (user) localStorage.setItem("loggedInUser", JSON.stringify(user));
  else localStorage.removeItem("loggedInUser");
  refreshAccountUI();
  updateCartBadge();
  loadCart();
}

// Per-user cart
function getCart() {
  const user = getLoggedInUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem(`cart_${user.email}`)) || [];
}
function saveCart(cart) {
  const user = getLoggedInUser();
  if (!user) return;
  localStorage.setItem(`cart_${user.email}`, JSON.stringify(cart));
  updateCartBadge();
}

// ===============================
// Cart: badge, load, add, remove
// ===============================
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  const user = getLoggedInUser();
  if (!badge) return;
  if (!user) {
    badge.textContent = "0";
    return;
  }
  const cart = getCart();
  badge.textContent = cart.length;
}

function loadCart() {
  const itemsContainer = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!itemsContainer || !totalEl) return;

  const user = getLoggedInUser();
  if (!user) {
    itemsContainer.innerHTML = `<p>Please login to view your cart.</p>`;
    totalEl.textContent = "₹0.00";
    return;
  }

  const cart = getCart();
  itemsContainer.innerHTML = "";

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart-message">
        <i class="fas fa-shopping-cart" style="font-size:48px;margin-bottom:15px;"></i>
        <p>Your cart is empty</p>
        <p>Start shopping to add items!</p>
      </div>`;
    totalEl.textContent = "₹0.00";
    return;
  }

  let total = 0;
  cart.forEach((item, idx) => {
    total += item.price;
    const html = `
      <div class="cart-item">
        <div class="cart-item-img"><img src="${item.image}" alt="${item.name}"></div>
        <div class="cart-item-details">
          <p class="cart-item-title">${item.name}</p>
          <p class="cart-item-price">₹${item.price.toFixed(2)}</p>
        </div>
        <button class="remove-item" data-index="${idx}" aria-label="Remove item">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    itemsContainer.insertAdjacentHTML("beforeend", html);
  });

  totalEl.textContent = `₹${total.toFixed(2)}`;
}

function addProductToCart(product) {
  const user = getLoggedInUser();
  if (!user) {
    alert("Please login to add items to your cart.");
    return;
  }
  const cart = getCart();
  cart.push(product);
  saveCart(cart);
  loadCart();
}

function removeFromCart(index) {
  const cart = getCart();
  const idx = parseInt(index, 10);
  if (!isNaN(idx) && idx >= 0 && idx < cart.length) {
    cart.splice(idx, 1);
    saveCart(cart);
    loadCart();
  }
}

// ===============================
// Auth: register / login / UI
// ===============================
function registerUser({ name, email, password }) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, message: "Email already registered" };
  }
  users.push({ name, email, password });
  saveUsers(users);
  return { ok: true };
}

function authenticateUser({ email, password }) {
  const users = getUsers();
  return (
    users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    ) || null
  );
}

function refreshAccountUI() {
  const loginBtn = document.getElementById("login-icon");
  const user = getLoggedInUser();
  if (!loginBtn) return;

  if (user) {
    const short = (user.name || user.email).split(" ")[0];
    loginBtn.innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(short)}`;
    loginBtn.dataset.logged = "true";
    loginBtn.dataset.userEmail = user.email;
  } else {
    loginBtn.innerHTML = `<i class="fas fa-user"></i> Account`;
    loginBtn.removeAttribute("data-logged");
    loginBtn.removeAttribute("data-user-email");
  }
}

// Escape HTML to prevent injection
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===============================
// Event Delegation
// ===============================
document.addEventListener("click", (e) => {
  const target = e.target;
  const closest = (sel) =>
    target.closest ? target.closest(sel) : null;

  // NAV TOGGLE
  if (closest("#navToggle")) {
    const navToggle = document.getElementById("navToggle");
    const navItems = document.getElementById("navItems");
    if (navItems && navToggle) {
      navItems.classList.toggle("active");
      const icon = navToggle.querySelector("i");
      if (navItems.classList.contains("active")) {
        icon.classList.replace("fa-bars", "fa-times");
      } else {
        icon.classList.replace("fa-times", "fa-bars");
      }
    }
    return;
  }

  // DROPDOWN mobile
  if (closest(".dropdown > a")) {
    const link = closest(".dropdown > a");
    if (window.innerWidth <= 768) {
      e.preventDefault();
      const parent = link.parentElement;
      parent.classList.toggle("open");
      document.querySelectorAll(".dropdown").forEach((li) => {
        if (li !== parent) li.classList.remove("open");
      });
    }
    return;
  }

  // ADD TO CART
  const atcBtn = closest(".add-to-cart-btn");
  if (atcBtn) {
    e.preventDefault();
    const name = atcBtn.getAttribute("data-name") || "";
    const price = parseFloat(atcBtn.getAttribute("data-price")) || 0;
    const image = atcBtn.getAttribute("data-image") || "images/ss.jpg";
    addProductToCart({ name, price, image });
    return;
  }

  // REMOVE CART ITEM
  if (closest(".remove-item")) {
    e.preventDefault();
    const idx = closest(".remove-item").dataset.index;
    removeFromCart(idx);
    return;
  }

  // OPEN CART
  if (closest("#cart-icon") || closest("#cart-count")) {
    e.preventDefault();
    const sidebar = document.getElementById("cart-sidebar");
    if (sidebar) {
      sidebar.classList.add("open");
      loadCart();
    }
    return;
  }

  // CLOSE CART
  if (closest("#close-cart")) {
    const sidebar = document.getElementById("cart-sidebar");
    if (sidebar) sidebar.classList.remove("open");
    return;
  }

  // CHECKOUT
  if (closest("#checkout-btn")) {
    window.location.href = "/checkout.html";
    return;
  }

  // ===============================
  // LOGIN / REGISTER / LOGOUT
  // ===============================
  if (closest("#login-icon")) {
    e.preventDefault();
    const user = getLoggedInUser();

    if (user) {
      // Already logged in → ask for logout
      if (confirm("Logout?")) {
        setLoggedInUser(null);
      }
    } else {
      // Not logged in → open login modal
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.style.display = "flex";
    }
    return;
  }

  // OPEN REGISTER (switch from login → register)
  if (closest("#open-register")) {
    e.preventDefault();
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("register-modal").style.display = "flex";
    return;
  }

  // OPEN LOGIN (switch from register → login)
  if (closest("#open-login")) {
    e.preventDefault();
    document.getElementById("register-modal").style.display = "none";
    document.getElementById("login-modal").style.display = "flex";
    return;
  }

  // CLOSE LOGIN MODAL
  if (closest("#close-login")) {
    document.getElementById("login-modal").style.display = "none";
    return;
  }

  // CLOSE REGISTER MODAL
  if (closest("#close-register")) {
    document.getElementById("register-modal").style.display = "none";
    return;
  }
});

// ===============================
// Form Submissions
// ===============================
document.addEventListener("submit", (e) => {
  const form = e.target;

  if (form.id === "register-form") {
    e.preventDefault();
    const name = form.querySelector('input[type="text"]').value || "";
    const email = form.querySelector('input[type="email"]').value || "";
    const password = form.querySelector('input[type="password"]').value || "";

    const res = registerUser({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (!res.ok) return alert(res.message);

    setLoggedInUser({ name, email });
    form.closest(".modal").style.display = "none";
  }

  if (form.id === "login-form") {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value || "";
    const password = form.querySelector('input[type="password"]').value || "";

    const user = authenticateUser({ email: email.trim(), password });
    if (!user) return alert("Invalid email or password");

    setLoggedInUser(user);
    form.closest(".modal").style.display = "none";
  }
});

// ===============================
// Close modals by clicking outside
// ===============================
document.addEventListener("click", (e) => {
  const loginModal = document.getElementById("login-modal");
  const registerModal = document.getElementById("register-modal");
  if (loginModal && e.target === loginModal) loginModal.style.display = "none";
  if (registerModal && e.target === registerModal)
    registerModal.style.display = "none";
});

// ===============================
// Load Navbar & Footer
// ===============================
function loadComponent(id, file, callback) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
      if (callback) callback(); // run callback after content is injected
    });
}
// ===============================
// Init (runs on every page)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  refreshAccountUI();
  updateCartBadge();
  loadCart();
});




