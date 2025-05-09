
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/AuthContext.jsx';

const OperationContext = createContext();

export const useOperations = () => useContext(OperationContext);

const ADMIN_LOG_KEY = 'accountingAdminActivityLog_v1';
const OPERATIONS_KEY = 'accountingOperations_v2';
const CLIENTS_KEY = 'accountingClients_v2';
const CASH_BOXES_KEY = 'accountingCashBoxes_v1';
const EXPENSE_CATEGORIES_KEY = 'accountingExpenseCategories_v1';

const initialCashBoxesDefinition = [
  { id: "ars_efectivo", name: "ARS Efectivo", currency: "ARS", type: "cash", isDefault: true },
  { id: "usd_efectivo", name: "USD Efectivo (Nuevos)", currency: "USD", type: "cash", isDefault: true },
  { id: "usd_efectivo_feos", name: "USD Efectivo (Feos)", currency: "USD", type: "cash", isDefault: false },
  { id: "usd_efectivo_cara_chica", name: "USD Efectivo (Cara Chica)", currency: "USD", type: "cash", isDefault: false },
  { id: "eur_efectivo", name: "EUR Efectivo", currency: "EUR", type: "cash", isDefault: true },
  { id: "brl_efectivo", name: "BRL Efectivo", currency: "BRL", type: "cash", isDefault: false },
  { id: "gbp_efectivo", name: "GBP Efectivo", currency: "GBP", type: "cash", isDefault: false },
  { id: "usdt_billetera", name: "USDT Billetera", currency: "USDT", type: "digital", isDefault: true },
  { id: "dolarapp", name: "DolarApp", currency: "USD", type: "digital_account", isDefault: false },
  { id: "grabrfi", name: "GrabrFi", currency: "USD", type: "digital_account", isDefault: false },
  { id: "city_bank_usd", name: "City Bank (USD)", currency: "USD", type: "bank_account", isDefault: false },
  { id: "wise_usd", name: "Wise (USD)", currency: "USD", type: "digital_account", isDefault: false },
  { id: "payoneer_usd", name: "Payoneer (USD)", currency: "USD", type: "digital_account", isDefault: false },
  { id: "banco_galicia_ars", name: "Banco Galicia (ARS)", currency: "ARS", type: "bank_account", isDefault: true },
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
    action: action,
    details: details,
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


  const refreshAdminLogState = () => {
    setAdminActivityLog(JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || '[]'));
  };

  useEffect(() => localStorage.setItem(OPERATIONS_KEY, JSON.stringify(allOperations)), [allOperations]);
  useEffect(() => localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem(CASH_BOXES_KEY, JSON.stringify(cashBoxes)), [cashBoxes]);
  useEffect(() => localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(expenseCategories)), [expenseCategories]);


  const addOperation = (operationData) => {
    if (!currentUser) throw new Error("Usuario no autenticado.");
    const newOperation = {
      id: uuidv4(),
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      status: 'pending', 
      executedAmountIn: 0,
      executedAmountOut: 0,
      remainingAmountIn: operationData.amountIn || 0,
      remainingAmountOut: operationData.amountOut || 0,
      executions: [],
      ...operationData,
    };
    if (!newOperation.type) throw new Error("Tipo de operación requerido.");
    if (operationData.amountIn === undefined && operationData.amountOut === undefined) throw new Error("Al menos un monto debe ser definido.");
    
    setAllOperations(prev => [newOperation, ...prev]);
    return newOperation;
  };

  const executeOperation = (operationId, executionData) => {
    setAllOperations(prevOperations => {
      const updatedOps = prevOperations.map(op => {
        if (op.id !== operationId) return op;
        const executedIn = Number(executionData.amountIn) || 0;
        const executedOut = Number(executionData.amountOut) || 0;
        
        let newStatus = op.status;
        const newExecutedAmountIn = (op.executedAmountIn || 0) + executedIn;
        const newExecutedAmountOut = (op.executedAmountOut || 0) + executedOut;
        
        const newRemainingAmountIn = Math.max(0, (op.amountIn || 0) - newExecutedAmountIn);
        const newRemainingAmountOut = Math.max(0, (op.amountOut || 0) - newExecutedAmountOut);

        if (newRemainingAmountIn < 0.001 && newRemainingAmountOut < 0.001) {
          newStatus = 'completed';
        } else if (newExecutedAmountIn > 0 || newExecutedAmountOut > 0) {
          newStatus = 'partial';
        }

        setCashBoxes(prevBoxes => prevBoxes.map(box => {
            let newBalance = box.balance;
            if (executionData.targetCashBoxInId === box.id && box.currency === executionData.currencyIn) {
                newBalance += executedIn;
            }
            if (executionData.targetCashBoxOutId === box.id && box.currency === executionData.currencyOut) {
                newBalance -= executedOut;
            }
            return {...box, balance: newBalance};
        }));

        return {
          ...op,
          executedAmountIn: newExecutedAmountIn,
          executedAmountOut: newExecutedAmountOut,
          remainingAmountIn: newRemainingAmountIn,
          remainingAmountOut: newRemainingAmountOut,
          status: newStatus,
          executions: [...(op.executions || []), {
            id: uuidv4(),
            ...executionData,
            timestamp: new Date().toISOString(),
          }],
        };
      });
      return updatedOps;
    });
  };

  const updateOperation = (operationId, updatedData) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    let originalOp = null;
    let wasCompleted = false;

    setAllOperations(prev => prev.map(op => {
        if (op.id === operationId) {
            originalOp = {...op}; 
            wasCompleted = op.status === 'completed';

            const newOpData = { 
                ...op, 
                ...updatedData, 
                updatedAt: new Date().toISOString(), 
                updatedBy: currentUser.id 
            };

            if (wasCompleted) {
              newOpData.status = 'completed';
            } else {
                const remainingIn = Math.max(0, (newOpData.amountIn || 0) - (newOpData.executedAmountIn || 0));
                const remainingOut = Math.max(0, (newOpData.amountOut || 0) - (newOpData.executedAmountOut || 0));
                newOpData.remainingAmountIn = remainingIn;
                newOpData.remainingAmountOut = remainingOut;

                if (remainingIn < 0.001 && remainingOut < 0.001 && (newOpData.executedAmountIn > 0 || newOpData.executedAmountOut > 0)) {
                    newOpData.status = 'completed';
                } else if ((newOpData.executedAmountIn || 0) > 0 || (newOpData.executedAmountOut || 0) > 0) {
                    newOpData.status = 'partial';
                } else {
                    newOpData.status = 'pending';
                }
            }
            return newOpData;
        }
        return op;
    }));

    if (originalOp) {
        let logMessage = "update_operation";
        let logDetails = { operationId, original: originalOp, updated: updatedData };

        if (wasCompleted && (originalOp.amountIn !== updatedData.amountIn || originalOp.currencyIn !== updatedData.currencyIn || originalOp.amountOut !== updatedData.amountOut || originalOp.currencyOut !== updatedData.currencyOut)) {
            logMessage = "update_completed_operation_data_only";
            logDetails.warning = "Operación completada fue modificada. Los saldos de caja NO se ajustaron retroactivamente. Se requiere ajuste manual si es necesario.";
        }
        
        logAdminActivity(logMessage, logDetails, currentUser.id);
        refreshAdminLogState();
    }
  };

  const deleteOperation = (operationId) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    const opToDelete = allOperations.find(op => op.id === operationId);
    
    if (opToDelete) {
        let logMessage = "delete_operation";
        let logDetails = { operationId, deletedOperation: opToDelete };

        if (opToDelete.status === 'completed' || opToDelete.status === 'partial') {
            logMessage = "delete_executed_operation";
            logDetails.warning = `Operación ${opToDelete.status} fue eliminada. Los saldos de caja NO se ajustaron retroactivamente. Se requiere ajuste manual si es necesario.`;
        }
        logAdminActivity(logMessage, logDetails, currentUser.id);
        refreshAdminLogState();
    }
    setAllOperations(prev => prev.filter(op => op.id !== operationId));
  };

  const addClient = (clientName, additionalData = {}) => {
    if (!clientName.trim()) throw new Error("El nombre del cliente no puede estar vacío.");
    const existing = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (existing) throw new Error("El cliente ya existe.");
    const newClient = { 
      id: uuidv4(), 
      name: clientName.trim(), 
      additionalData: additionalData, 
      createdAt: new Date().toISOString() 
    };
    setClients(prev => [newClient, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    return newClient;
  };

  const updateClient = (clientId, updatedData) => {
    if (!updatedData.name?.trim()) throw new Error("El nombre del cliente no puede estar vacío.");
    let originalClient = null;
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        originalClient = {...c};
        return { ...c, ...updatedData, updatedAt: new Date().toISOString() };
      }
      return c;
    }).sort((a,b) => a.name.localeCompare(b.name)));

    if (currentUser?.role === 'admin' && originalClient) {
        logAdminActivity("update_client", { clientId, original: originalClient, updated: updatedData }, currentUser.id);
        refreshAdminLogState();
    }
  };
  
  const addCashBox = (boxData) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    if (!boxData.name || !boxData.currency || !boxData.type) throw new Error("Nombre, moneda y tipo son requeridos.");
    const newBox = { id: uuidv4(), balance: 0, isDefault: false, ...boxData };
    setCashBoxes(prev => [...prev, newBox]);
    logAdminActivity("add_cash_box", { newBox }, currentUser.id);
    refreshAdminLogState();
    return newBox;
  };

  const updateCashBox = (boxId, updatedData) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    let originalBox = null;
    setCashBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        originalBox = {...box};
        const { balance, ...restOfData } = updatedData; 
        return { ...box, ...restOfData };
      }
      return box;
    }));
    if(originalBox) {
        logAdminActivity("update_cash_box_details", { boxId, original: originalBox, updated: updatedData }, currentUser.id);
        refreshAdminLogState();
    }
  };
  
  const adjustCashBoxBalance = (boxId, newBalance, adjustmentReason) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    if (typeof newBalance !== 'number') throw new Error("El nuevo balance debe ser un número.");

    let boxToAdjust = null;
    let oldBalance = 0;

    setCashBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        boxToAdjust = {...box};
        oldBalance = box.balance;
        return { ...box, balance: newBalance };
      }
      return box;
    }));

    if (boxToAdjust) {
      logAdminActivity("adjust_cash_box_balance", { 
        boxId, 
        boxName: boxToAdjust.name,
        currency: boxToAdjust.currency,
        oldBalance, 
        newBalance,
        reason: adjustmentReason || "Ajuste manual por administrador"
      }, currentUser.id);
      refreshAdminLogState();

      addOperation({
        type: 'ajuste_saldo_caja',
        amountIn: newBalance > oldBalance ? newBalance - oldBalance : 0,
        amountOut: newBalance < oldBalance ? oldBalance - newBalance : 0,
        currencyIn: boxToAdjust.currency,
        currencyOut: boxToAdjust.currency,
        description: `Ajuste manual de ${boxToAdjust.name}. Razón: ${adjustmentReason || 'Admin'}. Saldo anterior: ${oldBalance}, nuevo: ${newBalance}`,
        status: 'completed', 
        targetCashBoxInId: newBalance > oldBalance ? boxId : null, 
        targetCashBoxOutId: newBalance < oldBalance ? boxId : null, 
        executions: [{ 
            id: uuidv4(), 
            timestamp: new Date().toISOString(),
            amountIn: newBalance > oldBalance ? newBalance - oldBalance : 0,
            currencyIn: boxToAdjust.currency,
            targetCashBoxInId: newBalance > oldBalance ? boxId : null,
            amountOut: newBalance < oldBalance ? oldBalance - newBalance : 0,
            currencyOut: boxToAdjust.currency,
            targetCashBoxOutId: newBalance < oldBalance ? boxId : null,
        }]
      });
    }
  };

  const deleteCashBox = (boxId) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    const boxToDelete = cashBoxes.find(b => b.id === boxId);
    if (boxToDelete?.balance !== 0) throw new Error("La caja debe tener saldo cero para ser eliminada.");
    if (boxToDelete?.isDefault) throw new Error("No se puede eliminar una caja por defecto.");
    
    setCashBoxes(prev => prev.filter(b => b.id !== boxId));
    if(boxToDelete) {
        logAdminActivity("delete_cash_box", { deletedBox: boxToDelete }, currentUser.id);
        refreshAdminLogState();
    }
  };

  const addExpenseCategory = (categoryType) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    if (!categoryType || typeof categoryType !== 'string') throw new Error("Tipo de categoría inválido.");
    setExpenseCategories(prev => {
        if (prev.includes(categoryType)) return prev;
        const updated = [...prev, categoryType];
        logAdminActivity("add_expense_category", { categoryType }, currentUser.id);
        refreshAdminLogState();
        return updated;
    });
  };

  const removeExpenseCategory = (categoryType) => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado.");
    setExpenseCategories(prev => {
        if (!prev.includes(categoryType)) return prev;
        const updated = prev.filter(cat => cat !== categoryType);
        logAdminActivity("remove_expense_category", { categoryType }, currentUser.id);
        refreshAdminLogState();
        return updated;
    });
  };


  const getPendingOperations = useMemo(() => {
    if (!currentUser) return [];
    const filterFn = op => op.status !== 'completed';
    const ops = currentUser.role === 'admin' ? allOperations.filter(filterFn) : allOperations.filter(op => op.userId === currentUser.id && filterFn(op));
    return ops.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allOperations, currentUser]);

  const getCompletedOperations = useMemo(() => {
    if (!currentUser) return [];
    const filterFn = op => op.status === 'completed';
    const ops = currentUser.role === 'admin' ? allOperations.filter(filterFn) : allOperations.filter(op => op.userId === currentUser.id && filterFn(op));
    return ops.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allOperations, currentUser]);
  
  const getAllOperationsAdmin = useMemo(() => {
    if (currentUser?.role !== 'admin') return [];
    return [...allOperations].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allOperations, currentUser]);

  const getAdminActivityLog = () => {
    if (currentUser?.role !== 'admin') return [];
    return adminActivityLog; 
  };
  
  const resetAllData = () => {
    if (currentUser?.role !== 'admin') throw new Error("No autorizado para resetear datos.");
    
    const emptyOperations = [];
    const emptyClients = [];
    const zeroedCashBoxes = initializeCashBoxesWithZeroBalance(initialCashBoxesDefinition);
    const emptyAdminLog = [];
    const defaultExpenses = [...defaultExpenseOperationTypes];


    setAllOperations(emptyOperations);
    setClients(emptyClients);
    setCashBoxes(zeroedCashBoxes);
    setAdminActivityLog(emptyAdminLog);
    setExpenseCategories(defaultExpenses);

    localStorage.setItem(OPERATIONS_KEY, JSON.stringify(emptyOperations));
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(emptyClients));
    localStorage.setItem(CASH_BOXES_KEY, JSON.stringify(zeroedCashBoxes));
    localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(emptyAdminLog));
    localStorage.setItem(EXPENSE_CATEGORIES_KEY, JSON.stringify(defaultExpenses));
    
    logAdminActivity("reset_all_data", { message: "Todos los datos de la aplicación han sido reseteados." }, currentUser.id);
    refreshAdminLogState();
  };


  const value = {
    operations: getCompletedOperations,
    pendingOperations: getPendingOperations,
    allOperationsForAdmin: getAllOperationsAdmin,
    addOperation,
    executeOperation,
    updateOperation,
    deleteOperation,
    clients,
    addClient,
    updateClient,
    getAdminActivityLog,
    cashBoxes,
    addCashBox,
    updateCashBox,
    adjustCashBoxBalance,
    deleteCashBox,
    resetAllData,
    expenseCategories,
    addExpenseCategory,
    removeExpenseCategory,
  };

  return (
    <OperationContext.Provider value={value}>
      {children}
    </OperationContext.Provider>
  );
};
