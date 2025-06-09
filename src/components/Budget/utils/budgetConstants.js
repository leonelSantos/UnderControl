// src/components/Budget/utils/budgetConstants.js
export const categories = [
  // Income categories
  { value: 'salary', label: 'Salary', type: 'income' },
  { value: 'freelance', label: 'Freelance', type: 'income' },
  { value: 'investment_income', label: 'Investment Income', type: 'income' },
  { value: 'rental_income', label: 'Rental Income', type: 'income' },
  { value: 'business_income', label: 'Business Income', type: 'income' },
  { value: 'other_income', label: 'Other Income', type: 'income' },
  
  // Expense categories
  { value: 'housing', label: 'Housing/Rent', type: 'expense' },
  { value: 'utilities', label: 'Utilities', type: 'expense' },
  { value: 'food', label: 'Food & Dining', type: 'expense' },
  { value: 'transportation', label: 'Transportation', type: 'expense' },
  { value: 'entertainment', label: 'Entertainment', type: 'expense' },
  { value: 'shopping', label: 'Shopping', type: 'expense' },
  { value: 'healthcare', label: 'Healthcare', type: 'expense' },
  { value: 'education', label: 'Education', type: 'expense' },
  { value: 'insurance', label: 'Insurance', type: 'expense' },
  { value: 'debt_payments', label: 'Debt Payments', type: 'expense' },
  { value: 'savings_transfer', label: 'Savings Transfer', type: 'expense' },
  { value: 'subscriptions', label: 'Subscriptions', type: 'expense' },
  { value: 'personal_care', label: 'Personal Care', type: 'expense' },
  { value: 'gifts_donations', label: 'Gifts & Donations', type: 'expense' },
  { value: 'taxes', label: 'Taxes', type: 'expense' },
  { value: 'other_expense', label: 'Other Expenses', type: 'expense' }
];

export const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// Generate year options (current year ± 5 years)
const currentYear = new Date().getFullYear();
export const yearOptions = [];
for (let year = currentYear - 5; year <= currentYear + 5; year++) {
  yearOptions.push({ value: year, label: year.toString() });
}

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#3E2723',
        font: {
          family: 'Roboto',
          size: 12,
        },
      },
    },
    title: {
      display: true,
      text: 'Budget vs Actual - 6 Month Comparison',
      color: '#3E2723',
      font: {
        family: 'Roboto',
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(62, 39, 35, 0.9)',
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      borderColor: '#8D6E63',
      borderWidth: 1,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(188, 170, 164, 0.3)',
      },
      ticks: {
        color: '#3E2723',
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(188, 170, 164, 0.3)',
      },
      ticks: {
        color: '#3E2723',
        callback: function(value) {
          return '$' + value.toLocaleString();
        }
      }
    }
  }
};