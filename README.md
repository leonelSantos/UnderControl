# Personal Finance Tracker

A comprehensive desktop application for managing personal finances, built with Electron, React, and Material-UI. Track your income, expenses, transfers, budget planning, savings goals, and visualize your financial health with interactive charts.

## ✨ Features

### 📊 **Dashboard & Overview**
- Financial summary cards showing total checking, savings, debt, and net worth
- Assets vs Debts visualization with interactive doughnut charts
- Net worth trend analysis over time with line charts
- Recent transactions overview
- Real-time balance calculations

### 💰 **Account Management**
- Support for multiple account types:
  - **Checking Accounts** - Track daily spending and income
  - **Savings Accounts** - Monitor your savings growth
  - **Credit Cards** - Manage debt and payments
  - **Student Loans** - Track loan balances and payments
- Account-specific transaction history
- Interest rate and minimum payment tracking for debt accounts
- Automatic balance calculations including transfers

### 💸 **Transaction Tracking**
- **Income Tracking** - Salary, freelance, investments, etc.
- **Expense Management** - Categorized spending tracking
- **Transfer Support** - Move money between accounts seamlessly
- Advanced filtering and search capabilities
- Pagination for large transaction lists
- Bulk transaction management

### 📋 **Budget Planning**
- Monthly budget creation with income and expense categories
- Recurring vs one-time budget items
- Budget vs actual spending comparison
- Visual budget analysis with interactive charts
- Multi-month budget comparison
- Savings rate calculation and tracking

### 🎯 **Savings Goals**
- Create and track multiple savings goals
- Progress visualization with completion percentages
- Deadline tracking
- Target amount vs current amount comparison
- Goal-specific descriptions and notes

### 📈 **Analytics & Insights**
- Spending by category analysis
- Income vs expense trends
- Monthly financial trends
- Budget performance metrics
- Interactive Chart.js visualizations
- Exportable financial reports

## 🛠️ Technology Stack

### **Frontend**
- **React 18.2.0** - Modern UI with hooks and context
- **Material-UI 5.14.0** - Consistent design system
- **Chart.js 4.4.0** - Interactive data visualizations
- **Emotion** - Styled components and theming

### **Backend**
- **Electron 28.0.0** - Cross-platform desktop app framework
- **SQL.js** - Client-side SQLite database
- **Node.js** - Backend runtime environment

### **Development Tools**
- **Webpack 5** - Module bundling and development server
- **Babel** - JavaScript transpilation
- **Electron Builder** - Application packaging and distribution

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js 16.x or higher
- npm or yarn package manager

### **Clone & Install**
```bash
# Clone the repository
git clone https://github.com/yourusername/personal-finance-tracker.git
cd personal-finance-tracker

# Install dependencies
npm install

# Install app dependencies for Electron
npm run postinstall
```

### **Development Mode**
```bash
# Start development with hot reload
npm run dev

# Or run components separately:
npm run dev:react     # Start React dev server
npm run dev:electron  # Start Electron in development mode
```

### **Production Build**
```bash
# Build React application
npm run build:react

# Build and package Electron app
npm run build

# Create distribution packages
npm run dist
```

## 📁 Project Structure

```
personal-finance-tracker/
├── src/
│   ├── components/
│   │   ├── Dashboard/         # Main dashboard components
│   │   ├── Budget/           # Budget management components
│   │   ├── SavingsGoals/     # Savings goal components
│   │   └── Analytics/        # Data visualization components
│   ├── context/
│   │   └── DataContext.js    # Global state management
│   ├── database/
│   │   ├── core.js          # Database initialization
│   │   ├── schema.js        # Database schema and migrations
│   │   ├── accounts.js      # Account operations
│   │   ├── transactions.js  # Transaction operations
│   │   ├── budget.js        # Budget operations
│   │   └── savings.js       # Savings goal operations
│   └── utils/
│       ├── chartConfig.js   # Chart.js configuration
│       └── calculations.js  # Financial calculations
├── main.js                  # Electron main process
├── preload.js              # Electron preload script
├── database.js             # Database module exports
└── package.json
```

## 💾 Database Schema

The application uses SQLite with the following main tables:

### **Accounts**
```sql
accounts (
  id INTEGER PRIMARY KEY,
  account_type TEXT,           -- 'checking', 'savings', 'credit_card', 'student_loan'
  account_name TEXT,
  initial_balance REAL,
  interest_rate REAL,
  minimum_payment REAL,
  due_date INTEGER
)
```

### **Transactions**
```sql
transactions (
  id TEXT PRIMARY KEY,
  date TEXT,
  description TEXT,
  amount REAL,
  category TEXT,
  type TEXT,                   -- 'income', 'expense', 'transfer'
  account_id INTEGER,
  transfer_to_account_id INTEGER  -- For transfer transactions
)
```

### **Monthly Budget**
```sql
monthly_budget (
  id TEXT PRIMARY KEY,
  name TEXT,
  amount REAL,
  type TEXT,                   -- 'income', 'expense'
  category TEXT,
  due_date TEXT,
  is_recurring INTEGER
)
```

### **Savings Goals**
```sql
savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT,
  target REAL,
  current REAL,
  deadline TEXT,
  description TEXT
)
```

## 🎨 Design System

The application uses a warm, earthy color palette:

- **Primary**: Warm Brown (#8D6E63)
- **Secondary**: Earthy Green (#689F38)
- **Success**: Earthy Green (#689F38)
- **Error**: Burnt Orange (#D84315)
- **Background**: Beige (#F5F5DC)
- **Typography**: Inter font family for modern readability

## 🔧 Configuration

### **Build Configuration**
The app uses Electron Builder for packaging. Configuration in `package.json`:

```json
{
  "build": {
    "appId": "com.undercontrol.finance-tracker",
    "productName": "Under Control: Personal Finance Tracker",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "database.js",
      "build/**/*",
      "node_modules/**/*"
    ]
  }
}
```

## 📱 Usage Guide

### **Getting Started**
1. **Add Accounts**: Start by adding your checking, savings, and debt accounts
2. **Record Transactions**: Add your income, expenses, and transfers
3. **Create Budget**: Set up monthly budget items for income and expenses
4. **Set Goals**: Create savings goals to track your progress
5. **Monitor Analytics**: Use the analytics tab to understand your spending patterns

### **Key Features**

#### **Transfer Support**
- Transfer money between accounts seamlessly
- Transfers are tracked separately from income/expenses
- Automatic balance updates for both source and destination accounts

#### **Budget vs Actual**
- Compare your planned budget with actual spending
- Visual indicators showing over/under budget status
- Monthly and multi-month comparisons

#### **Advanced Filtering**
- Filter transactions by date, type, category, and account
- Quick filters for "This Month", "Last Month", "This Year"
- Search functionality across descriptions and categories

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Bug Reports & Feature Requests

Please use the GitHub Issues tab to report bugs or request new features.

## 🔮 Roadmap

- [ ] Data export/import functionality (CSV, JSON)
- [ ] Recurring transaction automation
- [ ] Investment portfolio tracking
- [ ] Mobile app companion
- [ ] Cloud synchronization
- [ ] Advanced reporting and insights
- [ ] Multi-currency support
- [ ] Bill reminder notifications

## 👤 Author

**Leo Santos**

---

**Under Control: Personal Finance Tracker** - Take control of your financial future with comprehensive tracking, budgeting, and analytics tools.