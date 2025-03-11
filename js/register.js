import { auth } from "./auth.js";
import { db, doc, setDoc, serverTimestamp } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
 
document.getElementById("register-form").addEventListener("submit", async (event) => {
    event.preventDefault();
 
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const name = document.getElementById("name").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
 
    if (!email || !password || !name || !phoneNumber) {
        alert("⚠️ Please fill all fields!");
        return;
    }
 
    try {
        // ✅ Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("✅ User registered:", user.email);
 
        // ✅ Generate Customer ID (Random 6-digit number)
        const customerId = Math.floor(100000 + Math.random() * 900000);
 
        // ✅ Store User Data in Firestore using email as document ID
        const userRef = doc(db, "users", email); // Use email as document ID
        await setDoc(userRef, {
            userId: user.uid,
            email: email,
            name: name,
            phoneNumber: phoneNumber,
            credits: 0, // Initial credits set to 0
            customerId: customerId, // Randomly generated customer ID
            timestamp: serverTimestamp()
        });
 
        alert("🎉 Registration successful! You can now log in.");
        window.location.href = "login.html"; // Redirect to login page
 
    } catch (error) {
        console.error("❌ Registration error:", error);
        alert(error.message);
    }
});
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Get the registration form
    const registerForm = document.getElementById('register-form');
    
    // Form validation function
    function validateForm() {
        let isValid = true;
        
        // Validate name
        const name = document.getElementById('name');
        const nameError = document.getElementById('name-error');
        if (!name.value.trim()) {
            nameError.style.display = 'block';
            isValid = false;
        } else {
            nameError.style.display = 'none';
        }
        
        // Validate email
        const email = document.getElementById('email');
        const emailError = document.getElementById('email-error');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            emailError.style.display = 'block';
            isValid = false;
        } else {
            emailError.style.display = 'none';
        }
        
        // Validate password
        const password = document.getElementById('password');
        const passwordError = document.getElementById('password-error');
        if (password.value.length < 8) {
            passwordError.style.display = 'block';
            isValid = false;
        } else {
            passwordError.style.display = 'none';
        }
        
        // Validate phone number
        const phone = document.getElementById('phoneNumber');
        const phoneError = document.getElementById('phone-error');
        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone.value)) {
            phoneError.style.display = 'block';
            isValid = false;
        } else {
            phoneError.style.display = 'none';
        }
        
        return isValid;
    }
    
    // Form submission handler
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (validateForm()) {
                // Collect form data
                const formData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    phoneNumber: document.getElementById('phoneNumber').value
                };
                
                // Here you would typically send the data to your server
                // For demonstration, we'll log it and show a success message
                console.log('Form data:', formData);
                
                // Show success message (you could redirect instead)
                registerForm.innerHTML = `
                    <div style="text-align: center;">
                        <h2>Registration Successful!</h2>
                        <p>Welcome to Juicy Chemistry, ${formData.name}!</p>
                        <p>You will receive a confirmation email at ${formData.email} shortly.</p>
                        <p>Redirecting to homepage...</p>
                    </div>
                `;
                
                // Redirect to homepage after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        });
    }
    
    // Add input event listeners for real-time validation feedback
    const inputs = registerForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateForm();
        });
    });
});