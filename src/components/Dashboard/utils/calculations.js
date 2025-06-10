// src/components/Dashboard/utils/calculations.js - Fixed to include transfer totals for proper display

export const calculateBalances = (accountBalances, transactions) => {
  const balances = {};
  
  // Initialize with backend-calculated balances (which are now correct)
  accountBalances.forEach(account => {
    const accountKey = account.id || account.account_type;
    balances[accountKey] = {
      ...account,
      calculatedBalance: account.balance || 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalTransfersIn: 0,
      totalTransfersOut: 0,
      transactionCount: 0
    };
  });

  // Calculate transaction totals for display purposes
  transactions.forEach(transaction => {
    const accountKey = transaction.account_id || transaction.account_type;
    
    // Handle transactions FROM this account (source account)
    if (balances[accountKey]) {
      balances[accountKey].transactionCount++;
      
      if (transaction.type === 'income') {
        balances[accountKey].totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        balances[accountKey].totalExpenses += transaction.amount;
      } else if (transaction.type === 'transfer') {
        // Money going OUT of this account
        balances[accountKey].totalTransfersOut += transaction.amount;
      }
    }
    
    // Handle transfers TO this account (destination account)
    if (transaction.type === 'transfer' && transaction.transfer_to_account_id) {
      const toAccountKey = transaction.transfer_to_account_id;
      if (balances[toAccountKey]) {
        // Money coming IN to this account
        balances[toAccountKey].totalTransfersIn += transaction.amount;
        
        // Only count the transaction once, so don't increment transactionCount here
        // since it's already counted in the source account
      }
    }
  });

  return Object.values(balances);
};

export const calculateFinancialSummary = (calculatedBalances) => {
  const checkingAccounts = calculatedBalances.filter(acc => acc.account_type === 'checking');
  const savingsAccounts = calculatedBalances.filter(acc => acc.account_type === 'savings');
  const debtAccounts = calculatedBalances.filter(acc => 
    acc.account_type === 'credit_card' || acc.account_type === 'student_loan'
  );

  const totalChecking = checkingAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
  const totalSavings = savingsAccounts.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
  
  // For debt accounts, the balance represents the amount owed (should be positive)
  // But for net worth calculation, we want to subtract debt from assets
  const totalDebt = debtAccounts.reduce((sum, acc) => sum + Math.abs(acc.calculatedBalance), 0);
  const netWorth = (totalChecking + totalSavings) - totalDebt;

  return {
    totalChecking,
    totalSavings,
    totalDebt,
    netWorth,
    checkingAccounts,
    savingsAccounts,
    debtAccounts
  };
};