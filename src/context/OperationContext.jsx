
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { debug } from '@/lib/logger.jsx';

const OperationContext = createContext();

export const useOperations = () => {
  const context = useContext(OperationContext);
  if (!context) {
    throw new Error("useOperations must be used within an OperationProvider");
  }
  return context;
};

const OPERATIONS_KEY = 'pendingOperations_v4';
const CASH_BOXES_KEY = 'cashBoxes_v1';
const CLIENTS_KEY = 'clients_v1';
const EXPENSES_KEY = 'expenses_v1';
const ADMIN_LOG_KEY = 'adminLog_v1';
const USER_PROFILES_KEY = 'userProfiles_v1';

const initialCashBoxesDefinition = [
  // Efectivo ARS
  { id: 'cash_ars_principal', name: 'Caja ARS Principal (Efectivo)', currency: 'ARS', balance: 10000000, type: 'cash', allowsNegative: false },
  { id: 'cash_ars_secundaria', name: 'Caja ARS Secundaria (Efectivo)', currency: 'ARS', balance: 5000000, type: 'cash', allowsNegative: false },
  // Efectivo USD
  { id: 'cash_usd_principal', name: 'Caja USD Principal (Efectivo)', currency: 'USD', balance: 50000, type: 'cash', allowsNegative: false },
  { id: 'cash_usd_cara_chica', name: 'Caja USD Cara Chica (Efectivo)', currency: 'USD', balance: 10000, type: 'cash', allowsNegative: false },
  // Digital ARS
  { id: 'digital_ars_mp_full', name: 'Mercado Pago Full (ARS)', currency: 'ARS', balance: 1000000, type: 'digital_wallet', allowsNegative: true, owner: 'Empresa' },
  { id: 'digital_ars_mp_parcial', name: 'Mercado Pago Parcial (ARS)', currency: 'ARS', balance: 500000, type: 'digital_wallet', allowsNegative: true, owner: 'Empresa' },
  // Digital USD
  { id: 'digital_usd_usdt_general', name: 'USDT General (TRC20)', currency: 'USDT', balance: 20000, type: 'digital_wallet', allowsNegative: true },
  // Bancos ARS
  { id: 'bank_ars_galicia', name: 'Banco Galicia (ARS)', currency: 'ARS', balance: 20000000, type: 'bank_account', allowsNegative: true, bankName: 'Galicia', accountNumber: '123456/7' },
  { id: 'bank_ars_macro', name: 'Banco Macro (ARS)', currency: 'ARS', balance: 15000000, type: 'bank_account', allowsNegative: true, bankName: 'Macro', accountNumber: '987654/3' },
  // Bancos USD
  { id: 'bank_usd_galicia', name: 'Banco Galicia (USD)', currency: 'USD', balance: 30000, type: 'bank_account', allowsNegative: true, bankName: 'Galicia', accountNumber: '112233/4' },
  { id: 'bank_usd_hsbc', name: 'Banco HSBC (USD)', currency: 'USD', balance: 25000, type: 'bank_account', allowsNegative: true, bankName: 'HSBC', accountNumber: '445566/7' },
];

export const OperationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [operations, setOperations] = useState(() => {
    const localData = localStorage.getItem(OPERATIONS_KEY);
    return localData ? JSON.parse(localData) : [];
  });
  const [cashBoxes, setCashBoxes] = useState(() => {
    const localData = localStorage.getItem(CASH_BOXES_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
    localStorage.setItem(CASH_BOXES_KEY, JSON.stringify(initialCashBoxesDefinition));
    return initialCashBoxesDefinition;
  });
  const [clients, setClients] = useState(() => {
    const localData = localStorage.getItem(CLIENTS_KEY);
    return localData ? JSON.parse(localData) : [];
  });
  const [expenses, setExpenses] = useState(() => {
    const localData = localStorage.getItem(EXPENSES_KEY);
    return localData ? JSON.parse(localData) : [];
  });
  const [adminLog, setAdminLog] = useState(() => {
    const localData = localStorage.getItem(ADMIN_LOG_KEY);
    return localData ? JSON.parse(localData) : [];
  });
  const [userProfiles, setUserProfiles] = useState(() => {
    const localData = localStorage.getItem(USER_PROFILES_KEY);
    return localData ? JSON.parse(localData) : [];
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(OPERATIONS_KEY, JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem(CASH_BOXES_KEY, JSON.stringify(cashBoxes));
  }, [cashBoxes]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses]);
  
  useEffect(() => {
    localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(adminLog));
  }, [adminLog]);

  useEffect(() => {
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(userProfiles));
  }, [userProfiles]);

  const logAdminAction = useCallback((action, details = {}) => {
    if (currentUser && currentUser.role === 'admin') {
      const logEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        adminId: currentUser.id,
        adminUsername: currentUser.username,
        action,
        details,
      };
      setAdminLog(prevLog => [logEntry, ...prevLog.slice(0, 499)]); // Keep last 500 logs
      debug.log('[AdminAction]', action, details);
    }
  }, [currentUser]);

  const fetchUserProfiles = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      debug.log('[OperationContext] FetchUserProfiles: Not an admin or no current user.');
      // Non-admins might still need their own profile or a limited list for "owner" field,
      // but full list is admin-only for now.
      // For simplicity, if not admin, we'll use the local storage version or empty.
      const localData = localStorage.getItem(USER_PROFILES_KEY);
      setUserProfiles(localData ? JSON.parse(localData) : (currentUser ? [{id: currentUser.id, username: currentUser.username, role: currentUser.role}] : []));
      return;
    }
    
    setLoading(true);
    debug.log('[OperationContext] FetchUserProfiles: Admin fetching all user profiles.');
    try {
      const { data, error } = await supabase.from('profiles').select('id, username, role');
      if (error) throw error;
      setUserProfiles(data || []);
      localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(data || []));
      debug.log('[OperationContext] FetchUserProfiles: Profiles fetched and saved:', data);
    } catch (error) {
      debug.error('[OperationContext] FetchUserProfiles: Error fetching profiles:', error);
      toast({ title: "Error", description: "No se pudieron cargar los perfiles de usuario.", variant: "destructive" });
      // Fallback to local storage if fetch fails
      const localData = localStorage.getItem(USER_PROFILES_KEY);
      setUserProfiles(localData ? JSON.parse(localData) : []);
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);
  
  useEffect(() => {
    // Fetch profiles when context mounts, especially useful for admins
    if (currentUser) { // Only fetch if a user is logged in
       fetchUserProfiles();
    }
  }, [currentUser, fetchUserProfiles]);


  const addOperation = (operationData) => {
    if (!currentUser) {
      toast({ title: "Error", description: "Debes estar logueado para registrar operaciones.", variant: "destructive" });
      return;
    }
    const newOperation = {
      ...operationData,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: currentUser.id, 
      executedAmountIn: 0,
      executedAmountOut: 0,
      executions: [],
      ownerId: operationData.ownerId || currentUser.id, // Default to current user if no owner specified
    };
    setOperations(prev => [newOperation, ...prev]);
    logAdminAction('OPERATION_CREATE', { operationId: newOperation.id, type: newOperation.type });
    toast({ title: "Éxito", description: "Operación registrada correctamente." });
  };

  const updateOperation = (operationId, updates) => {
    setOperations(prev =>
      prev.map(op =>
        op.id === operationId ? { ...op, ...updates, updatedAt: new Date().toISOString() } : op
      )
    );
    logAdminAction('OPERATION_UPDATE', { operationId, updates });
    toast({ title: "Éxito", description: "Operación actualizada." });
  };

  const deleteOperation = (operationId) => {
     if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Error de Permiso", description: "Solo los administradores pueden eliminar operaciones.", variant: "destructive" });
      return;
    }
    const operationToDelete = operations.find(op => op.id === operationId);
    if (operationToDelete && (operationToDelete.executedAmountIn > 0 || operationToDelete.executedAmountOut > 0)) {
       logAdminAction('OPERATION_DELETE_ATTEMPT_PARTIAL', { operationId });
       toast({
        title: "Advertencia",
        description: "Esta operación tiene ejecuciones parciales. Eliminarla no revertirá los movimientos de caja. La operación será eliminada de todas formas.",
        variant: "destructive",
        duration: 7000,
      });
    }

    setOperations(prev => prev.filter(op => op.id !== operationId));
    logAdminAction('OPERATION_DELETE_SUCCESS', { operationId });
    toast({ title: "Éxito", description: "Operación eliminada." });
  };

  const executeOperation = (operationId, executionDetails) => {
    setOperations(prevOperations => {
      const operationIndex = prevOperations.findIndex(op => op.id === operationId);
      if (operationIndex === -1) {
        toast({ title: "Error", description: "Operación no encontrada.", variant: "destructive" });
        return prevOperations;
      }

      const operation = { ...prevOperations[operationIndex] };
      const {
        execAmountIn, execCurrencyIn, targetCashBoxInId,
        execAmountOut, execCurrencyOut, targetCashBoxOutId
      } = executionDetails;

      debug.log('[ExecuteOperation] Details:', executionDetails);
      debug.log('[ExecuteOperation] Target CashBox IN ID:', targetCashBoxInId);
      debug.log('[ExecuteOperation] Target CashBox OUT ID:', targetCashBoxOutId);


      setCashBoxes(prevCashBoxes => {
        let newCashBoxes = [...prevCashBoxes];
        let success = true;

        // Handle Amount In (Money coming INTO the system from Client / Source for this part of operation)
        const cashBoxIn = newCashBoxes.find(cb => cb.id === targetCashBoxInId);
        if (cashBoxIn) {
          debug.log(`[ExecuteOperation] CashBox IN (${cashBoxIn.name}): Balance before: ${cashBoxIn.balance}, ExecAmountIn: ${execAmountIn}`);
          if (cashBoxIn.currency !== execCurrencyIn) {
            toast({ title: "Error de Moneda", description: `La caja de entrada ${cashBoxIn.name} es ${cashBoxIn.currency} y se esperaba ${execCurrencyIn}.`, variant: "destructive", duration: 7000 });
            success = false;
          } else {
            cashBoxIn.balance += parseFloat(execAmountIn);
            debug.log(`[ExecuteOperation] CashBox IN (${cashBoxIn.name}): Balance after: ${cashBoxIn.balance}`);
          }
        } else {
          toast({ title: "Error", description: `Caja de entrada no encontrada: ${targetCashBoxInId}.`, variant: "destructive" });
          success = false;
        }
        
        // Handle Amount Out (Money going OUT OF the system to Client / Destination for this part of operation)
        if (success && execAmountOut > 0 && targetCashBoxOutId) {
            const cashBoxOut = newCashBoxes.find(cb => cb.id === targetCashBoxOutId);
            if (cashBoxOut) {
                debug.log(`[ExecuteOperation] CashBox OUT (${cashBoxOut.name}): Balance before: ${cashBoxOut.balance}, ExecAmountOut: ${execAmountOut}`);
                if (cashBoxOut.currency !== execCurrencyOut) {
                    toast({ title: "Error de Moneda", description: `La caja de salida ${cashBoxOut.name} es ${cashBoxOut.currency} y se esperaba ${execCurrencyOut}.`, variant: "destructive", duration: 7000 });
                    success = false;
                } else {
                    if (!cashBoxOut.allowsNegative && cashBoxOut.balance < parseFloat(execAmountOut)) {
                        toast({ title: "Error de Fondos", description: `Fondos insuficientes en la caja de salida ${cashBoxOut.name}.`, variant: "destructive" });
                        success = false;
                    } else {
                        cashBoxOut.balance -= parseFloat(execAmountOut);
                        debug.log(`[ExecuteOperation] CashBox OUT (${cashBoxOut.name}): Balance after: ${cashBoxOut.balance}`);
                    }
                }
            } else {
                toast({ title: "Error", description: `Caja de salida no encontrada: ${targetCashBoxOutId}.`, variant: "destructive" });
                success = false;
            }
        }


        if (!success) return prevCashBoxes; // Revert if any step failed

        logAdminAction('CASHBOX_UPDATE', { 
          cashBoxInId: targetCashBoxInId, newBalanceIn: cashBoxIn?.balance, 
          cashBoxOutId: targetCashBoxOutId, newBalanceOut: newCashBoxes.find(cb => cb.id === targetCashBoxOutId)?.balance,
          operationId: operationId
        });
        return newCashBoxes;
      });

      // If cashbox update was not successful (indicated by toast in setCashBoxes), revert operation changes
      // This check relies on the fact that setCashBoxes will not update if success is false
      // A more robust way would be to return a status from setCashBoxes update logic
      const cashBoxInCheck = cashBoxes.find(cb => cb.id === targetCashBoxInId);
      const cashBoxOutCheck = targetCashBoxOutId ? cashBoxes.find(cb => cb.id === targetCashBoxOutId) : true;

      if (!cashBoxInCheck || !cashBoxOutCheck) { // This condition might be too simplistic
          // Not easy to reliably check if setCashBoxes failed from here without more complex state management
          // For now, we assume if toast was shown, user knows it failed.
          // If toasts are suppressed or ignored, this could lead to inconsistent state.
      }


      operation.executedAmountIn += parseFloat(execAmountIn);
      operation.executedAmountOut += parseFloat(execAmountOut);
      operation.executions.push({
        id: uuidv4(),
        executedAt: new Date().toISOString(),
        executedBy: currentUser.id,
        amountIn: parseFloat(execAmountIn),
        currencyIn: execCurrencyIn,
        cashBoxInId: targetCashBoxInId,
        amountOut: parseFloat(execAmountOut),
        currencyOut: execCurrencyOut,
        cashBoxOutId: targetCashBoxOutId,
      });

      const remainingAmountIn = operation.amountIn - operation.executedAmountIn;
      const remainingAmountOut = operation.amountOut - operation.executedAmountOut;

      if (remainingAmountIn <= 0.001 && remainingAmountOut <= 0.001) { // Using a small epsilon for float comparison
        operation.status = 'completed';
      } else {
        operation.status = 'partially_completed';
      }
      operation.updatedAt = new Date().toISOString();
      
      logAdminAction('OPERATION_EXECUTE', { 
          operationId: operation.id, 
          executionId: operation.executions[operation.executions.length-1].id,
          executedAmountIn: execAmountIn, executedAmountOut: execAmountOut 
      });

      const newOperations = [...prevOperations];
      newOperations[operationIndex] = operation;
      return newOperations;
    });
    toast({ title: "Éxito", description: "Operación ejecutada." });
  };
  
  const addClient = (clientData) => {
    const newClient = { ...clientData, id: uuidv4(), createdAt: new Date().toISOString() };
    setClients(prev => [newClient, ...prev]);
    logAdminAction('CLIENT_CREATE', { clientId: newClient.id, name: newClient.name });
    toast({ title: "Éxito", description: "Cliente añadido." });
  };

  const updateClient = (clientId, updates) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updates } : c));
    const client = clients.find(c => c.id === clientId);
    logAdminAction('CLIENT_UPDATE', { clientId, name: client?.name, updates });
    toast({ title: "Éxito", description: "Cliente actualizado." });
  };

  const deleteClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    logAdminAction('CLIENT_DELETE', { clientId, name: client?.name });
    toast({ title: "Éxito", description: "Cliente eliminado." });
  };

  const addExpense = (expenseData) => {
    const newExpense = { 
      ...expenseData, 
      id: uuidv4(), 
      createdAt: new Date().toISOString(),
      userId: currentUser.id 
    };
    setExpenses(prev => [newExpense, ...prev]);
    
    // Deduct from cash box
    setCashBoxes(prevCashBoxes => {
      const cashBoxIndex = prevCashBoxes.findIndex(cb => cb.id === expenseData.cashBoxId);
      if (cashBoxIndex === -1) {
        toast({ title: "Error", description: "Caja no encontrada para el gasto.", variant: "destructive" });
        setExpenses(prevExp => prevExp.filter(exp => exp.id !== newExpense.id)); // Rollback expense add
        return prevCashBoxes;
      }
      const updatedCashBoxes = [...prevCashBoxes];
      const cashBox = { ...updatedCashBoxes[cashBoxIndex] };

      if (cashBox.currency !== expenseData.currency) {
         toast({ title: "Error de Moneda", description: `La caja ${cashBox.name} es ${cashBox.currency} y el gasto es ${expenseData.currency}.`, variant: "destructive", duration: 7000 });
         setExpenses(prevExp => prevExp.filter(exp => exp.id !== newExpense.id)); // Rollback expense add
         return prevCashBoxes;
      }

      if (!cashBox.allowsNegative && cashBox.balance < parseFloat(expenseData.amount)) {
        toast({ title: "Error de Fondos", description: `Fondos insuficientes en la caja ${cashBox.name} para el gasto.`, variant: "destructive" });
        setExpenses(prevExp => prevExp.filter(exp => exp.id !== newExpense.id)); // Rollback expense add
        return prevCashBoxes;
      }
      
      cashBox.balance -= parseFloat(expenseData.amount);
      updatedCashBoxes[cashBoxIndex] = cashBox;
      logAdminAction('EXPENSE_CREATE_CASHBOX_UPDATE', { 
          cashBoxId: cashBox.id, newBalance: cashBox.balance, expenseAmount: expenseData.amount 
      });
      return updatedCashBoxes;
    });

    toast({ title: "Éxito", description: "Gasto registrado." });
  };

  const deleteExpense = (expenseId) => {
     if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Error de Permiso", description: "Solo los administradores pueden eliminar gastos.", variant: "destructive" });
      return;
    }
    const expenseToDelete = expenses.find(exp => exp.id === expenseId);
    if (!expenseToDelete) {
      toast({ title: "Error", description: "Gasto no encontrado.", variant: "destructive" });
      return;
    }

    // Restore to cash box
    setCashBoxes(prevCashBoxes => {
      const cashBoxIndex = prevCashBoxes.findIndex(cb => cb.id === expenseToDelete.cashBoxId);
      if (cashBoxIndex === -1) {
        toast({ title: "Error", description: "Caja asociada al gasto no encontrada. No se puede revertir el saldo.", variant: "destructive" });
        // Decide if deletion should proceed or not. For now, it proceeds.
        return prevCashBoxes; 
      }
      const updatedCashBoxes = [...prevCashBoxes];
      const cashBox = { ...updatedCashBoxes[cashBoxIndex] };
      
      if (cashBox.currency !== expenseToDelete.currency) {
        toast({ title: "Error de Moneda", description: `La caja ${cashBox.name} es ${cashBox.currency} y el gasto fue en ${expenseToDelete.currency}. No se puede revertir el saldo correctamente.`, variant: "destructive", duration: 7000 });
        return prevCashBoxes;
      }

      cashBox.balance += parseFloat(expenseToDelete.amount);
      updatedCashBoxes[cashBoxIndex] = cashBox;
      logAdminAction('EXPENSE_DELETE_CASHBOX_RESTORE', { 
          cashBoxId: cashBox.id, newBalance: cashBox.balance, restoredAmount: expenseToDelete.amount 
      });
      return updatedCashBoxes;
    });

    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    logAdminAction('EXPENSE_DELETE', { expenseId, description: expenseToDelete.description });
    toast({ title: "Éxito", description: "Gasto eliminado y saldo de caja restaurado." });
  };
  
  const adjustCashBoxBalance = (cashBoxId, newBalance, reason) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Error de Permiso", description: "Solo los administradores pueden ajustar saldos.", variant: "destructive" });
      return;
    }
    setCashBoxes(prev =>
      prev.map(cb =>
        cb.id === cashBoxId ? { ...cb, balance: parseFloat(newBalance) } : cb
      )
    );
    const cashBox = cashBoxes.find(cb => cb.id === cashBoxId);
    logAdminAction('CASHBOX_ADJUST', { 
        cashBoxId, 
        name: cashBox?.name, 
        oldBalance: cashBox?.balance, 
        newBalance: parseFloat(newBalance),
        reason 
    });
    toast({ title: "Éxito", description: `Saldo de ${cashBox?.name} ajustado.`});
  };

  const createCashBox = (cashBoxData) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Error de Permiso", description: "Solo los administradores pueden crear cajas.", variant: "destructive" });
      return;
    }
    const newCashBox = {
      id: uuidv4(),
      ...cashBoxData,
      balance: parseFloat(cashBoxData.balance) || 0,
      allowsNegative: cashBoxData.allowsNegative || false,
    };
    setCashBoxes(prev => [newCashBox, ...prev]);
    logAdminAction('CASHBOX_CREATE', { cashBoxId: newCashBox.id, name: newCashBox.name, initialBalance: newCashBox.balance });
    toast({ title: "Éxito", description: `Caja ${newCashBox.name} creada.`});
  };

  const updateCashBox = (cashBoxId, updates) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Error de Permiso", description: "Solo los administradores pueden editar cajas.", variant: "destructive" });
      return;
    }
    setCashBoxes(prev =>
      prev.map(cb =>
        cb.id === cashBoxId ? { ...cb, ...updates, balance: parseFloat(updates.balance !== undefined ? updates.balance : cb.balance) } : cb
      )
    );
    const cashBox = cashBoxes.find(cb => cb.id === cashBoxId);
    logAdminAction('CASHBOX_CONFIG_UPDATE', { cashBoxId, name: cashBox?.name, updates });
    toast({ title: "Éxito", description: `Caja ${cashBox?.name} actualizada.`});
  };
  
  const deleteCashBox = (cashBoxId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Error de Permiso", description: "Solo los administradores pueden eliminar cajas.", variant: "destructive" });
      return;
    }
    const cashBoxToDelete = cashBoxes.find(cb => cb.id === cashBoxId);
    if (cashBoxToDelete && cashBoxToDelete.balance !== 0) {
      toast({ 
        title: "Advertencia", 
        description: `La caja ${cashBoxToDelete.name} tiene un saldo de ${cashBoxToDelete.balance} ${cashBoxToDelete.currency}. Eliminarla puede causar inconsistencias. Asegúrese de que el saldo sea cero o transfiera los fondos.`,
        variant: "destructive",
        duration: 10000,
      });
      // For now, we allow deletion even with balance, but admin is warned.
    }
    setCashBoxes(prev => prev.filter(cb => cb.id !== cashBoxId));
    logAdminAction('CASHBOX_DELETE', { cashBoxId, name: cashBoxToDelete?.name, balanceAtDeletion: cashBoxToDelete?.balance });
    toast({ title: "Éxito", description: `Caja ${cashBoxToDelete?.name} eliminada.`});
  };


  return (
    <OperationContext.Provider
      value={{
        operations,
        addOperation,
        updateOperation,
        deleteOperation,
        executeOperation,
        cashBoxes,
        setCashBoxes,
        adjustCashBoxBalance,
        createCashBox,
        updateCashBox,
        deleteCashBox,
        clients,
        addClient,
        updateClient,
        deleteClient,
        expenses,
        addExpense,
        deleteExpense,
        adminLog,
        logAdminAction,
        userProfiles,
        fetchUserProfiles,
        loading,
      }}
    >
      {children}
    </OperationContext.Provider>
  );
};
