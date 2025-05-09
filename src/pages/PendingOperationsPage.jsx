
import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumberForDisplay, parseFormattedNumber } from '@/lib/utils';
import { CheckCircle, Edit3, AlertTriangle, Info, ListFilter, RefreshCw, Send, CalendarClock as ClockHistory } from 'lucide-react'; // Added ClockHistory
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import FormattedInput from '@/components/FormattedInput.jsx';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const operationTypeLabels = {
  "caja_chica": "Mov. Caja Chica",
  "sueldos": "Sueldos",
  "gastos_varios": "Gastos Varios",
  "costos_fijos": "Costos Fijos",
  "prestamo_otorgado": "Préstamo Otorgado",
  "prestamo_recibido": "Préstamo Recibido",
  "comision_ganada": "Comisión Ganada",
  "comision_pagada": "Comisión Pagada",
  "pago_deuda": "Pago Deuda",
  "cobro_deuda": "Cobro Deuda",
  "inversion_realizada": "Inversión Realizada",
  "inversion_retorno": "Retorno Inversión",
  "dividendos_pagados": "Dividendos Pagados",
  "dividendos_recibidos": "Dividendos Recibidos",
  "compra_venta_divisa": "Compra/Venta Divisa",
  "aporte_capital": "Aporte de Capital",
  "retiro_capital": "Retiro de Capital",
  "otro_ingreso": "Otro Ingreso",
  "otro_egreso": "Otro Egreso",
};

const cashBoxesDefinition = [
  { id: "ars_efectivo", name: "ARS Efectivo", currency: "ARS" },
  { id: "usd_efectivo", name: "USD Efectivo (Nuevos)", currency: "USD" },
  { id: "usd_efectivo_feos", name: "USD Efectivo (Feos)", currency: "USD" },
  { id: "usd_efectivo_cara_chica", name: "USD Efectivo (Cara Chica)", currency: "USD" },
  { id: "eur_efectivo", name: "EUR Efectivo", currency: "EUR" },
  { id: "usdt_billetera", name: "USDT Billetera", currency: "USDT" },
];

const ExecuteOperationModal = ({ operation, onExecute, onCancel }) => {
  const { toast } = useToast();
  const [execAmountIn, setExecAmountIn] = useState(null);
  const [execCurrencyIn, setExecCurrencyIn] = useState(operation.currencyIn || '');
  const [execAmountOut, setExecAmountOut] = useState(null);
  const [execCurrencyOut, setExecCurrencyOut] = useState(operation.currencyOut || '');
  const [execRate, setExecRate] = useState(operation.rate || null);
  const [targetCashBoxIn, setTargetCashBoxIn] = useState(operation.currencyIn ? cashBoxesDefinition.find(cb => cb.currency === operation.currencyIn)?.id || '' : '');
  const [targetCashBoxOut, setTargetCashBoxOut] = useState(operation.currencyOut ? cashBoxesDefinition.find(cb => cb.currency === operation.currencyOut)?.id || '' : '');

  const remainingIn = operation.remainingAmountIn || 0;
  const remainingOut = operation.remainingAmountOut || 0;

  useEffect(() => {
    if (remainingIn > 0.001) setExecAmountIn(remainingIn); else setExecAmountIn(null);
    if (remainingOut > 0.001) setExecAmountOut(remainingOut); else setExecAmountOut(null);
    if (operation.rate) setExecRate(operation.rate); else setExecRate(null);

    if (operation.currencyIn) {
        const defaultBoxIn = cashBoxesDefinition.find(cb => cb.currency === operation.currencyIn && cb.id.includes("efectivo") && !cb.id.includes("feos") && !cb.id.includes("cara_chica"));
        setTargetCashBoxIn(defaultBoxIn ? defaultBoxIn.id : (cashBoxesDefinition.find(cb => cb.currency === operation.currencyIn)?.id || ''));
    }
     if (operation.currencyOut) {
        const defaultBoxOut = cashBoxesDefinition.find(cb => cb.currency === operation.currencyOut && cb.id.includes("efectivo") && !cb.id.includes("feos") && !cb.id.includes("cara_chica"));
        setTargetCashBoxOut(defaultBoxOut ? defaultBoxOut.id : (cashBoxesDefinition.find(cb => cb.currency === operation.currencyOut)?.id || ''));
    }


  }, [operation, remainingIn, remainingOut]);


  const handleExecute = () => {
    const parsedExecAmountIn = execAmountIn !== null ? Number(execAmountIn) : 0;
    const parsedExecAmountOut = execAmountOut !== null ? Number(execAmountOut) : 0;

    if (parsedExecAmountIn === 0 && parsedExecAmountOut === 0) {
      toast({ title: "Error", description: "Debe ingresar al menos un monto a ejecutar.", variant: "destructive" });
      return;
    }
    if (parsedExecAmountIn < 0 || parsedExecAmountOut < 0) {
      toast({ title: "Error", description: "Los montos no pueden ser negativos.", variant: "destructive" });
      return;
    }
    if (parsedExecAmountIn > remainingIn + 0.001 || parsedExecAmountOut > remainingOut + 0.001) {
      toast({ title: "Error", description: "No puede ejecutar más de lo pendiente.", variant: "destructive" });
      return;
    }
    if ((parsedExecAmountIn > 0 && !targetCashBoxIn && operation.currencyIn) || (parsedExecAmountOut > 0 && !targetCashBoxOut && operation.currencyOut)) {
        toast({ title: "Error", description: "Debe seleccionar una caja de destino/origen si hay montos.", variant: "destructive" });
        return;
    }

    onExecute({
      amountIn: parsedExecAmountIn,
      currencyIn: execCurrencyIn,
      amountOut: parsedExecAmountOut,
      currencyOut: execCurrencyOut,
      rate: execRate ? Number(execRate) : null,
      targetCashBoxInId: targetCashBoxIn,
      targetCashBoxOutId: targetCashBoxOut,
    });
  };
  
  const relevantCashBoxesIn = useMemo(() => cashBoxesDefinition.filter(cb => cb.currency === operation.currencyIn), [operation.currencyIn]);
  const relevantCashBoxesOut = useMemo(() => cashBoxesDefinition.filter(cb => cb.currency === operation.currencyOut), [operation.currencyOut]);

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Ejecutar Operación: {operationTypeLabels[operation.type]}</AlertDialogTitle>
        <AlertDialogDescription>
          Ingrese los montos que se están ejecutando ahora. Esto impactará la caja.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-4 py-4">
        {operation.amountIn > 0 && (
          <div className="space-y-2">
            <Label>Monto Entrada a Ejecutar ({operation.currencyIn}) - Pendiente: {formatNumberForDisplay(remainingIn)}</Label>
            <FormattedInput 
              value={execAmountIn} 
              onChange={(e) => setExecAmountIn(e.target.value)} 
              placeholder={`Máx. ${formatNumberForDisplay(remainingIn)}`}
            />
            <Label>Caja Destino Entrada</Label>
            <Select value={targetCashBoxIn} onValueChange={setTargetCashBoxIn}>
                <SelectTrigger><SelectValue placeholder="Seleccionar caja..." /></SelectTrigger>
                <SelectContent>
                    {relevantCashBoxesIn.map(cb => <SelectItem key={cb.id} value={cb.id}>{cb.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        )}
        {operation.amountOut > 0 && (
          <div className="space-y-2">
            <Label>Monto Salida a Ejecutar ({operation.currencyOut}) - Pendiente: {formatNumberForDisplay(remainingOut)}</Label>
            <FormattedInput 
              value={execAmountOut} 
              onChange={(e) => setExecAmountOut(e.target.value)} 
              placeholder={`Máx. ${formatNumberForDisplay(remainingOut)}`}
            />
            <Label>Caja Origen Salida</Label>
             <Select value={targetCashBoxOut} onValueChange={setTargetCashBoxOut}>
                <SelectTrigger><SelectValue placeholder="Seleccionar caja..." /></SelectTrigger>
                <SelectContent>
                    {relevantCashBoxesOut.map(cb => <SelectItem key={cb.id} value={cb.id}>{cb.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        )}
        {operation.type === "compra_venta_divisa" && (
            <div className="space-y-2">
                <Label>Cotización Aplicada</Label>
                <FormattedInput value={execRate} onChange={(e) => setExecRate(e.target.value)} placeholder="Cotización"/>
            </div>
        )}
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={handleExecute}>
          <Send className="mr-2 h-4 w-4" /> Ejecutar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};


const PendingOperationsPage = () => {
  const { pendingOperations, executeOperation, clients } = useOperations();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenExecuteModal = (op) => {
    setSelectedOperation(op);
    setIsModalOpen(true);
  };

  const handleExecute = (executionData) => {
    if (!selectedOperation) return;
    try {
      executeOperation(selectedOperation.id, executionData);
      toast({ title: "Éxito", description: "Operación ejecutada parcialmente/totalmente.", icon: <CheckCircle /> });
      setIsModalOpen(false);
      setSelectedOperation(null);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const getClientName = (clientId) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Desconocido';
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'default'; 
      case 'partial': return 'secondary'; 
      default: return 'outline';
    }
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-amber-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-amber-600">
            <ClockHistory className="h-8 w-8" /> Operaciones Pendientes
          </CardTitle>
          <CardDescription>Operaciones registradas que aún no se han completado o están parcialmente ejecutadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOperations.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Info className="mx-auto h-12 w-12 mb-4 text-slate-400" />
              <p className="text-xl font-semibold">No hay operaciones pendientes.</p>
              <p>Todas las operaciones registradas han sido completadas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Entrada Total</TableHead>
                  <TableHead>Salida Total</TableHead>
                  <TableHead>Entrada Ejec.</TableHead>
                  <TableHead>Salida Ejec.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOperations.map(op => (
                  <TableRow key={op.id}>
                    <TableCell>{new Date(op.timestamp).toLocaleDateString('es-AR')}</TableCell>
                    <TableCell>{operationTypeLabels[op.type] || op.type}</TableCell>
                    <TableCell>{getClientName(op.client)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{op.description || '-'}</TableCell>
                    <TableCell>{op.amountIn ? formatCurrency(op.amountIn, op.currencyIn) : '-'}</TableCell>
                    <TableCell>{op.amountOut ? formatCurrency(op.amountOut, op.currencyOut) : '-'}</TableCell>
                    <TableCell>{formatCurrency(op.executedAmountIn || 0, op.currencyIn)}</TableCell>
                    <TableCell>{formatCurrency(op.executedAmountOut || 0, op.currencyOut)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(op.status)}>
                        {op.status === 'pending' ? 'Pendiente' : 'Parcial'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenExecuteModal(op)}>
                        <Send className="h-4 w-4 mr-1" /> Ejecutar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {isModalOpen && selectedOperation && (
        <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <ExecuteOperationModal 
                operation={selectedOperation}
                onExecute={handleExecute}
                onCancel={() => {
                    setIsModalOpen(false);
                    setSelectedOperation(null);
                }}
            />
        </AlertDialog>
      )}
    </motion.div>
  );
};

export default PendingOperationsPage;
