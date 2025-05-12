
import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormattedInput from '@/components/FormattedInput.jsx';
import { useToast } from "@/components/ui/use-toast";
import { Send, X } from 'lucide-react';
import { formatNumberForDisplay } from '@/lib/utils';
import { baseOperationTypes, adminOnlyOperationTypes } from '@/pages/LoadOperationPage.jsx';


const ExecuteOperationModal = ({ isOpen, onClose, operation, onExecute, cashBoxes }) => {
  const { toast } = useToast();
  const [execAmountIn, setExecAmountIn] = useState(null);
  const [execCurrencyIn, setExecCurrencyIn] = useState('');
  const [execAmountOut, setExecAmountOut] = useState(null);
  const [execCurrencyOut, setExecCurrencyOut] = useState('');
  const [execRate, setExecRate] = useState(null);
  const [targetCashBoxInId, setTargetCashBoxInId] = useState('');
  const [targetCashBoxOutId, setTargetCashBoxOutId] = useState('');

  const remainingIn = operation?.remainingAmountIn || 0;
  const remainingOut = operation?.remainingAmountOut || 0;

  const isCompraOperation = useMemo(() => operation?.type?.startsWith('compra_'), [operation]);

  const relevantCashBoxesIn = useMemo(() => {
    if (!operation || !cashBoxes) return [];
    const currencyForBox = isCompraOperation ? operation.currencyOut : operation.currencyIn;
    return cashBoxes.filter(cb => cb.currency === currencyForBox);
  }, [cashBoxes, operation, isCompraOperation]);

  const relevantCashBoxesOut = useMemo(() => {
    if (!operation || !cashBoxes) return [];
    const currencyForBox = isCompraOperation ? operation.currencyIn : operation.currencyOut;
    return cashBoxes.filter(cb => cb.currency === currencyForBox);
  }, [cashBoxes, operation, isCompraOperation]);


  useEffect(() => {
    if (operation) {
      setExecCurrencyIn(operation.currencyIn || '');
      setExecCurrencyOut(operation.currencyOut || '');
      setExecRate(operation.rate || null);

      if (remainingIn > 0.001) setExecAmountIn(remainingIn); else setExecAmountIn(null);
      if (remainingOut > 0.001) setExecAmountOut(remainingOut); else setExecAmountOut(null);
      
      const defaultBoxForNominalIn = cashBoxes?.find(cb => cb.currency === operation.currencyIn && cb.isDefault);
      const defaultBoxForNominalOut = cashBoxes?.find(cb => cb.currency === operation.currencyOut && cb.isDefault);

      if (isCompraOperation) {
        setTargetCashBoxInId(defaultBoxForNominalOut ? defaultBoxForNominalOut.id : (cashBoxes?.find(cb => cb.currency === operation.currencyOut)?.id || ''));
        setTargetCashBoxOutId(defaultBoxForNominalIn ? defaultBoxForNominalIn.id : (cashBoxes?.find(cb => cb.currency === operation.currencyIn)?.id || ''));
      } else {
        setTargetCashBoxInId(defaultBoxForNominalIn ? defaultBoxForNominalIn.id : (cashBoxes?.find(cb => cb.currency === operation.currencyIn)?.id || ''));
        setTargetCashBoxOutId(defaultBoxForNominalOut ? defaultBoxForNominalOut.id : (cashBoxes?.find(cb => cb.currency === operation.currencyOut)?.id || ''));
      }

    }
  }, [operation, remainingIn, remainingOut, cashBoxes, isCompraOperation]);

  if (!isOpen || !operation) return null;

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

    const effectiveAmountInIsPositive = isCompraOperation ? (parsedExecAmountOut > 0) : (parsedExecAmountIn > 0);
    const effectiveAmountOutIsPositive = isCompraOperation ? (parsedExecAmountIn > 0) : (parsedExecAmountOut > 0);
    
    const needsEffectiveCashBoxIn = effectiveAmountInIsPositive && !targetCashBoxInId;
    const needsEffectiveCashBoxOut = effectiveAmountOutIsPositive && !targetCashBoxOutId;

    if (needsEffectiveCashBoxIn || needsEffectiveCashBoxOut ) {
        toast({ title: "Error", description: "Debe seleccionar una caja de destino/origen si hay montos.", variant: "destructive" });
        return;
    }

    onExecute({
      amountIn: parsedExecAmountIn,
      currencyIn: execCurrencyIn,
      amountOut: parsedExecAmountOut,
      currencyOut: execCurrencyOut,
      rate: execRate ? Number(execRate) : null,
      targetCashBoxInId: isCompraOperation ? targetCashBoxOutId : targetCashBoxInId,
      targetCashBoxOutId: isCompraOperation ? targetCashBoxInId : targetCashBoxOutId,
    });
  };
  
  const allOperationTypes = [...baseOperationTypes, ...adminOnlyOperationTypes];
  const operationTypeLabel = allOperationTypes.find(t => t.value === operation.type)?.label || operation.type;


  const displayFields = {
    labelIn: isCompraOperation ? `Monto Salida a Ejecutar (${operation.currencyIn})` : `Monto Entrada a Ejecutar (${operation.currencyIn})`,
    amountInToExecute: isCompraOperation ? execAmountIn : execAmountIn,
    onAmountInChange: isCompraOperation ? setExecAmountIn : setExecAmountIn,
    pendingInDisplay: isCompraOperation ? formatNumberForDisplay(remainingIn) : formatNumberForDisplay(remainingIn),
    currencyInDisplay: operation.currencyIn,
    cashBoxInLabel: isCompraOperation ? "Caja Origen Salida" : "Caja Destino Entrada",
    targetCashBoxInModel: isCompraOperation ? targetCashBoxOutId : targetCashBoxInId,
    onTargetCashBoxInChange: isCompraOperation ? setTargetCashBoxOutId : setTargetCashBoxInId,
    relevantCashBoxesForIn: isCompraOperation ? cashBoxes.filter(cb => cb.currency === operation.currencyIn) : cashBoxes.filter(cb => cb.currency === operation.currencyIn),

    labelOut: isCompraOperation ? `Monto Entrada a Ejecutar (${operation.currencyOut})` : `Monto Salida a Ejecutar (${operation.currencyOut})`,
    amountOutToExecute: isCompraOperation ? execAmountOut : execAmountOut,
    onAmountOutChange: isCompraOperation ? setExecAmountOut : setExecAmountOut,
    pendingOutDisplay: isCompraOperation ? formatNumberForDisplay(remainingOut) : formatNumberForDisplay(remainingOut),
    currencyOutDisplay: operation.currencyOut,
    cashBoxOutLabel: isCompraOperation ? "Caja Destino Entrada" : "Caja Origen Salida",
    targetCashBoxOutModel: isCompraOperation ? targetCashBoxInId : targetCashBoxOutId,
    onTargetCashBoxOutChange: isCompraOperation ? setTargetCashBoxInId : setTargetCashBoxOutId,
    relevantCashBoxesForOut: isCompraOperation ? cashBoxes.filter(cb => cb.currency === operation.currencyOut) : cashBoxes.filter(cb => cb.currency === operation.currencyOut),
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Ejecutar Operación: {operationTypeLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            Ingrese los montos que se están ejecutando ahora. Esto impactará la caja.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {operation.amountIn > 0 && operation.currencyIn && (
            <div className="space-y-2">
              <Label>{displayFields.labelIn} - Pendiente: {displayFields.pendingInDisplay}</Label>
              <FormattedInput 
                value={displayFields.amountInToExecute} 
                onChange={(e) => displayFields.onAmountInChange(e.target.value)} 
                placeholder={`Máx. ${displayFields.pendingInDisplay}`}
              />
              <Label>{displayFields.cashBoxInLabel}</Label>
              <Select value={displayFields.targetCashBoxInModel} onValueChange={displayFields.onTargetCashBoxInChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar caja..." /></SelectTrigger>
                  <SelectContent>
                      {displayFields.relevantCashBoxesForIn.map(cb => <SelectItem key={cb.id} value={cb.id}>{cb.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          )}
          {operation.amountOut > 0 && operation.currencyOut && (
            <div className="space-y-2">
              <Label>{displayFields.labelOut} - Pendiente: {displayFields.pendingOutDisplay}</Label>
              <FormattedInput 
                value={displayFields.amountOutToExecute} 
                onChange={(e) => displayFields.onAmountOutChange(e.target.value)} 
                placeholder={`Máx. ${displayFields.pendingOutDisplay}`}
              />
              <Label>{displayFields.cashBoxOutLabel}</Label>
               <Select value={displayFields.targetCashBoxOutModel} onValueChange={displayFields.onTargetCashBoxOutChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar caja..." /></SelectTrigger>
                  <SelectContent>
                      {displayFields.relevantCashBoxesForOut.map(cb => <SelectItem key={cb.id} value={cb.id}>{cb.name}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          )}
          {operation.rate !== null && operation.rate !== undefined && (
              <div className="space-y-2">
                  <Label>Cotización Aplicada</Label>
                  <FormattedInput value={execRate} onChange={(e) => setExecRate(e.target.value)} placeholder="Cotización"/>
              </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}><X className="mr-2 h-4 w-4" />Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleExecute} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="mr-2 h-4 w-4" /> Ejecutar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExecuteOperationModal;
