import { db, collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "./firebase-config.js";
import { auth } from "./auth.js";
document.getElementById("checkout").addEventListener("click", () => {
    window.location.href = "checkout.html";
});
// DOM Elements
const cartItemsContainer = document.querySelector("#cart-items-container") || document.createElement("div");
const emptyCartMessage = document.querySelector("#empty-cart-message") || document.createElement("p");
const subtotalElement = document.querySelector("#subtotal") || document.querySelector(".subtotal");
const checkoutButton = document.querySelector("#checkout-button") || document.querySelector(".checkout-button");

// Global variables
let cartItems = [];
let productDetails = {};
let subtotal = 0;

// Initialize cart page
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🛒 Initializing cart page...");
    
    // Check if user is logged in
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await fetchCartItems(user.uid);
        } else {
            console.log("⚠️ User not logged in. Redirecting to login page...");
            displayEmptyCart("Please log in to view your cart");
            // Optional: Redirect to login page
            // window.location.href = "login.html";
        }
    });
});

// Fetch cart items from Firestore
async function fetchCartItems(userId) {
    try {
        console.log(`🔄 Fetching cart items for user: ${userId}`);
        
        // Create a query against the cart collection
        const cartQuery = query(
            collection(db, "cart"),
            where("userId", "==", userId)
        );
        
        // Execute the query
        const querySnapshot = await getDocs(cartQuery);
        
        // If cart is empty
        if (querySnapshot.empty) {
            displayEmptyCart();
            return;
        }
        
        // Process cart items
        cartItems = [];
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            cartItems.push({
                id: doc.id,
                productId: item.productId,
                quantity: item.quantity,
                timestamp: item.timestamp
            });
        });
        
        // Fetch product details for each cart item
        await fetchProductDetails();
        
        // Render cart items
        renderCartItems();
        
    } catch (error) {
        console.error("❌ Error fetching cart items:", error);
        displayEmptyCart("Error loading cart items. Please try again later.");
    }
}

// Fetch product details for all cart items
async function fetchProductDetails() {
    try {
        console.log("🔄 Fetching product details for cart items...");
        
        const productPromises = cartItems.map(async (item) => {
            const productDoc = await getDoc(doc(db, "products", item.productId));
            
            if (productDoc.exists()) {
                productDetails[item.productId] = productDoc.data();
                return true;
            } else {
                console.warn(`⚠️ Product not found: ${item.productId}`);
                return false;
            }
        });
        
        await Promise.all(productPromises);
        
    } catch (error) {
        console.error("❌ Error fetching product details:", error);
    }
}

// Render cart items in the DOM
function renderCartItems() {
    // Create container if it doesn't exist
    if (!cartItemsContainer.parentNode) {
        document.querySelector("main").appendChild(cartItemsContainer);
        cartItemsContainer.id = "cart-items-container";
    }
    
    // Clear previous content
    cartItemsContainer.innerHTML = "";
    emptyCartMessage.style.display = "none";
    
    // Reset subtotal
    subtotal = 0;
    
    // Create cart items HTML
    cartItems.forEach((item) => {
        const product = productDetails[item.productId];
        
        // Skip if product details are not available
        if (!product) return;
        
        // Calculate item total
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        
        // Create cart item element
        const cartItemElement = document.createElement("div");
        cartItemElement.className = "cart-item";
        cartItemElement.setAttribute("data-cart-id", item.id);
        cartItemElement.setAttribute("data-product-id", item.productId);
        
        cartItemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${validateImageUrl(product.img_url) ? product.img_url : "images/default.jpg"}" 
                     alt="${product.name}" 
                     onerror="this.onerror=null; this.src='images/default.jpg';">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">${product.name}</h3>
                <p class="cart-item-price">₹${product.price}</p>
                
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-cart-id="${item.id}">-</button>
                    <span class="quantity" id="cart-quantity-${item.id}">${item.quantity}</span>
                    <button class="quantity-btn plus" data-cart-id="${item.id}">+</button>
                </div>
            </div>
            <div class="cart-item-total">
                <p>₹${itemTotal.toFixed(2)}</p>
                <button class="remove-item" data-cart-id="${item.id}">Remove</button>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItemElement);
    });
    
    // Update subtotal display
    updateSubtotal();
    
    // Attach event listeners
    attachCartEvents();
}

// Display empty cart message
function displayEmptyCart(message = "Your cart is empty.") {
    emptyCartMessage.textContent = message;
    emptyCartMessage.style.display = "block";
    
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = "";
    }
    
    updateSubtotal(0);
    
    // Disable checkout button
    if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.classList.add("disabled");
    }
}

// Update subtotal display
function updateSubtotal(value = subtotal) {
    subtotal = value;
    
    if (subtotalElement) {
        subtotalElement.textContent = `Subtotal: ₹${subtotal.toFixed(2)}`;
    }
    
    // Enable/disable checkout button
    if (checkoutButton) {
        if (subtotal > 0) {
            checkoutButton.disabled = false;
            checkoutButton.classList.remove("disabled");
        } else {
            checkoutButton.disabled = true;
            checkoutButton.classList.add("disabled");
        }
    }
}

// Attach event listeners to cart items
function attachCartEvents() {
    // Plus button event
    document.querySelectorAll(".cart-item .quantity-btn.plus").forEach(button => {
        button.addEventListener("click", async (event) => {
            const cartId = event.target.getAttribute("data-cart-id");
            await updateCartItemQuantity(cartId, 1);
        });
    });
    
    // Minus button event
    document.querySelectorAll(".cart-item .quantity-btn.minus").forEach(button => {
        button.addEventListener("click", async (event) => {
            const cartId = event.target.getAttribute("data-cart-id");
            await updateCartItemQuantity(cartId, -1);
        });
    });
    
    // Remove button event
    document.querySelectorAll(".cart-item .remove-item").forEach(button => {
        button.addEventListener("click", async (event) => {
            const cartId = event.target.getAttribute("data-cart-id");
            await removeCartItem(cartId);
        });
    });
    
    // Checkout button event
    if (checkoutButton) {
        checkoutButton.addEventListener("click", () => {
            if (subtotal > 0) {
                window.location.href = "checkout.html";
            }
        });
    }
}

// Update cart item quantity
async function updateCartItemQuantity(cartId, change) {
    try {
        // Find cart item
        const cartItem = cartItems.find(item => item.id === cartId);
        if (!cartItem) return;
        
        // Calculate new quantity
        const newQuantity = cartItem.quantity + change;
        
        // Validate new quantity
        if (newQuantity < 1) {
            // If quantity becomes 0, remove the item
            await removeCartItem(cartId);
            return;
        }
        
        // Update quantity in Firestore
        await updateDoc(doc(db, "cart", cartId), {
            quantity: newQuantity
        });
        
        // Update local data
        cartItem.quantity = newQuantity;
        
        // Update quantity display
        const quantityElement = document.querySelector(`#cart-quantity-${cartId}`);
        if (quantityElement) {
            quantityElement.textContent = newQuantity;
        }
        
        // Recalculate subtotal
        calculateSubtotal();
        
        console.log(`✅ Cart item quantity updated: ${cartId} -> ${newQuantity}`);
        
    } catch (error) {
        console.error("❌ Error updating cart item quantity:", error);
        alert("Error updating item quantity. Please try again.");
    }
}

// Remove cart item
async function removeCartItem(cartId) {
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, "cart", cartId));
        
        // Remove from local data
        cartItems = cartItems.filter(item => item.id !== cartId);
        
        // Remove from DOM
        const cartItemElement = document.querySelector(`.cart-item[data-cart-id="${cartId}"]`);
        if (cartItemElement) {
            cartItemElement.remove();
        }
        
        // Recalculate subtotal
        calculateSubtotal();
        
        // If cart is now empty, show empty message
        if (cartItems.length === 0) {
            displayEmptyCart();
        }
        
        console.log(`✅ Cart item removed: ${cartId}`);
        
    } catch (error) {
        console.error("❌ Error removing cart item:", error);
        alert("Error removing item from cart. Please try again.");
    }
}

// Calculate subtotal
function calculateSubtotal() {
    subtotal = 0;
    
    cartItems.forEach((item) => {
        const product = productDetails[item.productId];
        if (product) {
            subtotal += product.price * item.quantity;
        }
    });
    
    updateSubtotal();
}

// Validate Image URL helper function
function validateImageUrl(url) {
    return url && url.startsWith("http") && !url.includes("google.com/url");
}

// Export functions for reuse
export { fetchCartItems, updateCartItemQuantity, removeCartItem };