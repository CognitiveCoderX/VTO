// Cart Management System

// Cart data structure
let cart = {
  items: [],
  subtotal: 0,
  shipping: 0,
  tax: 0,
  total: 0
};

// DOM elements
const cartItemsList = document.getElementById('cart-items-list');
const emptyCartMessage = document.getElementById('empty-cart');
const cartSummary = document.getElementById('cart-summary');
const subtotalElement = document.getElementById('subtotal-amount');
const shippingElement = document.getElementById('shipping-amount');
const taxElement = document.getElementById('tax-amount');
const totalElement = document.getElementById('total-amount');
const checkoutButton = document.getElementById('checkout-btn');
const cartCountBadge = document.getElementById('cart-count');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromLocalStorage();
  renderCart();
  updateCartBadge();

  // Add event listeners
  checkoutButton.addEventListener('click', proceedToCheckout);
  
  // Listen for any item manipulation in the cart
  cartItemsList.addEventListener('click', handleCartItemsClick);
});

// Load cart from localStorage if available
function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('customxshop-cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
      cart = { items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 };
    }
  }
}

// Save cart to localStorage
function saveCartToLocalStorage() {
  localStorage.setItem('customxshop-cart', JSON.stringify(cart));
}

// Update cart indicator
function updateCartBadge() {
  if (cartCountBadge) {
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cartCountBadge.textContent = totalItems > 0 ? totalItems : '';
  }
}

// Render the cart items and summary
function renderCart() {
  if (!cartItemsList) return; // Skip if not on cart page
  
  if (cart.items.length === 0) {
    // Show empty cart message, hide cart items and summary
    emptyCartMessage.style.display = 'flex';
    cartItemsList.style.display = 'none';
    cartSummary.style.display = 'none';
    return;
  }

  // Hide empty cart message, show cart items and summary
  emptyCartMessage.style.display = 'none';
  cartItemsList.style.display = 'flex';
  cartSummary.style.display = 'block';

  // Clear existing cart items
  cartItemsList.innerHTML = '';

  // Add each item to the cart
  cart.items.forEach((item, index) => {
    const cartItemElement = createCartItemElement(item, index);
    cartItemsList.appendChild(cartItemElement);
  });

  // Update summary
  updateCartSummary();
}

// Create a cart item element
function createCartItemElement(item, index) {
  const cartItem = document.createElement('div');
  cartItem.className = 'cart-item';
  cartItem.dataset.index = index;

  // Use a default image if the item image is not available
  const imageUrl = item.image && item.image.includes('/') ? item.image : '/images/product-placeholder.jpg';

  cartItem.innerHTML = `
    <div class="item-image">
      <img src="${imageUrl}" alt="${item.name}" onerror="this.src='/images/product-placeholder.jpg'">
    </div>
    <div class="item-details">
      <h3 class="item-name">${item.name}</h3>
      <p class="item-variant">Color: ${item.color}, Size: ${item.size}</p>
      ${item.designName ? `<p class="item-design">Custom Design: ${item.designName}</p>` : ''}
    </div>
    <div class="item-price">$${item.price.toFixed(2)}</div>
    <div class="item-quantity">
      <button class="quantity-btn minus" data-action="decrease">-</button>
      <input type="number" value="${item.quantity}" min="1" max="10" data-action="update-quantity">
      <button class="quantity-btn plus" data-action="increase">+</button>
    </div>
    <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
    <button class="remove-item" data-action="remove"><span class="material-icons">delete</span></button>
  `;

  return cartItem;
}

// Handle clicks within cart items (quantity adjustment, removal)
function handleCartItemsClick(event) {
  const target = event.target;
  const action = target.dataset.action || target.parentElement.dataset.action;
  if (!action) return;

  const cartItem = target.closest('.cart-item');
  if (!cartItem) return;
  
  const index = parseInt(cartItem.dataset.index);
  if (isNaN(index)) return;

  switch (action) {
    case 'increase':
      increaseQuantity(index);
      break;
    case 'decrease':
      decreaseQuantity(index);
      break;
    case 'update-quantity':
      if (target.tagName.toLowerCase() === 'input') {
        // This will be handled by the input's change event
        target.addEventListener('change', () => {
          const newQuantity = parseInt(target.value);
          if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity <= 10) {
            updateQuantity(index, newQuantity);
          } else {
            // Reset to previous valid quantity
            target.value = cart.items[index].quantity;
          }
        });
      }
      break;
    case 'remove':
      removeItem(index);
      break;
  }
}

// Increase item quantity
function increaseQuantity(index) {
  if (index >= 0 && index < cart.items.length && cart.items[index].quantity < 10) {
    cart.items[index].quantity += 1;
    updateCart();
  }
}

// Decrease item quantity
function decreaseQuantity(index) {
  if (index >= 0 && index < cart.items.length && cart.items[index].quantity > 1) {
    cart.items[index].quantity -= 1;
    updateCart();
  }
}

// Update item quantity directly
function updateQuantity(index, quantity) {
  if (index >= 0 && index < cart.items.length && quantity > 0 && quantity <= 10) {
    cart.items[index].quantity = quantity;
    updateCart();
  }
}

// Remove item from cart
function removeItem(index) {
  if (index >= 0 && index < cart.items.length) {
    cart.items.splice(index, 1);
    updateCart();
  }
}

// Update cart calculations and display
function updateCart() {
  calculateCartTotals();
  saveCartToLocalStorage();
  renderCart();
  updateCartBadge();
}

// Calculate cart totals
function calculateCartTotals() {
  // Calculate subtotal
  cart.subtotal = cart.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Calculate shipping (example: $5 flat rate, free for orders over $50)
  cart.shipping = cart.subtotal > 50 ? 0 : 5;

  // Calculate tax (example: 8% tax rate)
  const taxRate = 0.08;
  cart.tax = cart.subtotal * taxRate;

  // Calculate total
  cart.total = cart.subtotal + cart.shipping + cart.tax;
}

// Update the cart summary display
function updateCartSummary() {
  subtotalElement.textContent = `$${cart.subtotal.toFixed(2)}`;
  shippingElement.textContent = cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`;
  taxElement.textContent = `$${cart.tax.toFixed(2)}`;
  totalElement.textContent = `$${cart.total.toFixed(2)}`;
}

// Function to add item to cart (called from product page)
function addToCart(product) {
  // Check if the item is already in the cart
  const existingItemIndex = cart.items.findIndex(item => 
    item.id === product.id && 
    item.size === product.size && 
    item.color === product.color &&
    item.designId === product.designId
  );

  if (existingItemIndex !== -1) {
    // Update quantity of existing item, capped at 10
    const newQuantity = Math.min(cart.items[existingItemIndex].quantity + product.quantity, 10);
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item to cart
    cart.items.push(product);
  }

  // Update cart
  updateCart();
  
  // Show confirmation
  showAddToCartConfirmation(product.name);
}

// Show a confirmation message when item is added to cart
function showAddToCartConfirmation(productName) {
  // Create and show a toast notification
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <span class="material-icons success-icon">check_circle</span>
    <p><strong>${productName}</strong> added to cart</p>
    <a href="Cart.html" class="view-cart-btn">View Cart</a>
  `;
  
  document.body.appendChild(toast);

  // Remove the toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Proceed to checkout
function proceedToCheckout() {
  // Save current cart before navigating
  saveCartToLocalStorage();
  
  // Redirect to checkout page (to be implemented)
  window.location.href = '/HTML/checkout.html';
}

// Make addToCart function available globally
window.addToCart = addToCart; 