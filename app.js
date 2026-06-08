/**
 * Barsan Digital Lottery - Frontend Controller
 */

// Configuration
const API_BASE = '/.netlify/functions/api';
const tg = window.Telegram.WebApp;

// App State
let appState = {
    user: null,
    isAdmin: false,
    activeRound: null,
    selectedNumbers: [],
    ticketPrice: 200,
    isProcessing: false
};

// Initialize App
async function initApp() {
    tg.ready();
    tg.expand();

    // 1. Authenticate with Backend
    try {
        const response = await fetch(`${API_BASE}/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': tg.initData },
            body: JSON.stringify({ initData: tg.initData })
        });
        const data = await response.json();
        
        appState.user = data.user;
        appState.isAdmin = data.isAdmin;
        
        bootstrapUIContext();
    } catch (e) {
        console.error("Auth failed", e);
        document.body.innerHTML = "<h1>Connection Error</h1><p>Please restart the app.</p>";
    }
}

// UI Setup
function bootstrapUIContext() {
    document.getElementById('prof-name').innerText = appState.user.first_name || 'Participant';
    document.getElementById('prof-id-line').innerText = `ID: ${appState.user.id}`;
    
    if (appState.isAdmin) {
        document.getElementById('admin-panel-trigger').style.display = 'block';
    }

    fetchActiveRound();
    switchView('home');
}

// Fetch Active Round
async function fetchActiveRound() {
    try {
        const res = await fetch(`${API_BASE}/round/active`);
        const { data } = await res.json();
        if (data) {
            appState.activeRound = data;
            document.getElementById('round-state-tag').innerText = "Live: Round " + data.id;
            renderNumbersGrid();
        }
    } catch (e) { console.error(e); }
}

// Number Selection Logic
function toggleNumberSelection(num, element) {
    if (appState.selectedNumbers.includes(num)) {
        appState.selectedNumbers = appState.selectedNumbers.filter(n => n !== num);
        element.classList.remove('selected');
    } else {
        if (appState.selectedNumbers.length >= 2) {
            tg.HapticFeedback.notificationOccurred('error');
            alert("Maximum 2 numbers allowed.");
            return;
        }
        appState.selectedNumbers.push(num);
        element.classList.add('selected');
        tg.HapticFeedback.impactOccurred('light');
    }

    // Toggle checkout button
    document.getElementById('btn-checkout').disabled = appState.selectedNumbers.length === 0;
}

// Render Numbers Grid
function renderNumbersGrid() {
    const container = document.getElementById('numbers-grid');
    container.innerHTML = '';
    
    for (let i = 1; i <= 100; i++) {
        const node = document.createElement('div');
        node.className = 'num-node';
        node.innerText = i;
        node.onclick = () => toggleNumberSelection(i, node);
        container.appendChild(node);
    }
}

// Checkout Logic
async function checkoutSelectedNumbers() {
    if (appState.isProcessing) return;
    
    appState.isProcessing = true;
    tg.MainButton.showProgress();

    try {
        const response = await fetch(`${API_BASE}/orders/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': tg.initData },
            body: JSON.stringify({
                userId: appState.user.id,
                roundId: appState.activeRound.id,
                numbers: appState.selectedNumbers,
                amount: appState.selectedNumbers.length * appState.ticketPrice
            })
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('pay-ref-placeholder').innerText = result.orderId;
            document.getElementById('pay-amount-placeholder').innerText = `${appState.selectedNumbers.length * appState.ticketPrice} ETB`;
            switchView('payment');
        } else {
            alert("Order failed: " + result.error);
        }
    } catch (e) {
        alert("Network error. Please try again.");
    } finally {
        appState.isProcessing = false;
        tg.MainButton.hideProgress();
    }
}

// UI Controller
function switchView(viewId) {
    if (viewId === 'admin' && !appState.isAdmin) return;

    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });
}

function copyText(text) {
    navigator.clipboard.writeText(text);
    tg.HapticFeedback.notificationOccurred('success');
}

// Start
initApp();
