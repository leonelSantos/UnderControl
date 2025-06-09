// src/components/Budget/index.js - Main Budget Component (Refactored)
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { useData } from '../../context/DataContext';

// Import modular components
import CurrentMonthTab from './CurrentMonthTab';
import MultiMonthTab from './MultiMonthTab';
import BudgetItemModal from './BudgetItemModal';

// Import utilities
import { categories } from './utils/budgetConstants';
import { calculateBudgetSummary, calculateActualSpending, calculateMonthlyComparison } from './utils/budgetCalculations';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Budget = () => {
  const { 
    monthlyBudget,
    transactions,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    generateId 
  } = useData();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: '',
    due_date: new Date().toISOString().split('T')[0],
    is_recurring: true
  });

  // Calculated data
  const budgetSummary = useMemo(() => 
    calculateBudgetSummary(monthlyBudget, selectedMonth, selectedYear), 
    [monthlyBudget, selectedMonth, selectedYear]
  );

  const actualSpending = useMemo(() => 
    calculateActualSpending(transactions, selectedMonth, selectedYear), 
    [transactions, selectedMonth, selectedYear]
  );

  const monthlyComparison = useMemo(() => 
    calculateMonthlyComparison(monthlyBudget, transactions), 
    [monthlyBudget, transactions]
  );

  // Event handlers
  const handleFormSubmit = async () => {
    try {
      const itemData = {
        id: editingItem ? editingItem.id : generateId(),
        name: budgetForm.name,
        amount: parseFloat(budgetForm.amount),
        type: budgetForm.type,
        category: budgetForm.category,
        due_date: budgetForm.due_date,
        is_recurring: budgetForm.is_recurring
      };

      if (editingItem) {
        await updateBudgetItem(itemData);
      } else {
        await addBudgetItem(itemData);
      }

      setModalOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      alert('Failed to save budget item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    let dueDate = item.due_date || item.calculated_due_date;
    if (!dueDate && item.month && item.year && item.day_of_month) {
      dueDate = `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day_of_month).padStart(2, '0')}`;
    }
    if (!dueDate) {
      dueDate = new Date().toISOString().split('T')[0];
    }
    
    if (dueDate && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsedDate = new Date(dueDate);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        dueDate = `${year}-${month}-${day}`;
      }
    }
    
    setBudgetForm({
      name: item.name,
      amount: item.amount.toString(),
      type: item.type,
      category: item.category,
      due_date: dueDate,
      is_recurring: Boolean(item.is_recurring)
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget item?')) {
      try {
        await deleteBudgetItem(id);
      } catch (error) {
        alert('Failed to delete budget item: ' + error.message);
      }
    }
  };

  const openAddModal = (type = 'expense') => {
    setEditingItem(null);
    resetForm(type);
    setModalOpen(true);
  };

  const resetForm = (type = 'expense') => {
    setBudgetForm({
      name: '',
      amount: '',
      type,
      category: '',
      due_date: new Date().toISOString().split('T')[0],
      is_recurring: true
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Monthly Budget Tracker
      </Typography>

      {/* Tab Navigation */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Current Month" />
          <Tab label="Multi-Month Comparison" />
        </Tabs>
      </Paper>

      {/* Current Month Tab */}
      <TabPanel value={activeTab} index={0}>
        <CurrentMonthTab
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          budgetSummary={budgetSummary}
          actualSpending={actualSpending}
          onAddItem={openAddModal}
          onEditItem={handleEdit}
          onDeleteItem={handleDelete}
        />
      </TabPanel>

      {/* Multi-Month Comparison Tab */}
      <TabPanel value={activeTab} index={1}>
        <MultiMonthTab
          monthlyComparison={monthlyComparison}
          monthlyBudget={monthlyBudget}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthSelect={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
            setActiveTab(0);
          }}
        />
      </TabPanel>

      {/* Budget Item Modal */}
      <BudgetItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isEditing={!!editingItem}
        form={budgetForm}
        onFormChange={setBudgetForm}
        onSubmit={handleFormSubmit}
        categories={categories}
      />
    </Box>
  );
};

export default Budget;