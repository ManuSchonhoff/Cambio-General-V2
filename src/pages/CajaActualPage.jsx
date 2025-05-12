
import React from 'react';
import { motion } from 'framer-motion';
import { useAccounting } from '@/context/AccountingContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Landmark, DollarSign } from 'lucide-react';

const CajaActualPage = () => {
  const { cashBox } = useAccounting();

  const formatCurrency = (amount, currency = 'ARS') => {
      const locale = currency === 'ARS' ? 'es-AR' : 'en-US';
      return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
  }

  const balances = [
      { name: 'Pesos (ARS)', value: cashBox.pesos, currency: 'ARS', icon: <DollarSign className="h-6 w-6 text-green-500" /> },
      { name: 'Dólares (USD)', value: cashBox.usd, currency: 'USD', icon: <DollarSign className="h-6 w-6 text-blue-500" /> },
      { name: 'Cuenta Digital 1', value: cashBox.digital1 || 0, currency: 'USD', icon: <Landmark className="h-6 w-6 text-purple-500" /> },
      { name: 'Cuenta Digital 2', value: cashBox.digital2 || 0, currency: 'USD', icon: <Landmark className="h-6 w-6 text-indigo-500" /> },
      // Add more accounts as needed from cashBox state
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Estado de Caja Actual
          </CardTitle>
          <CardDescription>Saldos disponibles en las diferentes monedas y cuentas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((balance, index) => (
               <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
               >
                  <Card className="flex flex-col justify-between h-full border hover:shadow-sm transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{balance.name}</CardTitle>
                          {balance.icon}
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(balance.value, balance.currency)}</div>
                           {/* Optionally add a small description or trend */}
                          {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
                      </CardContent>
                  </Card>
               </motion.div>
            ))}
          </div>
           <div className="mt-8 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-2">Resumen Total Estimado (USD)</h3>
                {/* Basic estimation - improve with real-time rates if needed */}
                 <p className="text-3xl font-bold text-primary">
                    {/* Example: Assuming a fixed rate for pesos for summary */}
                    {/* {formatCurrency(cashBox.usd + (cashBox.pesos / 1000) + cashBox.digital1 + cashBox.digital2, 'USD')} */}
                    Calculando... (Necesita cotización actual)
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">Este es un valor estimado y puede variar.</p>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CajaActualPage;
