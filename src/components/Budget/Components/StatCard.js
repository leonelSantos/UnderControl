// src/components/Budget/components/StatCard.js
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const StatCard = ({ title, amount, type, icon, onClick }) => (
  <Card 
    elevation={3} 
    sx={{ 
      height: '100%',
      background: type === 'income' 
        ? 'linear-gradient(135deg, #689F38 0%, #8BC34A 100%)' 
        : 'linear-gradient(135deg, #D84315 0%, #FF5722 100%)',
      color: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(93, 64, 55, 0.2)',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(93, 64, 55, 0.3)',
        transform: 'translateY(-2px)',
      },
      transition: 'all 0.3s ease-in-out',
    }}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {title}
        </Typography>
        <Box sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {icon}
        </Box>
      </Box>
      <Typography 
        variant="h4" 
        component="div" 
        sx={{ mb: 2, fontWeight: 'bold', color: 'white' }}
      >
        ${amount.toFixed(2)}
      </Typography>
      <Button 
        variant="outlined" 
        size="small" 
        startIcon={<AddIcon />}
        onClick={onClick}
        fullWidth
        sx={{
          color: 'white',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        Add {type === 'income' ? 'Income' : 'Expense'}
      </Button>
    </CardContent>
  </Card>
);

export default StatCard;