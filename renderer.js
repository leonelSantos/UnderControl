// renderer.js - Frontend logic
// Remove the require statement since it's not available in renderer process
// const { v4: uuidv4 } = require('uuid'); // This line causes the error

// Create a simple UUID generator instead
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// State management
let transactions = [];
let savingsGoals = [];
let currentView = 'dashboard';
let charts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, electronAPI available:', !!window.electronAPI);
  
  try {
    await loadData();
    setupEventListeners();
    showView('dashboard');
    updateDashboard();
    console.log('App initialization complete');
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// Data loading
async function loadData() {
  try {
    if (window.electronAPI) {
      transactions = await window.electronAPI.getTransactions();
      savingsGoals = await window.electronAPI.getSavingsGoals();
      console.log('Loaded transactions:', transactions.length);
      console.log('Loaded savings goals:', savingsGoals.length);
    } else {
      console.error('electronAPI not available');
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

// Event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  console.log('Found nav buttons:', navBtns.length);
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('Nav button clicked:', e.target.dataset.view);
      const view = e.target.dataset.view;
      showView(view);
    });
  });

  // Transaction form
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  console.log('Add transaction button found:', !!addTransactionBtn);
  
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', () => {
      console.log('Add transaction button clicked');
      openTransactionModal();
    });
  }

  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Transaction form submitted');
      await saveTransaction();
    });
  }

  // Bank connection
  const connectBankBtn = document.getElementById('connect-bank-btn');
  if (connectBankBtn) {
    connectBankBtn.addEventListener('click', async () => {
      console.log('Connect bank button clicked');
      if (window.electronAPI && window.electronAPI.connectBank) {
        const result = await window.electronAPI.connectBank();
        alert(result.message + '\n\n' + result.instructions);
      }
    });
  }

  // Analytics controls
  const chartType = document.getElementById('chart-type');
  const timePeriod = document.getElementById('time-period');
  
  if (chartType) {
    chartType.addEventListener('change', updateAnalytics);
  }
  if (timePeriod) {
    timePeriod.addEventListener('change', updateAnalytics);
  }

  // Search
  const searchInput = document.getElementById('search-transactions');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterTransactions(e.target.value);
    });
  }
}

// View management
function showView(viewName) {
  console.log('Showing view:', viewName);
  
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const targetView = document.getElementById(`${viewName}-view`);
  const targetBtn = document.querySelector(`[data-view="${viewName}"]`);
  
  if (targetView) {
    targetView.classList.add('active');
  }
  if (targetBtn) {
    targetBtn.classList.add('active');
  }
  
  currentView = viewName;

  // Update view content
  switch(viewName) {
    case 'dashboard':
      updateDashboard();
      break;
    case 'transactions':
      renderTransactions();
      break;
    case 'savings':
      renderSavingsGoals();
      break;
    case 'analytics':
      updateAnalytics();
      break;
  }
}

// Dashboard
function updateDashboard() {
  console.log('Updating dashboard...');
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0;

  // Update DOM elements
  const totalBalanceEl = document.getElementById('total-balance');
  const monthlyIncomeEl = document.getElementById('monthly-income');
  const monthlyExpensesEl = document.getElementById('monthly-expenses');
  const savingsRateEl = document.getElementById('savings-rate');
  
  if (totalBalanceEl) totalBalanceEl.textContent = `$${balance.toFixed(2)}`;
  if (monthlyIncomeEl) monthlyIncomeEl.textContent = `$${income.toFixed(2)}`;
  if (monthlyExpensesEl) monthlyExpensesEl.textContent = `$${expenses.toFixed(2)}`;
  if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;

  // Update overview chart only if Chart.js is available
  if (typeof Chart !== 'undefined') {
    const canvas = document.getElementById('overview-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (charts.overview) charts.overview.destroy();
      
      charts.overview = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Income', 'Expenses', 'Savings'],
          datasets: [{
            data: [income, expenses, Math.max(0, income - expenses)],
            backgroundColor: ['#4CAF50', '#f44336', '#2196F3']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  } else {
    console.warn('Chart.js not available');
  }
}

// Transactions
function renderTransactions() {
  console.log('Rendering transactions...');
  
  const tbody = document.getElementById('transactions-list');
  if (!tbody) {
    console.error('Transactions list element not found');
    return;
  }
  
  tbody.innerHTML = '';

  transactions.forEach(transaction => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString()}</td>
      <td>${transaction.description}</td>
      <td>${transaction.category}</td>
      <td class="${transaction.type}">$${Math.abs(transaction.amount).toFixed(2)}</td>
      <td>${transaction.type}</td>
      <td>
        <button onclick="editTransaction('${transaction.id}')" class="edit-btn">Edit</button>
        <button onclick="deleteTransaction('${transaction.id}')" class="delete-btn">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSavingsGoals() {
  console.log('Rendering savings goals...');
  // Add implementation for savings goals rendering
  const goalsGrid = document.getElementById('goals-grid');
  if (goalsGrid) {
    goalsGrid.innerHTML = '<p>Savings goals will be displayed here.</p>';
  }
}

async function saveTransaction() {
  console.log('Saving transaction...');
  
  const id = document.getElementById('transaction-id').value || uuidv4();
  const transaction = {
    id,
    date: document.getElementById('transaction-date').value,
    description: document.getElementById('transaction-description').value,
    amount: parseFloat(document.getElementById('transaction-amount').value),
    category: document.getElementById('transaction-category').value,
    type: document.querySelector('input[name="type"]:checked').value
  };

  try {
    if (window.electronAPI) {
      if (document.getElementById('transaction-id').value) {
        await window.electronAPI.updateTransaction(transaction);
      } else {
        await window.electronAPI.addTransaction(transaction);
      }
      await loadData();
      closeModal();
      renderTransactions();
      updateDashboard();
    } else {
      console.error('electronAPI not available');
    }
  } catch (error) {
    console.error('Failed to save transaction:', error);
    alert('Failed to save transaction: ' + error.message);
  }
}

async function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      if (window.electronAPI) {
        await window.electronAPI.deleteTransaction(id);
        await loadData();
        renderTransactions();
        updateDashboard();
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction: ' + error.message);
    }
  }
}

function editTransaction(id) {
  console.log('Editing transaction:', id);
  // Find the transaction and populate the form
  const transaction = transactions.find(t => t.id === id);
  if (transaction) {
    document.getElementById('transaction-id').value = transaction.id;
    document.getElementById('transaction-date').value = transaction.date;
    document.getElementById('transaction-description').value = transaction.description;
    document.getElementById('transaction-amount').value = transaction.amount;
    document.getElementById('transaction-category').value = transaction.category;
    document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
    openTransactionModal();
  }
}

// Analytics
function updateAnalytics() {
  console.log('Updating analytics...');
  
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not available for analytics');
    return;
  }
  
  const chartType = document.getElementById('chart-type')?.value || 'spending-category';
  const timePeriod = document.getElementById('time-period')?.value || 'month';
  
  const filteredTransactions = filterTransactionsByPeriod(transactions, timePeriod);
  
  const canvas = document.getElementById('analytics-chart');
  if (!canvas) {
    console.error('Analytics chart canvas not found');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  if (charts.analytics) {
    charts.analytics.destroy();
  }

  switch(chartType) {
    case 'spending-category':
      renderCategoryChart(ctx, filteredTransactions);
      break;
    case 'income-expense':
      renderIncomeExpenseChart(ctx, filteredTransactions);
      break;
    case 'monthly-trend':
      renderMonthlyTrendChart(ctx, filteredTransactions);
      break;
  }
}

function renderCategoryChart(ctx, transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const categories = {};
  
  expenses.forEach(t => {
    if (!categories[t.category]) categories[t.category] = 0;
    categories[t.category] += t.amount;
  });

  charts.analytics = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Spending by Category'
        }
      }
    }
  });
}

function renderIncomeExpenseChart(ctx, transactions) {
  // Placeholder implementation
  console.log('Income vs Expense chart not yet implemented');
}

function renderMonthlyTrendChart(ctx, transactions) {
  // Placeholder implementation
  console.log('Monthly trend chart not yet implemented');
}

// Modal functions
function openTransactionModal() {
  console.log('Opening transaction modal...');
  const modal = document.getElementById('transaction-modal');
  if (modal) {
    modal.style.display = 'block';
    const form = document.getElementById('transaction-form');
    if (form) {
      form.reset();
    }
    document.getElementById('transaction-id').value = '';
    const dateInput = document.getElementById('transaction-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }
}

function closeModal() {
  console.log('Closing modal...');
  const modal = document.getElementById('transaction-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Helper functions
function filterTransactions(searchTerm) {
  console.log('Filtering transactions with term:', searchTerm);
  // Implementation for filtering transactions
  renderTransactions(); // For now, just re-render all
}

function filterTransactionsByPeriod(transactions, period) {
  const now = new Date();
  let startDate;

  switch(period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return transactions;
  }

  return transactions.filter(t => new Date(t.date) >= startDate);
}

// Make functions global so they can be called from HTML onclick attributes
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.closeModal = closeModal;