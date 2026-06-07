// Initialize Telegram Web App
const tg = window.Telegram.WebApp;

// Automatically expand the Telegram Mini App to full screen height
tg.expand();

// Wait for the phone screen to load everything completely
document.addEventListener("DOMContentLoaded", () => {
    const appDiv = document.getElementById("app");
    
    // Grab the user data directly from Telegram safely
    const user = tg.initDataUnsafe?.user;

    if (user) {
        appDiv.innerHTML = `
            <h1>Barsan Digital Lottery</h1>
            <p>Welcome, <b>${user.first_name}</b>!</p>
            <p>Your Telegram ID: <code>${user.id}</code></p>
            <p style="color: green; font-weight: bold;">Status: Telegram Connection Successful!</p>
        `;
    } else {
        // Fallback text if opened outside of Telegram (like a normal browser)
        appDiv.innerHTML = `
            <h1>Barsan Digital Lottery</h1>
            <p>Welcome, Demo User!</p>
            <p style="color: orange;">Note: Please open this application inside Telegram later to load your actual profile.</p>
        `;
    }
});
