// src/components/Budget/components/BudgetItemCard.js - Complete Version
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import { categories } from '../utils/budgetConstants';

const BudgetItemCard = ({ item, onEdit, onDelete, currentMonth, currentYear }) => {
  const categoryLabel = categories.find(cat => cat.value === item.category)?.label || item.category;
  
  // Parse the due date safely without timezone issues
  const getDueDateInfo = (item) => {
    if (item.due_date || item.calculated_due_date) {
      const dateString = item.due_date || item.calculated_due_date;
      // Parse the date as local date to avoid timezone shift
      const [year, month, day] = dateString.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day); // month is 0-indexed in JS
      
      return {
        fullDate: dueDate.toLocaleDateString(),
        monthYear: dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        day: dueDate.getDate(),
        isCurrentMonth: dueDate.getMonth() + 1 === currentMonth && dueDate.getFullYear() === currentYear
      };
    }
    
    // Fallback to legacy format
    const day = item.day_of_month || 1;
    const month = item.month || currentMonth;
    const year = item.year || currentYear;
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return {
      fullDate: date.toLocaleDateString(),
      monthYear: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      day: day,
      isCurrentMonth: month === currentMonth && year === currentYear
    };
  };
  
  const dueDateInfo = getDueDateInfo(item);
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        borderRadius: '12px',
        borderLeft: `4px solid ${item.type === 'income' ? '#689F38' : '#D84315'}`,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(93, 64, 55, 0.15)',
        },
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#3E2723' }}>
                {item.name}
              </Typography>
              {item.is_recurring && Boolean(item.is_recurring) && (
                <Tooltip title="Recurring item">
                  <RepeatIcon sx={{ color: '#8D6E63' }} fontSize="small" />
                </Tooltip>
              )}
              {!dueDateInfo.isCurrentMonth && (
                <Chip 
                  size="small" 
                  label={dueDateInfo.monthYear}
                  variant="outlined"
                  sx={{ 
                    borderColor: '#8D6E63',
                    color: '#8D6E63',
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: '#5D4037', mb: 1 }}>
              {categoryLabel} • Due: {dueDateInfo.fullDate}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{
                color: item.type === 'income' ? '#689F38' : '#D84315',
                fontWeight: 'bold',
              }}
            >
              ${item.amount.toFixed(2)}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton 
              size="small" 
              onClick={() => onEdit(item)}
              sx={{ 
                color: '#8D6E63',
                '&:hover': { backgroundColor: 'rgba(141, 110, 99, 0.1)' }
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => onDelete(item.id)} 
              sx={{ 
                color: '#D84315',
                '&:hover': { backgroundColor: 'rgba(216, 67, 21, 0.1)' }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BudgetItemCard;