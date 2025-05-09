
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, AlertCircle, CheckCircle, Calculator, Landmark, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, DollarSign, Settings2 } from 'lucide-react';
import FormattedInput from '@/components/FormattedInput.jsx';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/SearchableSelect.jsx';

export const baseOperationTypes = [
  { value: "compra_divisa", label: "Compra Divisa", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out' },
  { value: "venta_divisa", label: "Venta Divisa", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out' },
  { value: "caja_chica", label: "Movimiento Caja Chica", isTransactional: false, flow: 'in_out_selectable' },
  { value: "sueldos", label: "Sueldos", isTransactional: false, flow: 'out' },
  { value: "alquileres_pagados", label: "Alquileres Pagados", isTransactional: false, flow: 'out' },
  { value: "gastos_varios", label: "Gastos Varios", isTransactional: false, flow: 'out' },
  { value: "costos_fijos", label: "Costos Fijos", isTransactional: false, flow: 'out' },
  { value: "prestamo_otorgado", label: "Préstamo Otorgado", isTransactional: false, flow: 'out' },
  { value: "prestamo_recibido", label: "Préstamo Recibido", isTransactional: false, flow: 'in' },
  { value: "comision_ganada", label: "Comisión Ganada", isTransactional: false, flow: 'in' },
  { value: "comision_pagada", label: "Comisión Pagada", isTransactional: false, flow: 'out' },
  { value: "pago_deuda", label: "Pago Deuda", isTransactional: false, flow: 'out' },
  { value: "cobro_deuda", label: "Cobro Deuda", isTransactional: false, flow: 'in' },
  { value: "inversion_realizada", label: "Inversión Realizada", isTransactional: false, flow: 'out' },
  { value: "inversion_retorno", label: "Retorno Inversión", isTransactional: false, flow: 'in' },
  { value: "dividendos_pagados", label: "Dividendos Pagados", isTransactional: false, flow: 'out' },
  { value: "dividendos_recibidos", "label": "Dividendos Recibidos", isTransactional: false, flow: 'in' },
  { value: "aporte_capital", label: "Aporte de Capital", isTransactional: false, flow: 'in' },
  { value: "retiro_capital", label: "Retiro de Capital", isTransactional: false, flow: 'out' },
  { value: "otro_ingreso", label: "Otro Ingreso", isTransactional: false, flow: 'in' },
  { value: "otro_egreso", label: "Otro Egreso", isTransactional: false, flow: 'out' },
];

export const adminOnlyOperationTypes = [
    { value: "asiento_base", label: "Asiento Base / Constitución", icon: Landmark, isTransactional: false, flow: 'in' },
    { value: "ajuste_caja", label: "Ajuste de Caja", icon: Settings2, isTransactional: false, flow: 'in_out_selectable' },
];

const foreignCurrencies = ["USD", "EUR", "USDT", "BRL", "GBP"];
const allCurrencies = ["ARS", ...foreignCurrencies];
const NO_CLIENT_VALUE = "_ninguno_";
const ARS_CURRENCY = "ARS";

const OperationTypeSelector = ({ value, onChange, availableTypes }) => (
  <div className="space-y-2 md:col-span-2">
    <Label htmlFor="operationType">Tipo de Operación</Label>
    <SearchableSelect
        id="operationType"
        options={availableTypes}
        value={value}
        onValueChange={onChange}
        placeholder="Selecciona o busca un tipo..."
        emptyText="No se encontró el tipo de operación."
    />
  </div>
);

const AmountInputGroup = ({ id, label, amount, currency, onAmountChange, onCurrencyChange, currenciesToList, disabled = false, currencyDisabled = false, placeholder = "0,00" }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex gap-2">
      <FormattedInput id={id} name={id} placeholder={placeholder} value={amount} onChange={onAmountChange} className="flex-grow" disabled={disabled} />
      <Select onValueChange={onCurrencyChange} value={currency} disabled={currencyDisabled || disabled}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>{currenciesToList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  </div>
);

const SingleAmountInput = ({ label, amount, currency, onAmountChange, onCurrencyChange, currenciesToList, placeholder = "0,00", icon = <DollarSign className="h-4 w-4"/> }) => (
    <div className="space-y-2 md:col-span-2">
        <Label htmlFor="singleAmount" className="flex items-center">{icon} {label}</Label>
        <div className="flex gap-2">
            <FormattedInput id="singleAmount" name="singleAmount" placeholder={placeholder} value={amount} onChange={onAmountChange} className="flex-grow" />
            <Select onValueChange={onCurrencyChange} value={currency}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>{currenciesToList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
        </div>
    </div>
);


const ClientSelector = ({ value, onChange, clients, newClientName, onNewClientNameChange, onAddNewClient }) => (
  <>
    <div className="space-y-2">
        <Label htmlFor="client">Cliente (Opcional)</Label>
         <SearchableSelect
            id="client"
            options={[{value: NO_CLIENT_VALUE, label:"Ninguno"}, ...clients.map(c => ({ value: c.id, label: c.name }))]}
            value={value === NO_CLIENT_VALUE ? "" : value}
            onValueChange={onChange}
            placeholder="Selecciona o busca un cliente..."
            emptyText="No se encontró el cliente."
        />
    </div>
    <div className="space-y-2">
        <Label htmlFor="newClientName">O Agregar Nuevo Cliente</Label>
        <div className="flex gap-2">
            <Input id="newClientName" value={newClientName} onChange={onNewClientNameChange} placeholder="Nombre del nuevo cliente" />
            <Button type="button" variant="secondary" onClick={onAddNewClient}><PlusCircle className="h-4 w-4"/></Button>
        </div>
    </div>
  </>
);


const LoadOperationPage = () => {
  const { addOperation, clients, addClient } = useOperations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [operationType, setOperationType] = useState('');
  const [amountIn, setAmountIn] = useState(null);
  const [currencyIn, setCurrencyIn] = useState(ARS_CURRENCY);
  const [amountOut, setAmountOut] = useState(null);
  const [currencyOut, setCurrencyOut] = useState(foreignCurrencies[0]);
  const [rate, setRate] = useState(null);
  const [client, setClient] = useState(NO_CLIENT_VALUE);
  const [newClientName, setNewClientName] = useState('');
  const [description, setDescription] = useState('');
  const [lastEditedField, setLastEditedField] = useState(null);

  const selectedOperationConfig = useMemo(() => {
    const allTypes = [...baseOperationTypes, ...adminOnlyOperationTypes];
    return allTypes.find(type => type.value === operationType);
  }, [operationType]);

  const isTransactional = selectedOperationConfig?.isTransactional || false;
  const operationFlow = selectedOperationConfig?.flow; 

  const availableOperationTypes = useMemo(() => {
    let types = [...baseOperationTypes];
    if (currentUser?.role === 'admin') {
      types = [...types, ...adminOnlyOperationTypes];
    }
    return types.sort((a,b) => a.label.localeCompare(b.label));
  }, [currentUser]);


  useEffect(() => {
    if (operationType === "compra_divisa") {
        setCurrencyIn(ARS_CURRENCY);
        if (currencyOut === ARS_CURRENCY) setCurrencyOut(foreignCurrencies[0]);
    } else if (operationType === "venta_divisa") {
        setCurrencyOut(ARS_CURRENCY);
        if (currencyIn === ARS_CURRENCY) setCurrencyIn(foreignCurrencies[0]);
    } else if (operationFlow === 'in') {
        setAmountOut(null); 
        setCurrencyOut(foreignCurrencies[0]); 
        setRate(null);
        if (currencyIn === currencyOut && currencyIn !== ARS_CURRENCY) setCurrencyIn(ARS_CURRENCY);
         else if (currencyIn === currencyOut && currencyIn === ARS_CURRENCY) setCurrencyOut(foreignCurrencies[0]);
    } else if (operationFlow === 'out') {
        setAmountIn(null);
        setCurrencyIn(foreignCurrencies[0]);
        setRate(null);
        if (currencyIn === currencyOut && currencyOut !== ARS_CURRENCY) setCurrencyOut(ARS_CURRENCY);
        else if (currencyIn === currencyOut && currencyOut === ARS_CURRENCY) setCurrencyIn(foreignCurrencies[0]);

    } else { 
        setCurrencyIn(ARS_CURRENCY);
        setCurrencyOut(foreignCurrencies[0]);
        setRate(null);
    }

    if (!isTransactional) {
        setRate(null);
    }
  }, [operationType, isTransactional, operationFlow]);

  const handleInputChange = (setter, fieldName) => (e) => {
    const value = e.target.value; 
    setter(value);
    setLastEditedField(fieldName);
  };
  
  const autoCalculate = useCallback(() => {
    if (!isTransactional || !lastEditedField) return;

    const valIn = parseFloat(amountIn);
    const valOut = parseFloat(amountOut);
    const valRate = parseFloat(rate);

    let newAmountIn = amountIn;
    let newAmountOut = amountOut;
    let newRate = rate;

    if (operationType === "compra_divisa") { 
      if (lastEditedField === 'amountIn' && !isNaN(valIn) && !isNaN(valRate) && valRate !== 0) {
        newAmountOut = parseFloat((valIn / valRate).toFixed(2));
      } else if (lastEditedField === 'amountOut' && !isNaN(valOut) && !isNaN(valRate) && valRate !== 0) {
        newAmountIn = parseFloat((valOut * valRate).toFixed(2));
      } else if (lastEditedField === 'rate' && !isNaN(valRate) && !isNaN(valIn) && valRate !== 0) {
        newAmountOut = parseFloat((valIn / valRate).toFixed(2));
      } else if (lastEditedField === 'rate' && !isNaN(valRate) && !isNaN(valOut) && valRate !== 0) { 
        newAmountIn = parseFloat((valOut * valRate).toFixed(2));
      } else if (lastEditedField === 'amountIn' && !isNaN(valIn) && !isNaN(valOut) && valOut !== 0) { 
        newRate = parseFloat((valIn / valOut).toFixed(4));
      } else if (lastEditedField === 'amountOut' && !isNaN(valOut) && !isNaN(valIn) && valOut !== 0) { 
        newRate = parseFloat((valIn / valOut).toFixed(4));
      }
    } else if (operationType === "venta_divisa") { 
      if (lastEditedField === 'amountIn' && !isNaN(valIn) && !isNaN(valRate)) {
        newAmountOut = parseFloat((valIn * valRate).toFixed(2));
      } else if (lastEditedField === 'amountOut' && !isNaN(valOut) && !isNaN(valRate) && valRate !== 0) {
        newAmountIn = parseFloat((valOut / valRate).toFixed(2));
      } else if (lastEditedField === 'rate' && !isNaN(valRate) && !isNaN(valIn)) {
        newAmountOut = parseFloat((valIn * valRate).toFixed(2));
      } else if (lastEditedField === 'rate' && !isNaN(valRate) && !isNaN(valOut) && valRate !== 0) { 
        newAmountIn = parseFloat((valOut / valRate).toFixed(2));
      } else if (lastEditedField === 'amountIn' && !isNaN(valIn) && !isNaN(valOut) && valIn !== 0) { 
        newRate = parseFloat((valOut / valIn).toFixed(4));
      } else if (lastEditedField === 'amountOut' && !isNaN(valOut) && !isNaN(valIn) && valIn !== 0) { 
        newRate = parseFloat((valOut / valIn).toFixed(4));
      }
    }
    
    if (newAmountIn !== amountIn && !isNaN(parseFloat(newAmountIn))) setAmountIn(parseFloat(newAmountIn));
    if (newAmountOut !== amountOut && !isNaN(parseFloat(newAmountOut))) setAmountOut(parseFloat(newAmountOut));
    if (newRate !== rate && !isNaN(parseFloat(newRate))) setRate(parseFloat(newRate));

  }, [amountIn, amountOut, rate, isTransactional, operationType, lastEditedField]);

  useEffect(() => {
    if (isTransactional && lastEditedField) { 
      autoCalculate();
    }
  }, [amountIn, amountOut, rate, isTransactional, autoCalculate, lastEditedField]);


  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      toast({ title: "Error", description: "El nombre del nuevo cliente no puede estar vacío.", variant: "destructive" });
      return;
    }
    try {
      const newClientData = await addClient(newClientName, {}); 
      setClient(newClientData.id);
      setNewClientName('');
      toast({ title: "Éxito", description: `Cliente "${newClientData.name}" agregado.`, icon: <CheckCircle /> });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setOperationType('');
    setAmountIn(null);
    setCurrencyIn(ARS_CURRENCY);
    setAmountOut(null);
    setCurrencyOut(foreignCurrencies[0]);
    setRate(null);
    setClient(NO_CLIENT_VALUE);
    setDescription('');
    setLastEditedField(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalAmountIn = amountIn !== null ? Number(amountIn) : 0;
    let finalCurrencyIn = currencyIn;
    let finalAmountOut = amountOut !== null ? Number(amountOut) : 0;
    let finalCurrencyOut = currencyOut;
    
    if (!isTransactional) {
        if (operationFlow === 'in') {
            finalAmountOut = 0;
            finalCurrencyOut = null;
        } else if (operationFlow === 'out') {
            finalAmountIn = 0;
            finalCurrencyIn = null;
        } else if (operationFlow === 'in_out_selectable'){
             if (finalAmountIn === 0 && finalAmountOut === 0) {
                toast({title: "Error", description: "Para este tipo de operación, ingrese un monto de entrada o de salida.", variant: "destructive"});
                return;
            }
            if(finalAmountIn > 0 && finalAmountOut > 0){
                toast({title: "Error", description: "Para este tipo de operación, ingrese solo entrada o solo salida, no ambas.", variant: "destructive"});
                return;
            }
        }
    }


    const parsedRate = rate !== null ? Number(rate) : 0;

    if (!operationType) {
      toast({ title: "Error", description: "Selecciona un tipo de operación.", variant: "destructive", icon: <AlertCircle /> });
      return;
    }
    if (finalAmountIn < 0 || finalAmountOut < 0 || parsedRate < 0) {
      toast({ title: "Error", description: "Los montos y cotizaciones no pueden ser negativos.", variant: "destructive", icon: <AlertCircle /> });
      return;
    }
    
    if (operationFlow !== 'in_out_selectable' && finalAmountIn === 0 && finalAmountOut === 0) {
      toast({ title: "Error", description: "Debes ingresar al menos un monto.", variant: "destructive", icon: <AlertCircle /> });
      return;
    }
   

    if (isTransactional) {
         if (finalAmountIn === 0 && finalAmountOut === 0) { 
            toast({ title: "Error", description: "Para Compra/Venta, al menos un monto debe ser mayor a cero.", variant: "destructive", icon: <AlertCircle /> });
            return;
         }
         if (parsedRate === 0) {
            toast({ title: "Error", description: "Para Compra/Venta, la cotización no puede ser cero.", variant: "destructive", icon: <AlertCircle /> });
            return;
         }
         if (finalCurrencyIn === finalCurrencyOut) {
            toast({ title: "Error", description: "Las monedas de entrada y salida no pueden ser iguales para Compra/Venta.", variant: "destructive", icon: <AlertCircle /> });
            return;
         }
    }

    try {
      addOperation({
        type: operationType,
        amountIn: finalAmountIn,
        currencyIn: finalAmountIn ? finalCurrencyIn : null,
        amountOut: finalAmountOut,
        currencyOut: finalAmountOut ? finalCurrencyOut : null,
        rate: isTransactional ? parsedRate : null,
        client: client === NO_CLIENT_VALUE ? null : client,
        description: description.trim(),
      });

      toast({ title: "Operación Registrada", description: "La operación ha sido guardada como pendiente.", icon: <CheckCircle /> });
      resetForm();
    } catch (error) {
      toast({ title: "Error al Registrar", description: error.message, variant: "destructive", icon: <AlertCircle /> });
    }
  };

  const getRateLabel = () => {
    if (operationType === "compra_divisa") return `${ARS_CURRENCY}/${currencyOut}`;
    if (operationType === "venta_divisa") return `${ARS_CURRENCY}/${currencyIn}`;
    return "Cotización";
  }

  const renderAmountFields = () => {
    if (isTransactional) {
      return (
        <>
          <AmountInputGroup 
            id="amountIn" 
            label={operationType === "compra_divisa" ? `Monto a Pagar (${ARS_CURRENCY})` : (operationType === "venta_divisa" ? `Monto a Vender (${currencyIn})` : "Monto Entrada")}
            amount={amountIn} 
            currency={currencyIn} 
            onAmountChange={handleInputChange(setAmountIn, 'amountIn')} 
            onCurrencyChange={setCurrencyIn} 
            currenciesToList={operationType === "compra_divisa" ? [ARS_CURRENCY] : (operationType === "venta_divisa" ? foreignCurrencies : allCurrencies)}
            currencyDisabled={operationType === "compra_divisa"}
          />
          <AmountInputGroup 
            id="amountOut" 
            label={operationType === "compra_divisa" ? `Monto a Recibir (${currencyOut})` : (operationType === "venta_divisa" ? `Monto a Recibir (${ARS_CURRENCY})` : "Monto Salida")}
            amount={amountOut} 
            currency={currencyOut} 
            onAmountChange={handleInputChange(setAmountOut, 'amountOut')} 
            onCurrencyChange={setCurrencyOut} 
            currenciesToList={operationType === "venta_divisa" ? [ARS_CURRENCY] : (operationType === "compra_divisa" ? foreignCurrencies : allCurrencies)}
            currencyDisabled={operationType === "venta_divisa"}
          />
          <div className="space-y-2">
            <Label htmlFor="rate">Cotización ({getRateLabel()})</Label>
            <FormattedInput id="rate" name="rate" placeholder="Ej: 1.050,50" value={rate} onChange={handleInputChange(setRate, 'rate')} />
          </div>
          <div className="md:col-span-2 text-sm text-muted-foreground">
            <p><Calculator className="inline h-4 w-4 mr-1"/> El sistema calculará el campo faltante si dos de ellos están completos.</p>
          </div>
        </>
      );
    } else if (operationFlow === 'in') {
      return <SingleAmountInput label="Monto Entrada" amount={amountIn} currency={currencyIn} onAmountChange={handleInputChange(setAmountIn, 'amountIn')} onCurrencyChange={setCurrencyIn} currenciesToList={allCurrencies} icon={<ArrowDownCircle className="h-4 w-4 mr-2 text-green-500" />}/>;
    } else if (operationFlow === 'out') {
      return <SingleAmountInput label="Monto Salida" amount={amountOut} currency={currencyOut} onAmountChange={handleInputChange(setAmountOut, 'amountOut')} onCurrencyChange={setCurrencyOut} currenciesToList={allCurrencies} icon={<ArrowUpCircle className="h-4 w-4 mr-2 text-red-500" />} />;
    } else if (operationFlow === 'in_out_selectable') { 
        return (
            <>
                 <AmountInputGroup 
                    id="amountIn" 
                    label="Monto Entrada (Opcional)"
                    amount={amountIn} 
                    currency={currencyIn} 
                    onAmountChange={handleInputChange(setAmountIn, 'amountIn')} 
                    onCurrencyChange={setCurrencyIn} 
                    currenciesToList={allCurrencies}
                 />
                <AmountInputGroup 
                    id="amountOut" 
                    label="Monto Salida (Opcional)"
                    amount={amountOut} 
                    currency={currencyOut} 
                    onAmountChange={handleInputChange(setAmountOut, 'amountOut')} 
                    onCurrencyChange={setCurrencyOut} 
                    currenciesToList={allCurrencies}
                 />
            </>
        );
    }
    return null; 
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-primary">
            <PlusCircle className="h-8 w-8" /> Cargar Nueva Operación
          </CardTitle>
          <CardDescription>Registra todas las transacciones y movimientos financieros. Las operaciones se guardarán como pendientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OperationTypeSelector value={operationType} onChange={setOperationType} availableTypes={availableOperationTypes} />
            
            {renderAmountFields()}
            
            <ClientSelector 
              value={client} 
              onChange={setClient} 
              clients={clients} 
              newClientName={newClientName} 
              onNewClientNameChange={e => setNewClientName(e.target.value)} 
              onAddNewClient={handleAddNewClient} 
            />

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Input id="description" placeholder="Detalles adicionales de la operación..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <CardFooter className="p-0 pt-6 md:col-span-2">
              <Button type="submit" className="w-full gradient-blue-bg text-white" size="lg" disabled={!operationType}>
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Operación Pendiente
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoadOperationPage;
