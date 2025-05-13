import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext.jsx';

const OperationContext = createContext();

export const useOperations = () => {
  const context = useContext(OperationContext);
  if (!context) {
    throw new Error("useOperations must be used within an OperationProvider");
  }
  return context;
};

const ADMIN_LOG_KEY = 'accountingAdminActivityLog_v1';
const OPERATIONS_KEY = 'accountingOperations_v3';
const CLIENTS_KEY = 'accountingClients_v2';
const CASH_BOXES_KEY = 'accountingCashBoxes_v1';
const EXPENSE_CATEGORIES_KEY = 'accountingExpenseCategories_v1';

const initialCashBoxesDefinition = [
  { id: "ars_efectivo", name: "ARS Efectivo", currency: "ARS", type: "cash", isDefault: true },
  { id: "usd_efectivo", name: "USD Efectivo (Nuevos)", currency: "USD", type: "cash", isDefault: true },
  // Más definiciones aquí...
];

const defaultExpenseOperationTypes = ["sueldos", "gastos_varios", "costos_fijos", "comision_pagada", "otro_egreso", "alquileres_pagados"];

const initializeCashBoxesWithZeroBalance = (definitions) => {
  return definitions.map(box => ({ ...box, balance: 0 }));
};

const logAdminActivity = (action, details, userId) => {
  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId: userId || 'system',
    action,
    details,
  };
  const existingLog = JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || '[]');
  existingLog.unshift(logEntry);
  localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(existingLog.slice(0, 100)));
};

export const OperationProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [allOperations, setAllOperations] = useState(() => {
    const saved = localStorage.getItem(OPERATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem(CLIENTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [cashBoxes, setCashBoxes] = useState(() => {
    const saved = localStorage.getItem(CASH_BOXES_KEY);
    if (saved) {
      const parsedBoxes = JSON.parse(saved);
      const currentBoxIds = new Set(parsedBoxes.map(b => b.id));
      const newBoxes = initialCashBoxesDefinition
        .filter(def => !currentBoxIds.has(def.id))
        .map(def => ({ ...def, balance: 0 }));
      return [...parsedBoxes, ...newBoxes];
    }
    return initializeCashBoxesWithZeroBalance(initialCashBoxesDefinition);
  });

  const [adminActivityLog, setAdminActivityLog] = useState(() => {
    const savedLog = localStorage.getItem(ADMIN_LOG_KEY);
    return savedLog ? JSON.parse(savedLog) : [];
  });

  const [expenseCategories, setExpenseCategories] = useState(() => {
    const saved = localStorage.getItem(EXPENSE_CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : defaultExpenseOperationTypes;
  });

  useEffect(() => {
    localStorage.setItem(OPERATIONS_KEY, JSON.stringify(allOperations));
  }, [allOperations]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(CASH_BOXES_KEY, JSON.stringify(cashBoxes));
  }, [cashBoxes]);

  useEffect(() => {
    localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  const value = {
    allOperations,
    clients,
    cashBoxes,
    expenseCategories,
    addOperation: () => {}, // Implementar lógica
    updateOperation: () => {}, // Implementar lógica
    deleteOperation: () => {}, // Implementar lógica
    // Más funciones aquí...
  };

  return (
    <OperationContext.Provider value={value}>
      {children}
    </OperationContext.Provider>
  );
};