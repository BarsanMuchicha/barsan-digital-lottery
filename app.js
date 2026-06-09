/**
 * Barsan Digital Lottery - Frontend Controller
 */

// Configuration
const API_BASE = '/.netlify/functions/api';
const tg = window.Telegram.WebApp;

// Initialize Supabase (Use your public keys from Supabase Dashboard)
// Ensure these are set in your environment variables or replace with actual keys
const supabase = supabase.createClient(
    process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
);

// App State
let appState = {
    user: null,
    isAdmin: false,
    activeRound: 12, // Fixed to round #12 per your request
    selectedNumbers: [],
    ticketPrice: 200,
    isProcessing: false,
    myTickets: []
};

// Unique Reference Generator
function generateReference(ticketNumber) {
  return TXT-${ticketNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()};
}

// Initialize App
async function initApp() {
    tg.ready();
    tg.expand();

    // 1. Authenticate
    try {
        const response = await fetch(${API_BASE}/auth/telegram, {
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
    }
}

// UI Setup
function bootstrapUIContext() {
    document.getElementById('prof-name').innerText = appState.user.first_name || 'Participant';
    document.getElementById('prof-id-line').innerText = ID: ${appState.user.id};
    
    // Initial Data Load
    renderNumbersGrid();
    setupRealtimeSubscription();
    switchView('home');
}

// Grid Logic
async function renderNumbersGrid() {
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('ticket_number, status')
        .eq('round_id', appState.activeRound);

    const container = document.getElementById('numbers-grid');
    container.innerHTML = '';
    
    for (let i = 1; i <= 100; i++) {
        const ticket = tickets?.find(t => t.ticket_number === i);
        const status = ticket ? ticket.status : 'available'; // 'available', 'pending', 'paid'
        
        const node = document.createElement('div');
        node.className = num-node ${status};
        node.innerText = i;
        
        if (status === 'available') {
            node.onclick = () => toggleNumberSelection(i, node);
        } else {
            node.onclick = () => alert(This ticket is ${status}.);
        }
        container.appendChild(node);
    }
}

// Real-time Update (Automatically updates UI when payment is received)
function setupRealtimeSubscription() {
    supabase
      .channel('tickets_channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, payload => {
        console.log('Change received!', payload);
        renderNumbersGrid(); // Refresh grid
        refreshMyTickets();  // Refresh My Tickets view
      })
      .subscribe();
}

function toggleNumberSelection(num, element) {
    if (appState.selectedNumbers.includes(num)) {
        appState.selectedNumbers = appState.selectedNumbers.filter(n => n !== num);
        element.classList.remove('selected');
    } else {
        if (appState.selectedNumbers.length >= 2) {
            alert("Maximum 2 numbers allowed.");
            return;
        }
        appState.selectedNumbers.push(num);
        element.classList.add('selected');
    }
    document.getElementById('btn-checkout').disabled = appState.selectedNumbers.length === 0;
}

// Checkout Flow
async function checkoutSelectedNumbers() {
    if (appState.isProcessing) return;
    appState.isProcessing = true;
    tg.MainButton.showProgress();

    const selectedTicket = appState.selectedNumbers[0]; // Assuming 1 ticket flow for ref generation
    const refCode = generateReference(selectedTicket);try {
        const response = await fetch(${API_BASE}/orders/create, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: appState.user.id,
                ticketNumber: selectedTicket,
                reference: refCode,
                amount: appState.ticketPrice,
                roundId: appState.activeRound
            })
        });

        const result = await response.json();
        
        if (result.success) {
            document.getElementById('pay-ref-placeholder').innerText = refCode;
            document.getElementById('pay-amount-placeholder').innerText = ${appState.ticketPrice} ETB;
            switchView('payment');
        } else {
            alert("Order failed: " + result.error);
        }
    } catch (e) {
        alert("Network error.");
    } finally {
        appState.isProcessing = false;
        tg.MainButton.hideProgress();
    }
}

// My Tickets View
async function refreshMyTickets() {
    const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', appState.user.id)
        .eq('round_id', appState.activeRound);

    const container = document.getElementById('tickets-list');
    container.innerHTML = data.length ? '' : '<p>No tickets yet.</p>';
    
    data?.forEach(t => {
        container.innerHTML += 
            <div class="ticket-card">
                <p>Ticket #: ${t.ticket_number}</p>
                <p>Status: <b>${t.status.toUpperCase()}</b></p>
                <p>Ref: ${t.reference || 'N/A'}</p>
            </div>
        ;
    });
}

// View Switching
function switchView(viewId) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.getElementById(view-${viewId}).classList.add('active');
    
    if (viewId === 'tickets') refreshMyTickets();

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });
}

function copyText(text) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
}

initApp();
