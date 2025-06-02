// renderer.js - Frontend logic
const { v4: uuidv4 } = require('uuid');

// State management
let transactions = [];
let savingsGoals = [];
let currentView = 'dashboard';
let charts = {};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  showView('dashboard');
  updateDashboard();
});

// Data loading
async function loadData() {
  try {
    transactions = await window.electronAPI.getTransactions();
    savingsGoals = await window.electronAPI.getSavingsGoals();
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

// Event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      showView(view);
    });
  });

  // Transaction form
  document.getElementById('add-transaction-btn').addEventListener('click', () => {
    openTransactionModal();
  });

  document.getElementById('transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveTransaction();
  });

  // Bank connection
  document.getElementById('connect-bank-btn').addEventListener('click', async () => {
    const result = await window.electronAPI.connectBank();
    alert(result.message + '\n\n' + result.instructions);
  });

  // Analytics controls
  document.getElementById('chart-type').addEventListener('change', updateAnalytics);
  document.getElementById('time-period').addEventListener('change', updateAnalytics);

  // Search
  document.getElementById('search-transactions').addEventListener('input', (e) => {
    filterTransactions(e.target.value);
  });
}

// View management
function showView(viewName) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(`${viewName}-view`).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
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

  document.getElementById('total-balance').textContent = `$${balance.toFixed(2)}`;
  document.getElementById('monthly-income').textContent = `$${income.toFixed(2)}`;
  document.getElementById('monthly-expenses').textContent = `$${expenses.toFixed(2)}`;
  document.getElementById('savings-rate').textContent = `${savingsRate}%`;

  // Update overview chart
  const ctx = document.getElementById('overview-chart').getContext('2d');
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

// Transactions
function renderTransactions() {
  const tbody = document.getElementById('transactions-list');
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

async function saveTransaction() {
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
    if (document.getElementById('transaction-id').value) {
      await window.electronAPI.updateTransaction(transaction);
    } else {
      await window.electronAPI.addTransaction(transaction);
    }
    await loadData();
    closeModal();
    renderTransactions();
    updateDashboard();
  } catch (error) {
    alert('Failed to save transaction: ' + error.message);
  }
}

async function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await window.electronAPI.deleteTransaction(id);
      await loadData();
      renderTransactions();
      updateDashboard();
    } catch (error) {
      alert('Failed to delete transaction: ' + error.message);
    }
  }
}

// Analytics
function updateAnalytics() {
  const chartType = document.getElementById('chart-type').value;
  const timePeriod = document.getElementById('time-period').value;
  
  const filteredTransactions = filterTransactionsByPeriod(transactions, timePeriod);
  
  const ctx = document.getElementById('analytics-chart').getContext('2d');
  if (charts.analytics) charts.analytics.destroy();

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

// Modal functions
function openTransactionModal() {
  document.getElementById('transaction-modal').style.display = 'block';
  document.getElementById('transaction-form').reset();
  document.getElementById('transaction-id').value = '';
  document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
}

function closeModal() {
  document.getElementById('transaction-modal').style.display = 'none';
}

// Helper functions
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