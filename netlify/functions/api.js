const tg = window.Telegram?.WebApp;
const API_BASE = '/api';

let appState = {
  user: null,
  isAdmin: false,
  selectedNumbers: [],
  availableNumbers: [],
  currentRoundId: null
};

document.addEventListener('DOMContentLoaded', () => {
  if (tg) {
    tg.expand();
    tg.ready();
    if (tg.setHeaderColor) tg.setHeaderColor('#1a1a1e');
  }
  authenticateSession();
});

async function authenticateSession() {
  const initData = tg?.initData || "";
  const startParam = tg?.initDataUnsafe?.start_param || "";

  try {
    const res = await fetch(`${API_BASE}/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, startParam })
    });
    const data = await res.json();
    
    if (data.user) {
      appState.user = data.user;
      appState.isAdmin = data.isAdmin;
      bootstrapUIContext();
    } else {
      alert('Authentication failure. Relaunch via official Telegram menu.');
    }
  } catch (err) {
    console.error('Session boot failed:', err);
  }
}

function bootstrapUIContext() {
  document.getElementById('prof-name').innerText = appState.user.first_name || 'Lottery Participant';
  document.getElementById('prof-id-line').innerText = `ID: ${appState.user.id}`;
  
  if (appState.isAdmin) {
    document.getElementById('admin-panel-trigger').classList.remove('hide');
  }

  fetchAvailablePool();
  switchView('home');
}

async function fetchAvailablePool() {
  try {
    const res = await fetch(`${API_BASE}/numbers/available`);
    const data = await res.json();
    appState.availableNumbers = data.available || [];
    appState.currentRoundId = data.roundId;

    const stateTag = document.getElementById('round-state-tag');
    if (appState.currentRoundId) {
      stateTag.innerText = `ROUND #${appState.currentRoundId} ACTIVE`;
      stateTag.style.color = 'var(--success)';
    } else {
      stateTag.innerText = `CLOSED`;
      stateTag.style.color = 'var(--danger)';
    }
    renderNumbersGrid();
  } catch (err) {
    console.error('Syncing error:', err);
  }
}

function renderNumbersGrid() {
  const container = document.getElementById('numbers-grid');
  if (!container) return;
  container.innerHTML = '';
  
  const takenSet = new Set();
  for(let i=1; i<=100; i++) {
    if(!appState.availableNumbers.includes(i)) takenSet.add(i);
  }

  for (let i = 1; i <= 100; i++) {
    const node = document.createElement('div');
    node.className = 'num-node';
    node.innerText = i;
    
    if (takenSet.has(i)) {
      node.classList.add('taken');
    } else {
      node.onclick = () => toggleNumberSelection(i, node);
    }
    container.appendChild(node);
  }
}

function toggleNumberSelection(num, element) {
  if (appState.selectedNumbers.includes(num)) {
    appState.selectedNumbers = appState.selectedNumbers.filter(n => n !== num);
    element.classList.remove('selected');
  } else {
    if (appState.selectedNumbers.length >= 2) {
      if (tg?.showAlert) tg.showAlert('Maximum allocation is 2 tickets per round.');
      return;
    }
    appState.selectedNumbers.push(num);
    element.classList.add('selected');
  }
  
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  document.getElementById('btn-checkout').disabled = (appState.selectedNumbers.length === 0);
}

async function checkoutSelectedNumbers() {
  if (appState.selectedNumbers.length === 0) return;
  
  try {
    const res = await fetch(`${API_BASE}/orders/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': tg?.initData || ''
      },
      body: JSON.stringify({ numbers: appState.selectedNumbers })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('pay-amount-placeholder').innerText = `${data.order.amount} ETB`;
      document.getElementById('pay-ref-placeholder').innerText = data.order.id;
      appState.selectedNumbers = [];
      switchView('payment');
    } else {
      alert(data.error || 'Checkout process rejected.');
    }
  } catch (err) {
    console.error('Checkout error:', err);
  }
}

async function loadMyTickets() {
  try {
    const res = await fetch(`${API_BASE}/tickets/my`, {
      headers: { 'Authorization': tg?.initData || '' }
    });
    const data = await res.json();
    const container = document.getElementById('my-tickets-list');
    container.innerHTML = '';

    if(!data.tickets || data.tickets.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No tickets acquired yet.</p>';
      return;
    }

    data.tickets.forEach(tk => {
      const el = document.createElement('div');
      el.style.cssText = 'background:var(--card-bg); padding:14px; border-radius:12px; display:flex; justify-content:space-between; border-left:4px solid var(--primary-color); border-top: 1px solid var(--border-color);';
      el.innerHTML = `<span>Ticket Number: <strong style="color:var(--accent-color)">#${tk.number}</strong></span> <span style="font-size:0.8rem; color:var(--text-muted);">Round ${tk.round_id}</span>`;
      container.appendChild(el);
    });
  } catch (err) {
    console.error(err);
  }
}

// FIXED: Implemented missing history reader to build out the view dynamically
async function loadWinnersBoard() {
  try {
    const res = await fetch(`${API_BASE}/winners`);
    const data = await res.json();
    const container = document.getElementById('winners-board');
    container.innerHTML = '';

    if (!data.winners || data.winners.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Winners ledger will post once round resolves.</p>';
      return;
    }

    data.winners.forEach(w => {
      const name = w.users?.first_name || w.users?.username || `User ${w.user_id.toString().slice(-4)}`;
      const el = document.createElement('div');
      el.style.cssText = 'background:var(--card-bg); padding:14px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color);';
      el.innerHTML = `
        <div>
          <div style="font-weight:bold;">${name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Tier ${w.prize_tier} Winner • Round ${w.round_id}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:var(--accent-color); font-weight:bold;">${w.prize_amount} ETB</div>
          <div style="font-size:0.8rem; font-weight:bold; color:var(--primary-color)">No. #${w.tickets?.number || '-'}</div>
        </div>
      `;
      container.appendChild(el);
    });
  } catch (err) {
    console.error(err);
  }
}

async function adminCreateRound() {
  await fetch(`${API_BASE}/admin/create-round`, {
    method: 'POST', headers: { 'Authorization': tg?.initData || '' }
  });
  fetchAvailablePool();
  alert('New Active Round Opened!');
}

async function adminCloseRound() {
  await fetch(`${API_BASE}/admin/close-round`, {
    method: 'POST', headers: { 'Authorization': tg?.initData || '' }
  });
  fetchAvailablePool();
  alert('Active Round Terminated.');
}

async function adminSelectWinners() {
  const roundId = document.getElementById('draw-round-id').value;
  const firstNum = document.getElementById('draw-1st').value;
  const secondNum = document.getElementById('draw-2nd').value;
  const thirdNum = document.getElementById('draw-3rd').value;

  const res = await fetch(`${API_BASE}/admin/select-winners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': tg?.initData || '' },
    body: JSON.stringify({ roundId, firstNum, secondNum, thirdNum })
  });
  const data = await res.json();
  alert(`Draw complete. Matrix items saved: ${data.winnersCount}`);
}

function switchView(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewId}`);
  if(targetView) targetView.classList.add('active');

  // FIXED: Re-added selection mapping logic to visually switch highlights on menu buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    if(btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    }
  });
  
  if(viewId === 'tickets') loadMyTickets();
  if(viewId === 'winners') loadWinnersBoard();
  if(viewId === 'admin' && appState.isAdmin) {
     fetch(`${API_BASE}/admin/dashboard-stats`, { headers: { 'Authorization': tg?.initData || '' } })
     .then(r => r.json()).then(d => {
        document.getElementById('adm-users-count').innerText = d.totalUsers;
        document.getElementById('adm-tickets-count').innerText = d.activeTickets;
     });
  }
}

function copyText(str) {
  navigator.clipboard.writeText(str);
  if (tg?.showPopup) {
    tg.showPopup({ message: 'Value saved to clipboard!' });
  } else {
    alert('Copied to clipboard!');
  }
      }
