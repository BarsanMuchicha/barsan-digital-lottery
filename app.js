// Add to your bootstrapUIContext function:
function bootstrapUIContext() {
  document.getElementById('prof-name').innerText = appState.user.first_name || 'Lottery Participant';
  document.getElementById('prof-id-line').innerText = ID: ${appState.user.id};
  
  // Show Admin button if the user is actually an admin
  if (appState.isAdmin === true) {
    document.getElementById('admin-panel-trigger').style.display = 'block';
  }

  fetchAvailablePool();
  switchView('home');
}

// Replace your renderNumbersGrid function with this:
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
      // All numbers are now clickable
      node.onclick = () => toggleNumberSelection(i, node);
    }
    container.appendChild(node);
  }
}

// Replace your switchView function with this:
function switchView(viewId) {
  // Security Gate: Prevent viewing admin page if not an admin
  if (viewId === 'admin' && !appState.isAdmin) {
    alert("Unauthorized access.");
    return;
  }
  
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById(view-${viewId});
  if(targetView) targetView.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    if(btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    }
  });
  
  if(viewId === 'tickets') loadMyTickets();
  if(viewId === 'winners') loadWinnersBoard();
  if(viewId === 'admin' && appState.isAdmin) {
     fetch(${API_BASE}/admin/dashboard-stats, { headers: { 'Authorization': tg?.initData || '' } })
     .then(r => r.json()).then(d => {
        document.getElementById('adm-users-count').innerText = d.totalUsers;
        document.getElementById('adm-tickets-count').innerText = d.activeTickets;
     });
  }
}
