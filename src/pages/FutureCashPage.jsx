
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Banknote, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const FutureCashPage = () => {
  const { cashBoxes, pendingOperations } = useOperations();

  const excludedBoxNames = ['USD Efectivo (Feos)', 'USD Efectivo (Cara Chica)'];

  const relevantCashBalances = useMemo(() => {
    const balances = {
      USD: { current: 0, futureInflow: 0, futureOutflow: 0 },
      ARS: { current: 0, futureInflow: 0, futureOutflow: 0 },
    };

    cashBoxes.forEach(cb => {
      if (cb.type === 'cash' && !excludedBoxNames.includes(cb.name)) {
        if (cb.currency === 'USD') {
          balances.USD.current += cb.balance;
        } else if (cb.currency === 'ARS') {
          balances.ARS.current += cb.balance;
        }
      }
    });

    pendingOperations.forEach(op => {
      const isCompra = op.type.startsWith('compra_');
      
      const nominalAmountIn = op.remainingAmountIn || 0;
      const nominalCurrencyIn = op.currencyIn;
      const nominalAmountOut = op.remainingAmountOut || 0;
      const nominalCurrencyOut = op.currencyOut;

      // Determine conceptual inflow/outflow based on operation type
      let conceptualInflowAmount = 0;
      let conceptualInflowCurrency = '';
      let conceptualOutflowAmount = 0;
      let conceptualOutflowCurrency = '';

      if (isCompra) {
        conceptualInflowAmount = nominalAmountOut; // e.g., USD bought
        conceptualInflowCurrency = nominalCurrencyOut;
        conceptualOutflowAmount = nominalAmountIn; // e.g., ARS paid
        conceptualOutflowCurrency = nominalCurrencyIn;
      } else { // Venta, Gasto, Ingreso, etc.
        conceptualInflowAmount = nominalAmountIn;
        conceptualInflowCurrency = nominalCurrencyIn;
        conceptualOutflowAmount = nominalAmountOut;
        conceptualOutflowCurrency = nominalCurrencyOut;
      }
      
      // Accumulate for USD
      if (conceptualInflowCurrency === 'USD') {
        balances.USD.futureInflow += conceptualInflowAmount;
      }
      if (conceptualOutflowCurrency === 'USD') {
        balances.USD.futureOutflow += conceptualOutflowAmount;
      }

      // Accumulate for ARS
      if (conceptualInflowCurrency === 'ARS') {
        balances.ARS.futureInflow += conceptualInflowAmount;
      }
      if (conceptualOutflowCurrency === 'ARS') {
        balances.ARS.futureOutflow += conceptualOutflowAmount;
      }
    });
    
    balances.USD.future = balances.USD.current + balances.USD.futureInflow - balances.USD.futureOutflow;
    balances.ARS.future = balances.ARS.current + balances.ARS.futureInflow - balances.ARS.futureOutflow;

    return balances;
  }, [cashBoxes, pendingOperations]);


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-blue-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-blue-600">
            <TrendingUp className="h-8 w-8" /> Proyección de Caja Futura (Efectivo Principal)
          </CardTitle>
          <CardDescription>
            Estimación de los saldos totales de <span className="font-semibold">efectivo principal (USD y ARS)</span> si todas las operaciones pendientes se ejecutaran.
            Se excluyen cajas como "USD Feos" y "USD Cara Chica".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl"><DollarSign /> Saldos Totales USD (Efectivo Principal)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-lg">
                        <p>Actual: <span className="font-semibold block text-2xl">{formatCurrency(relevantCashBalances.USD.current, "USD")}</span></p>
                        <p className="text-sky-200">Entradas Pendientes: <span className="font-medium">{formatCurrency(relevantCashBalances.USD.futureInflow, "USD")}</span></p>
                        <p className="text-sky-200">Salidas Pendientes: <span className="font-medium">{formatCurrency(relevantCashBalances.USD.futureOutflow, "USD")}</span></p>
                        <hr className="border-sky-400 my-2"/>
                        <p className="text-xl">Futuro Estimado: <span className="font-bold block text-3xl">{formatCurrency(relevantCashBalances.USD.future, "USD")}</span></p>
                         {relevantCashBalances.USD.future < 0 && (
                            <p className="text-sm mt-2 text-yellow-300 flex items-center gap-1"><AlertTriangle size={16}/>¡Atención! Saldo USD futuro negativo.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-600 to-green-500 text-white shadow-xl">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl"><Banknote /> Saldos Totales ARS (Efectivo Principal)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-lg">
                        <p>Actual: <span className="font-semibold block text-2xl">{formatCurrency(relevantCashBalances.ARS.current, "ARS")}</span></p>
                        <p className="text-emerald-200">Entradas Pendientes: <span className="font-medium">{formatCurrency(relevantCashBalances.ARS.futureInflow, "ARS")}</span></p>
                        <p className="text-emerald-200">Salidas Pendientes: <span className="font-medium">{formatCurrency(relevantCashBalances.ARS.futureOutflow, "ARS")}</span></p>
                        <hr className="border-emerald-400 my-2"/>
                        <p className="text-xl">Futuro Estimado: <span className="font-bold block text-3xl">{formatCurrency(relevantCashBalances.ARS.future, "ARS")}</span></p>
                        {relevantCashBalances.ARS.future < 0 && (
                            <p className="text-sm mt-2 text-yellow-300 flex items-center gap-1"><AlertTriangle size={16}/>¡Atención! Saldo ARS futuro negativo.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            {pendingOperations.length === 0 && (
                 <div className="text-center py-10 text-muted-foreground">
                    <Info className="mx-auto h-12 w-12 mb-4 text-slate-400" />
                    <p className="text-xl font-semibold">No hay operaciones pendientes.</p>
                    <p>La proyección de caja futura coincide con los saldos actuales.</p>
                </div>
            )}

           <CardDescription className="pt-4 text-xs text-center">
              Nota: Esta es una proyección agregada basada en los montos pendientes totales de las operaciones para las monedas USD y ARS en cajas de efectivo principal.
              No considera la secuencia de ejecución ni a qué caja específica se asignarán los fondos al ejecutar.
            </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FutureCashPage;
