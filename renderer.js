// renderer.js - Frontend logic

// Create a simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// State management
let transactions = [];
let savingsGoals = [];
let accountBalances = [];
let monthlyBudget = [];
let budgetComparison = [];
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
      accountBalances = await window.electronAPI.getAccountBalances();
      monthlyBudget = await window.electronAPI.getMonthlyBudget();
      budgetComparison = await window.electronAPI.getBudgetComparison();
      
      console.log('Loaded data:', {
        transactions: transactions.length,
        savingsGoals: savingsGoals.length,
        accountBalances: accountBalances.length,
        monthlyBudget: monthlyBudget.length
      });
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
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      showView(view);
    });
  });

  // Transaction form
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', () => openTransactionModal());
  }

  const transactionForm = document.getElementById('transaction-form');
  if (transactionForm) {
    transactionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveTransaction();
    });
  }

  // Budget form
  const addBudgetBtn = document.getElementById('add-budget-btn');
  if (addBudgetBtn) {
    addBudgetBtn.addEventListener('click', () => openBudgetModal());
  }

  const budgetForm = document.getElementById('budget-form');
  if (budgetForm) {
    budgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveBudgetItem();
    });
  }

  // Savings goal form
  const addGoalBtn = document.getElementById('add-goal-btn');
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', () => openGoalModal());
  }

  const goalForm = document.getElementById('goal-form');
  if (goalForm) {
    goalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveSavingsGoal();
    });
  }

  // Debt form
  const debtForm = document.getElementById('debt-form');
  if (debtForm) {
    debtForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveDebtAccount();
    });
  }

  // Analytics controls
  const chartType = document.getElementById('chart-type');
  const timePeriod = document.getElementById('time-period');
  
  if (chartType) chartType.addEventListener('change', updateAnalytics);
  if (timePeriod) timePeriod.addEventListener('change', updateAnalytics);

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
  
  if (targetView) targetView.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
  
  currentView = viewName;

  // Update view content
  switch(viewName) {
    case 'dashboard':
      updateDashboard();
      break;
    case 'accounts':
      renderAccountBalances();
      break;
    case 'budget':
      renderBudget();
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
  
  // Update account balances
  const checkingBalance = accountBalances.find(acc => acc.account_type === 'checking')?.balance || 0;
  const savingsBalance = accountBalances.find(acc => acc.account_type === 'savings')?.balance || 0;
  
  // Calculate total debt
  const totalDebt = accountBalances
    .filter(acc => acc.account_type === 'credit_card' || acc.account_type === 'student_loan')
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  // Calculate net worth (assets - debts)
  const netWorth = (checkingBalance + savingsBalance) - totalDebt;
  
  const checkingEl = document.getElementById('checking-balance');
  const savingsEl = document.getElementById('savings-balance');
  const totalDebtEl = document.getElementById('total-debt');
  const netWorthEl = document.getElementById('net-worth');
  
  if (checkingEl) checkingEl.textContent = `${checkingBalance.toFixed(2)}`;
  if (savingsEl) savingsEl.textContent = `${savingsBalance.toFixed(2)}`;
  if (totalDebtEl) totalDebtEl.textContent = `${totalDebt.toFixed(2)}`;
  if (netWorthEl) {
    netWorthEl.textContent = `${netWorth.toFixed(2)}`;
    netWorthEl.className = `amount ${netWorth >= 0 ? 'income' : 'expense'}`;
  }

  // Calculate budget totals
  const budgetIncome = monthlyBudget
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  
  const budgetExpenses = monthlyBudget
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  // Update overview chart
  if (typeof Chart !== 'undefined') {
    const canvas = document.getElementById('overview-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (charts.overview) charts.overview.destroy();
      
      charts.overview = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Assets', 'Debts'],
          datasets: [{
            data: [checkingBalance + savingsBalance, totalDebt],
            backgroundColor: ['#27ae60', '#e74c3c']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Assets vs Debts'
            }
          }
        }
      });
    }
  }
}

// Account Balances
function renderAccountBalances() {
  console.log('Rendering account balances...');
  
  const checkingBalance = accountBalances.find(acc => acc.account_type === 'checking')?.balance || 0;
  const savingsBalance = accountBalances.find(acc => acc.account_type === 'savings')?.balance || 0;
  
  const currentCheckingEl = document.getElementById('current-checking');
  const currentSavingsEl = document.getElementById('current-savings');
  
  if (currentCheckingEl) currentCheckingEl.textContent = checkingBalance.toFixed(2);
  if (currentSavingsEl) currentSavingsEl.textContent = savingsBalance.toFixed(2);

  // Render debt accounts
  renderDebtAccounts();
}

function renderDebtAccounts() {
  const debtAccounts = accountBalances.filter(acc => 
    acc.account_type === 'credit_card' || acc.account_type === 'student_loan'
  );
  
  const debtGrid = document.getElementById('debt-accounts-grid');
  const noDebtsMessage = document.getElementById('no-debts-message');
  
  if (!debtGrid) return;
  
  debtGrid.innerHTML = '';
  
  if (debtAccounts.length === 0) {
    if (noDebtsMessage) noDebtsMessage.style.display = 'block';
    return;
  }
  
  if (noDebtsMessage) noDebtsMessage.style.display = 'none';
  
  debtAccounts.forEach(account => {
    const div = document.createElement('div');
    div.className = 'debt-card';
    
    const typeLabel = account.account_type === 'credit_card' ? 'Credit Card' : 'Student Loan';
    
    div.innerHTML = `
      <div class="debt-header">
        <div>
          <div class="debt-title">${account.account_name || 'Unnamed Account'}</div>
          <div class="debt-type">${typeLabel}</div>
        </div>
        <div class="debt-actions">
          <button onclick="editDebtAccount(${account.id})" class="edit-btn">Edit</button>
          <button onclick="deleteDebtAccount(${account.id})" class="delete-btn">Delete</button>
        </div>
      </div>
      
      <div class="debt-balance">${account.balance.toFixed(2)}</div>
      
      <div class="debt-details">
        <div class="debt-detail">
          <div class="debt-detail-label">Interest Rate</div>
          <div class="debt-detail-value">${account.interest_rate || 0}%</div>
        </div>
        <div class="debt-detail">
          <div class="debt-detail-label">Min Payment</div>
          <div class="debt-detail-value">${(account.minimum_payment || 0).toFixed(2)}</div>
        </div>
        <div class="debt-detail">
          <div class="debt-detail-label">Due Date</div>
          <div class="debt-detail-value">${account.due_date || 1}${getOrdinalSuffix(account.due_date || 1)}</div>
        </div>
      </div>
    `;
    
    debtGrid.appendChild(div);
  });
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

async function updateBalance(accountType) {
  const inputId = `${accountType}-input`;
  const input = document.getElementById(inputId);
  
  if (!input || !input.value) {
    alert('Please enter a valid amount');
    return;
  }

  const balance = parseFloat(input.value);
  
  try {
    await window.electronAPI.updateAccountBalance(accountType, balance);
    await loadData();
    renderAccountBalances();
    updateDashboard();
    input.value = '';
  } catch (error) {
    console.error('Failed to update balance:', error);
    alert('Failed to update balance: ' + error.message);
  }
}

// Debt Account Management
async function saveDebtAccount() {
  console.log('Saving debt account...');
  
  const id = document.getElementById('debt-id').value;
  const accountData = {
    account_type: document.getElementById('debt-account-type').value,
    account_name: document.getElementById('debt-name').value,
    balance: parseFloat(document.getElementById('debt-balance').value),
    interest_rate: parseFloat(document.getElementById('debt-interest-rate').value) || 0,
    minimum_payment: parseFloat(document.getElementById('debt-minimum-payment').value) || 0,
    due_date: parseInt(document.getElementById('debt-due-date').value) || 1
  };

  try {
    if (id) {
      await window.electronAPI.updateDebtAccount(parseInt(id), accountData);
    } else {
      await window.electronAPI.addDebtAccount(accountData);
    }
    await loadData();
    closeModal('debt-modal');
    renderAccountBalances();
    updateDashboard();
  } catch (error) {
    console.error('Failed to save debt account:', error);
    alert('Failed to save debt account: ' + error.message);
  }
}

async function deleteDebtAccount(id) {
  if (confirm('Are you sure you want to delete this debt account?')) {
    try {
      await window.electronAPI.deleteDebtAccount(id);
      await loadData();
      renderAccountBalances();
      updateDashboard();
    } catch (error) {
      console.error('Failed to delete debt account:', error);
      alert('Failed to delete debt account: ' + error.message);
    }
  }
}

function editDebtAccount(id) {
  const account = accountBalances.find(acc => acc.id === id);
  if (account) {
    document.getElementById('debt-id').value = account.id;
    document.getElementById('debt-account-type').value = account.account_type;
    document.getElementById('debt-name').value = account.account_name || '';
    document.getElementById('debt-balance').value = account.balance;
    document.getElementById('debt-interest-rate').value = account.interest_rate || '';
    document.getElementById('debt-minimum-payment').value = account.minimum_payment || '';
    document.getElementById('debt-due-date').value = account.due_date || 1;
    
    const typeLabel = account.account_type === 'credit_card' ? 'Credit Card' : 'Student Loan';
    document.getElementById('debt-modal-title').textContent = `Edit ${typeLabel}`;
    
    openDebtModal(account.account_type);
  }
}

// Budget Management
function renderBudget() {
  console.log('Rendering budget...');
  
  const incomeItems = monthlyBudget.filter(item => item.type === 'income');
  const expenseItems = monthlyBudget.filter(item => item.type === 'expense');
  
  const incomeTotal = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const net = incomeTotal - expenseTotal;

  // Update totals
  const incomeEl = document.getElementById('budget-income-total');
  const expenseEl = document.getElementById('budget-expense-total');
  const netEl = document.getElementById('budget-net');
  
  if (incomeEl) incomeEl.textContent = incomeTotal.toFixed(2);
  if (expenseEl) expenseEl.textContent = expenseTotal.toFixed(2);
  if (netEl) {
    netEl.textContent = net.toFixed(2);
    netEl.style.color = net >= 0 ? '#27ae60' : '#e74c3c';
  }

  // Render income list
  const incomeList = document.getElementById('budget-income-list');
  if (incomeList) {
    incomeList.innerHTML = '';
    incomeItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'budget-item';
      div.innerHTML = `
        <div class="budget-item-info">
          <div class="budget-item-name">${item.name}</div>
          <div class="budget-item-category">${item.category} • Day ${item.day_of_month}</div>
        </div>
        <div class="budget-item-amount income">${item.amount.toFixed(2)}</div>
        <div class="budget-item-actions">
          <button onclick="editBudgetItem('${item.id}')" class="edit-btn">Edit</button>
          <button onclick="deleteBudgetItem('${item.id}')" class="delete-btn">Delete</button>
        </div>
      `;
      incomeList.appendChild(div);
    });
  }

  // Render expense list
  const expenseList = document.getElementById('budget-expense-list');
  if (expenseList) {
    expenseList.innerHTML = '';
    expenseItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'budget-item';
      div.innerHTML = `
        <div class="budget-item-info">
          <div class="budget-item-name">${item.name}</div>
          <div class="budget-item-category">${item.category} • Day ${item.day_of_month}</div>
        </div>
        <div class="budget-item-amount expense">${item.amount.toFixed(2)}</div>
        <div class="budget-item-actions">
          <button onclick="editBudgetItem('${item.id}')" class="edit-btn">Edit</button>
          <button onclick="deleteBudgetItem('${item.id}')" class="delete-btn">Delete</button>
        </div>
      `;
      expenseList.appendChild(div);
    });
  }

  // Render budget comparison chart
  if (typeof Chart !== 'undefined' && budgetComparison.length > 0) {
    const canvas = document.getElementById('budget-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (charts.budget) charts.budget.destroy();
      
      const labels = budgetComparison.map(item => item.name);
      const budgetedData = budgetComparison.map(item => item.budgeted);
      const actualData = budgetComparison.map(item => item.actual);
      
      charts.budget = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Budgeted',
              data: budgetedData,
              backgroundColor: '#3498db'
            },
            {
              label: 'Actual',
              data: actualData,
              backgroundColor: '#e74c3c'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Budget vs Actual (This Month)'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
}

async function saveBudgetItem() {
  console.log('Saving budget item...');
  
  const id = document.getElementById('budget-id').value || uuidv4();
  const budgetItem = {
    id,
    name: document.getElementById('budget-name').value,
    amount: parseFloat(document.getElementById('budget-amount').value),
    type: document.querySelector('input[name="budget-type"]:checked').value,
    category: document.getElementById('budget-category').value,
    day_of_month: parseInt(document.getElementById('budget-day').value)
  };

  try {
    if (document.getElementById('budget-id').value) {
      await window.electronAPI.updateBudgetItem(budgetItem);
    } else {
      await window.electronAPI.addBudgetItem(budgetItem);
    }
    await loadData();
    closeModal('budget-modal');
    renderBudget();
    updateDashboard();
  } catch (error) {
    console.error('Failed to save budget item:', error);
    alert('Failed to save budget item: ' + error.message);
  }
}

async function deleteBudgetItem(id) {
  if (confirm('Are you sure you want to delete this budget item?')) {
    try {
      await window.electronAPI.deleteBudgetItem(id);
      await loadData();
      renderBudget();
      updateDashboard();
    } catch (error) {
      console.error('Failed to delete budget item:', error);
      alert('Failed to delete budget item: ' + error.message);
    }
  }
}

function editBudgetItem(id) {
  const item = monthlyBudget.find(item => item.id === id);
  if (item) {
    document.getElementById('budget-id').value = item.id;
    document.getElementById('budget-name').value = item.name;
    document.getElementById('budget-amount').value = item.amount;
    document.getElementById('budget-category').value = item.category;
    document.getElementById('budget-day').value = item.day_of_month;
    document.querySelector(`input[name="budget-type"][value="${item.type}"]`).checked = true;
    openBudgetModal();
  }
}

// Transactions
function renderTransactions() {
  console.log('Rendering transactions...');
  
  const tbody = document.getElementById('transactions-list');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  transactions.forEach(transaction => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(transaction.date).toLocaleDateString()}</td>
      <td>${transaction.description}</td>
      <td>${transaction.category}</td>
      <td class="${transaction.type}">${Math.abs(transaction.amount).toFixed(2)}</td>
      <td>${transaction.type}</td>
      <td>${transaction.account_type || 'N/A'}</td>
      <td>
        <button onclick="editTransaction('${transaction.id}')" class="edit-btn">Edit</button>
        <button onclick="deleteTransaction('${transaction.id}')" class="delete-btn">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
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
    type: document.querySelector('input[name="type"]:checked').value,
    account_type: document.getElementById('transaction-account').value
  };

  try {
    if (document.getElementById('transaction-id').value) {
      await window.electronAPI.updateTransaction(transaction);
    } else {
      await window.electronAPI.addTransaction(transaction);
    }
    await loadData();
    closeModal('transaction-modal');
    renderTransactions();
    updateDashboard();
  } catch (error) {
    console.error('Failed to save transaction:', error);
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
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction: ' + error.message);
    }
  }
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) {
    document.getElementById('transaction-id').value = transaction.id;
    document.getElementById('transaction-date').value = transaction.date;
    document.getElementById('transaction-description').value = transaction.description;
    document.getElementById('transaction-amount').value = transaction.amount;
    document.getElementById('transaction-category').value = transaction.category;
    document.getElementById('transaction-account').value = transaction.account_type || 'checking';
    document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
    openTransactionModal();
  }
}

// Savings Goals
function renderSavingsGoals() {
  console.log('Rendering savings goals...');
  
  const goalsGrid = document.getElementById('goals-grid');
  if (!goalsGrid) return;
  
  goalsGrid.innerHTML = '';

  if (savingsGoals.length === 0) {
    goalsGrid.innerHTML = '<div class="info-message"><p>No savings goals yet. Create your first goal to start tracking your progress!</p></div>';
    return;
  }

  savingsGoals.forEach(goal => {
    const progress = goal.target > 0 ? (goal.current / goal.target * 100) : 0;
    const remaining = goal.target - goal.current;
    
    const div = document.createElement('div');
    div.className = 'goal-card';
    div.innerHTML = `
      <div class="goal-header">
        <div class="goal-name">${goal.name}</div>
        <div class="budget-item-actions">
          <button onclick="editSavingsGoal('${goal.id}')" class="edit-btn">Edit</button>
          <button onclick="deleteSavingsGoal('${goal.id}')" class="delete-btn">Delete</button>
        </div>
      </div>
      
      <div class="goal-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
        </div>
        <div class="goal-details">
          <span>${progress.toFixed(1)}% complete</span>
          <span>${goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</span>
        </div>
      </div>
      
      <div class="goal-amounts">
        <div class="goal-amount">
          <div class="goal-amount-label">Current</div>
          <div class="goal-amount-value">${goal.current.toFixed(2)}</div>
        </div>
        <div class="goal-amount">
          <div class="goal-amount-label">Target</div>
          <div class="goal-amount-value">${goal.target.toFixed(2)}</div>
        </div>
        <div class="goal-amount">
          <div class="goal-amount-label">Remaining</div>
          <div class="goal-amount-value">${remaining.toFixed(2)}</div>
        </div>
      </div>
      
      ${goal.description ? `<p style="margin-top: 1rem; color: #666; font-size: 0.875rem;">${goal.description}</p>` : ''}
    `;
    goalsGrid.appendChild(div);
  });
}

async function saveSavingsGoal() {
  console.log('Saving savings goal...');
  
  const id = document.getElementById('goal-id').value || uuidv4();
  const goal = {
    id,
    name: document.getElementById('goal-name').value,
    target: parseFloat(document.getElementById('goal-target').value),
    current: parseFloat(document.getElementById('goal-current').value) || 0,
    deadline: document.getElementById('goal-deadline').value || null,
    description: document.getElementById('goal-description').value || null
  };

  try {
    if (document.getElementById('goal-id').value) {
      await window.electronAPI.updateSavingsGoal(goal);
    } else {
      await window.electronAPI.addSavingsGoal(goal);
    }
    await loadData();
    closeModal('goal-modal');
    renderSavingsGoals();
  } catch (error) {
    console.error('Failed to save savings goal:', error);
    alert('Failed to save savings goal: ' + error.message);
  }
}

async function deleteSavingsGoal(id) {
  if (confirm('Are you sure you want to delete this savings goal?')) {
    try {
      await window.electronAPI.deleteSavingsGoal(id);
      await loadData();
      renderSavingsGoals();
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
      alert('Failed to delete savings goal: ' + error.message);
    }
  }
}

function editSavingsGoal(id) {
  const goal = savingsGoals.find(g => g.id === id);
  if (goal) {
    document.getElementById('goal-id').value = goal.id;
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('goal-target').value = goal.target;
    document.getElementById('goal-current').value = goal.current;
    document.getElementById('goal-deadline').value = goal.deadline || '';
    document.getElementById('goal-description').value = goal.description || '';
    openGoalModal();
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
  if (!canvas) return;
  
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
    case 'budget-analysis':
      renderBudgetAnalysisChart(ctx);
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
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  charts.analytics = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses', 'Net'],
      datasets: [{
        data: [income, expenses, income - expenses],
        backgroundColor: ['#27ae60', '#e74c3c', income - expenses >= 0 ? '#3498db' : '#e74c3c']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Income vs Expenses'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderMonthlyTrendChart(ctx, transactions) {
  // Group transactions by month
  const monthlyData = {};
  
  transactions.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM format
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    monthlyData[month][t.type] += t.amount;
  });

  const months = Object.keys(monthlyData).sort();
  const incomeData = months.map(month => monthlyData[month].income);
  const expenseData = months.map(month => monthlyData[month].expense);

  charts.analytics = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)'
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Monthly Trend'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderBudgetAnalysisChart(ctx) {
  if (budgetComparison.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No budget data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }

  const labels = budgetComparison.map(item => item.name);
  const budgetedData = budgetComparison.map(item => item.budgeted);
  const actualData = budgetComparison.map(item => item.actual);

  charts.analytics = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Budgeted',
          data: budgetedData,
          backgroundColor: '#3498db'
        },
        {
          label: 'Actual',
          data: actualData,
          backgroundColor: '#e74c3c'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Budget Analysis (This Month)'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Modal functions
function openTransactionModal() {
  const modal = document.getElementById('transaction-modal');
  if (modal) {
    modal.style.display = 'block';
    document.getElementById('transaction-form').reset();
    document.getElementById('transaction-id').value = '';
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
  }
}

function openBudgetModal() {
  const modal = document.getElementById('budget-modal');
  if (modal) {
    modal.style.display = 'block';
    document.getElementById('budget-form').reset();
    document.getElementById('budget-id').value = '';
  }
}

function openGoalModal() {
  const modal = document.getElementById('goal-modal');
  if (modal) {
    modal.style.display = 'block';
    document.getElementById('goal-form').reset();
    document.getElementById('goal-id').value = '';
  }
}

function openDebtModal(accountType) {
  const modal = document.getElementById('debt-modal');
  if (modal) {
    modal.style.display = 'block';
    document.getElementById('debt-form').reset();
    document.getElementById('debt-id').value = '';
    document.getElementById('debt-account-type').value = accountType;
    
    const typeLabel = accountType === 'credit_card' ? 'Credit Card' : 'Student Loan';
    document.getElementById('debt-modal-title').textContent = `Add ${typeLabel}`;
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Helper functions
function filterTransactions(searchTerm) {
  // Simple search implementation
  renderTransactions();
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

// Make functions global for HTML onclick attributes
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.editBudgetItem = editBudgetItem;
window.deleteBudgetItem = deleteBudgetItem;
window.editSavingsGoal = editSavingsGoal;
window.deleteSavingsGoal = deleteSavingsGoal;
window.editDebtAccount = editDebtAccount;
window.deleteDebtAccount = deleteDebtAccount;
window.updateBalance = updateBalance;
window.openDebtModal = openDebtModal;
window.closeModal = closeModal;