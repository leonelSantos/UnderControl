// src/components/Budget/utils/budgetCalculations.js - Updated to include transfers as expenses

export const calculateBudgetSummary = (monthlyBudget, selectedMonth, selectedYear) => {
  // Filter budget items for selected month/year
  const filteredBudget = monthlyBudget.filter(item => {
    // Check by due_date first
    if (item.due_date || item.calculated_due_date) {
      const dateString = item.due_date || item.calculated_due_date;
      const [year, month, day] = dateString.split('-').map(Number);
      return month === selectedMonth && year === selectedYear;
    }
    
    // Fallback to legacy month/year properties
    if (item.month && item.year) {
      return item.month === selectedMonth && item.year === selectedYear;
    }
    
    // For recurring items without specific month/year, include them
    return item.is_recurring;
  });

  const incomeItems = filteredBudget.filter(item => item.type === 'income');
  const expenseItems = filteredBudget.filter(item => item.type === 'expense');
  
  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    savingsRate,
    incomeItems,
    expenseItems
  };
};

export const calculateActualSpending = (transactions, selectedMonth, selectedYear) => {
  const selectedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  
  // Include ALL transactions for the selected month
  const monthTransactions = transactions.filter(transaction => 
    transaction.date.startsWith(selectedDate)
  );

  // Income: regular income transactions only
  const actualIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Expenses: regular expenses + transfers (since transfers represent money going out)
  const actualExpenses = monthTransactions
    .filter(t => t.type === 'expense' || t.type === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    actualIncome,
    actualExpenses,
    actualNet: actualIncome - actualExpenses
  };
};

export const calculateMonthlyComparison = (monthlyBudget, transactions) => {
  const monthlyData = {};
  
  // Group budget items by month/year from due_date
  monthlyBudget.forEach(item => {
    let monthKey;
    
    if (item.due_date || item.calculated_due_date) {
      const dateString = item.due_date || item.calculated_due_date;
      try {
        let parsedDate;
        
        if (dateString.includes('-')) {
          const parts = dateString.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              parsedDate = new Date(parts[0], parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              parsedDate = new Date(parts[2], parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
          } else if (parts.length === 2 && parts[0].length === 4) {
            parsedDate = new Date(parts[0], parseInt(parts[1]) - 1, 1);
          }
        } else {
          parsedDate = new Date(dateString);
        }
        
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          monthKey = `${year}-${month}`;
        } else {
          console.warn('Invalid date in budget item:', dateString, item);
          return;
        }
      } catch (error) {
        console.warn('Error parsing date in budget item:', dateString, error);
        return;
      }
    } else if (item.month && item.year) {
      monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
    } else {
      console.warn('Budget item missing date information:', item);
      return;
    }
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { 
        budgetIncome: 0, 
        budgetExpenses: 0, 
        actualIncome: 0, 
        actualExpenses: 0 
      };
    }
    
    if (item.type === 'income') {
      monthlyData[monthKey].budgetIncome += parseFloat(item.amount) || 0;
    } else if (item.type === 'expense') {
      monthlyData[monthKey].budgetExpenses += parseFloat(item.amount) || 0;
    }
  });

  // Add actual spending from transactions (INCLUDING transfers as expenses)
  transactions.forEach(transaction => {
    if (!transaction.date) {
      console.warn('Transaction missing date:', transaction);
      return;
    }
    
    try {
      let monthKey;
      
      if (transaction.date.includes('-')) {
        const dateParts = transaction.date.split('-');
        if (dateParts.length >= 2) {
          if (dateParts[0].length === 4) {
            monthKey = `${dateParts[0]}-${dateParts[1]}`;
          } else {
            monthKey = `${dateParts[2]}-${dateParts[0]}`;
          }
        }
      } else {
        const parsedDate = new Date(transaction.date);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
          monthKey = `${year}-${month}`;
        }
      }
      
      if (!monthKey) {
        console.warn('Could not parse transaction date:', transaction.date);
        return;
      }
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          budgetIncome: 0, 
          budgetExpenses: 0, 
          actualIncome: 0, 
          actualExpenses: 0 
        };
      }
      
      const amount = parseFloat(transaction.amount) || 0;
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].actualIncome += amount;
      } else if (transaction.type === 'expense' || transaction.type === 'transfer') {
        // Include both regular expenses AND transfers as actual expenses
        monthlyData[monthKey].actualExpenses += amount;
      }
    } catch (error) {
      console.warn('Error processing transaction date:', transaction.date, error);
    }
  });

  // Convert to sorted array for chart
  const sortedMonths = Object.keys(monthlyData)
    .filter(month => month.match(/^\d{4}-\d{2}$/))
    .sort();
  
  // Get last 6 months that have data, or current and previous 5 months
  const now = new Date();
  const last6MonthKeys = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    last6MonthKeys.push(key);
  }
  
  const monthsToShow = sortedMonths.length > 0 ? 
    (sortedMonths.length >= 6 ? sortedMonths.slice(-6) : sortedMonths) : 
    last6MonthKeys;
  
  return {
    labels: monthsToShow.map(month => {
      try {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch (error) {
        return month;
      }
    }),
    datasets: [
      {
        label: 'Budgeted Income',
        data: monthsToShow.map(month => monthlyData[month]?.budgetIncome || 0),
        backgroundColor: 'rgba(104, 159, 56, 0.7)',
        borderColor: '#689F38',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Actual Income',
        data: monthsToShow.map(month => monthlyData[month]?.actualIncome || 0),
        backgroundColor: 'rgba(139, 195, 74, 0.8)',
        borderColor: '#8BC34A',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Budgeted Expenses',
        data: monthsToShow.map(month => monthlyData[month]?.budgetExpenses || 0),
        backgroundColor: 'rgba(216, 67, 21, 0.7)',
        borderColor: '#D84315',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Actual Expenses',
        data: monthsToShow.map(month => monthlyData[month]?.actualExpenses || 0),
        backgroundColor: 'rgba(255, 87, 34, 0.8)',
        borderColor: '#FF5722',
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  };
};