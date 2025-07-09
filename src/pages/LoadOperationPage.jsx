
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, AlertCircle, CheckCircle, Calculator, Landmark, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle, DollarSign, Settings2, Send, Briefcase, TrendingUp, TrendingDown, Shuffle, Building, Percent, Banknote, Globe, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import FormattedInput from '@/components/FormattedInput.jsx';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/SearchableSelect.jsx';
import ExecuteOperationModal from '@/components/ExecuteOperationModal.jsx'; 
import { supabase } from '@/lib/supabaseClient.js';


export const operationCategories = {
  TRANSACTION: "Transacciones",
  CABLE: "Cables (Transferencias)",
  EXPENSE: "Gastos",
  SOCIETY: "Sociedad",
  INVESTMENT: "Inversiones",
  ADJUSTMENT: "Ajustes y Otros",
  ADMIN: "Administración"
};

const USD_CURRENCY = "USD";
const ARS_CURRENCY = "ARS";
const USDT_CURRENCY = "USDT";

export const baseOperationTypes = [
  { value: "compra_divisa_ars", label: "Compra Divisa (con ARS)", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: [ARS_CURRENCY, 'foreign_excluding_usdt'] },
  { value: "venta_divisa_ars", label: "Venta Divisa (a ARS)", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: ['foreign_excluding_usdt', ARS_CURRENCY] },
  
  { value: "compra_divisa_usd", label: "Compra Otra Divisa (con USD)", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: [USD_CURRENCY, 'foreign_excluding_usdt_usd'] },
  { value: "venta_divisa_usd", label: "Venta Otra Divisa (a USD)", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: ['foreign_excluding_usdt_usd', USD_CURRENCY] },

  { value: "compra_usdt_ars", label: "Compra USDT (con ARS)", icon: Banknote, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: [ARS_CURRENCY, USDT_CURRENCY], rateType: 'percentage_fee' },
  { value: "venta_usdt_ars", label: "Venta USDT (a ARS)", icon: Banknote, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: [USDT_CURRENCY, ARS_CURRENCY], rateType: 'percentage_fee' },
  { value: "compra_usdt_usd", label: "Compra USDT (con USD)", icon: Banknote, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: [USD_CURRENCY, USDT_CURRENCY], rateType: 'percentage_fee' },
  { value: "venta_usdt_usd", label: "Venta USDT (a USD)", icon: Banknote, isTransactional: true, flow: 'in_out', category: operationCategories.TRANSACTION, currenciesInvolved: [USDT_CURRENCY, USD_CURRENCY], rateType: 'percentage_fee' },
  
  { value: "envio_cable_usd", label: "Envío Cable (USD)", icon: Globe, isTransactional: true, flow: 'in_out', category: operationCategories.CABLE, currenciesInvolved: [USD_CURRENCY, USD_CURRENCY], rateType: 'percentage_fee', isCable: true, cableDirection: 'send' },
  { value: "recepcion_cable_usd", label: "Recepción Cable (USD)", icon: Globe, isTransactional: true, flow: 'in_out', category: operationCategories.CABLE, currenciesInvolved: [USD_CURRENCY, USD_CURRENCY], rateType: 'percentage_fee', isCable: true, cableDirection: 'receive' },

  { value: "caja_chica", label: "Movimiento Caja Chica", icon: Shuffle, isTransactional: false, flow: 'in_out_selectable', category: operationCategories.ADJUSTMENT },
  
  { value: "sueldos", label: "Sueldos", icon: DollarSign, isTransactional: false, flow: 'out', category: operationCategories.EXPENSE },
  { value: "alquileres_pagados", label: "Alquileres Pagados", icon: Building, isTransactional: false, flow: 'out', category: operationCategories.EXPENSE },
  { value: "gastos_varios", label: "Gastos Varios", icon: Briefcase, isTransactional: false, flow: 'out', category: operationCategories.EXPENSE },
  { value: "costos_fijos", label: "Costos Fijos", icon: Briefcase, isTransactional: false, flow: 'out', category: operationCategories.EXPENSE },
  
  { value: "prestamo_otorgado", label: "Préstamo Otorgado", icon: TrendingUp, isTransactional: false, flow: 'out', category: operationCategories.SOCIETY },
  { value: "prestamo_recibido", label: "Préstamo Recibido", icon: TrendingDown, isTransactional: false, flow: 'in', category: operationCategories.SOCIETY },
  { value: "comision_ganada", label: "Comisión Ganada", icon: TrendingUp, isTransactional: false, flow: 'in', category: operationCategories.SOCIETY },
  { value: "comision_pagada", label: "Comisión Pagada", icon: TrendingDown, isTransactional: false, flow: 'out', category: operationCategories.SOCIETY },
  { value: "pago_deuda", label: "Pago Deuda", icon: TrendingDown, isTransactional: false, flow: 'out', category: operationCategories.SOCIETY },
  { value: "cobro_deuda", label: "Cobro Deuda", icon: TrendingUp, isTransactional: false, flow: 'in', category: operationCategories.SOCIETY },
  
  { value: "inversion_realizada", label: "Inversión Realizada", icon: TrendingUp, isTransactional: false, flow: 'out', category: operationCategories.INVESTMENT },
  { value: "inversion_retorno", label: "Retorno Inversión", icon: TrendingDown, isTransactional: false, flow: 'in', category: operationCategories.INVESTMENT },
  
  { value: "dividendos_pagados", label: "Dividendos Pagados", icon: TrendingDown, isTransactional: false, flow: 'out', category: operationCategories.SOCIETY },
  { value: "dividendos_recibidos", "label": "Dividendos Recibidos", icon: TrendingUp, isTransactional: false, flow: 'in', category: operationCategories.SOCIETY },
  { value: "aporte_capital", label: "Aporte de Capital", icon: TrendingUp, isTransactional: false, flow: 'in', category: operationCategories.SOCIETY },
  { value: "retiro_capital", label: "Retiro de Capital", icon: TrendingDown, isTransactional: false, flow: 'out', category: operationCategories.SOCIETY },
  
  { value: "otro_ingreso", label: "Otro Ingreso", icon: ArrowDownCircle, isTransactional: false, flow: 'in', category: operationCategories.ADJUSTMENT },
  { value: "otro_egreso", label: "Otro Egreso", icon: ArrowUpCircle, isTransactional: false, flow: 'out', category: operationCategories.ADJUSTMENT },
];

export const adminOnlyOperationTypes = [
    { value: "asiento_base", label: "Asiento Base / Constitución", icon: Landmark, isTransactional: false, flow: 'in', category: operationCategories.ADMIN },
    { value: "ajuste_caja", label: "Ajuste de Caja", icon: Settings2, isTransactional: false, flow: 'in_out_selectable', category: operationCategories.ADMIN },
];

const allForeignCurrencies = ["USD", "EUR", "USDT", "BRL", "GBP"];
const foreignCurrenciesExcludingUSDT = allForeignCurrencies.filter(c => c !== USDT_CURRENCY);
const foreignCurrenciesExcludingUSDTAndUSD = allForeignCurrencies.filter(c => c !== USDT_CURRENCY && c !== USD_CURRENCY);

const allCurrencies = [ARS_CURRENCY, ...allForeignCurrencies];
const NO_CLIENT_VALUE = "_ninguno_";
const NO_OWNER_VALUE = "_ninguno_";

const cableTransferTypes = ["ACH", "Swift", "Wire", "Otro"];
const cablePersonTypes = ["Física", "Jurídica"];


const OperationTypeSelector = ({ value, onChange, availableTypes }) => {
  const groupedTypes = useMemo(() => {
    return Object.values(operationCategories).map(category => ({
      category,
      types: availableTypes.filter(type => type.category === category)
    })).filter(group => group.types.length > 0);
  }, [availableTypes]);

  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="operationType">Tipo de Operación</Label>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger id="operationType" className="w-full">
          <SelectValue placeholder="Selecciona un tipo..." />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {groupedTypes.map(group => (
            <SelectGroup key={group.category}>
              <SelectLabel className="text-primary font-semibold">{group.category}</SelectLabel>
              {group.types.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center">
                    {type.icon && <type.icon className="h-4 w-4 mr-2 text-muted-foreground" />}
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


const AmountInputGroup = ({ id, label, amount, currency, onAmountChange, onCurrencyChange, currenciesToList, disabled = false, currencyDisabled = false, placeholder = "0,00" }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex gap-2">
      <FormattedInput id={id} name={id} placeholder={placeholder} value={amount} onChange={onAmountChange} className="flex-grow" disabled={disabled} allowNegative={false} />
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
            <FormattedInput id="singleAmount" name="singleAmount" placeholder={placeholder} value={amount} onChange={onAmountChange} className="flex-grow" allowNegative={false} />
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
        <Label htmlFor="client" className="flex items-center"><UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />Cliente (Opcional)</Label>
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

const UserSelector = ({ id, label, value, onChange, users, icon = <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" /> }) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="flex items-center">{icon}{label}</Label>
        <SearchableSelect
            id={id}
            options={users.map(u => ({ value: u.id, label: u.username || u.id }))}
            value={value}
            onValueChange={onChange}
            placeholder="Seleccionar usuario..."
            emptyText="No se encontraron usuarios."
        />
    </div>
);


const CableDetailsForm = ({ cableData, onCableDataChange }) => {
  const handleChange = (field) => (e) => {
    onCableDataChange({ ...cableData, [field]: e.target.value });
  };
  const handleSelectChange = (field) => (value) => {
    onCableDataChange({ ...cableData, [field]: value });
  };

  return (
    <>
      <div className="md:col-span-2 border-t border-border pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-2 text-primary">Detalles del Cable (Opcional)</h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cableTransferType">Tipo de Transferencia</Label>
        <Select value={cableData.transferType || ''} onValueChange={handleSelectChange('transferType')}>
          <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
          <SelectContent>{cableTransferTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cableBankName">Banco Origen/Destino</Label>
        <Input id="cableBankName" value={cableData.bankName || ''} onChange={handleChange('bankName')} placeholder="Ej: Citibank, Chase" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cableAccountNumber">Número de Cuenta</Label>
        <Input id="cableAccountNumber" value={cableData.accountNumber || ''} onChange={handleChange('accountNumber')} placeholder="Número de cuenta" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cableRoutingNumber">Número de Ruta</Label>
        <Input id="cableRoutingNumber" value={cableData.routingNumber || ''} onChange={handleChange('routingNumber')} placeholder="Número de ruta / ABA" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cableAccountHolder">Titular de la Cuenta</Label>
        <Input id="cableAccountHolder" value={cableData.accountHolder || ''} onChange={handleChange('accountHolder')} placeholder="Nombre del titular" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cablePersonType">Tipo de Persona</Label>
        <Select value={cableData.personType || ''} onValueChange={handleSelectChange('personType')}>
          <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
          <SelectContent>{cablePersonTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </>
  );
};


const LoadOperationPage = () => {
  const { addOperation, executeOperation, clients, addClient, cashBoxes, userProfiles, fetchUserProfiles, fetchClients } = useOperations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [operationType, setOperationType] = useState('');
  const [amountIn, setAmountIn] = useState(null);
  const [currencyIn, setCurrencyIn] = useState(ARS_CURRENCY);
  const [amountOut, setAmountOut] = useState(null);
  const [currencyOut, setCurrencyOut] = useState(allForeignCurrencies[0]);
  const [rate, setRate] = useState(null);
  const [client, setClient] = useState(NO_CLIENT_VALUE);
  const [newClientName, setNewClientName] = useState('');
  const [description, setDescription] = useState('');
  const [lastEditedField, setLastEditedField] = useState(null);
  const [cableData, setCableData] = useState({});
  const [operationOwnerId, setOperationOwnerId] = useState(NO_OWNER_VALUE);


  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [operationToExecute, setOperationToExecute] = useState(null);

useEffect(() => {
  if (Array.isArray(userProfiles) && userProfiles.length === 0) {
    fetchUserProfiles();
  }
}, [userProfiles, fetchUserProfiles]);
useEffect(() => {
  fetchClients();
}, []);



  const selectedOperationConfig = useMemo(() => {
    const allTypes = [...baseOperationTypes, ...adminOnlyOperationTypes];
    return allTypes.find(type => type.value === operationType);
  }, [operationType]);

  const isTransactional = selectedOperationConfig?.isTransactional || false;
  const operationFlow = selectedOperationConfig?.flow; 
  const currenciesInvolvedConfig = selectedOperationConfig?.currenciesInvolved;
  const rateType = selectedOperationConfig?.rateType;
  const isCableOperation = selectedOperationConfig?.isCable || false;

  const availableOperationTypes = useMemo(() => {
    let types = [...baseOperationTypes];
    if (currentUser?.role === 'admin') {
      types = [...types, ...adminOnlyOperationTypes];
    }
    return types.sort((a,b) => {
        if (a.category === b.category) return a.label.localeCompare(b.label);
        return Object.values(operationCategories).indexOf(a.category) - Object.values(operationCategories).indexOf(b.category);
    });
  }, [currentUser]);


  useEffect(() => {
    if (!selectedOperationConfig) {
        setCurrencyIn(ARS_CURRENCY);
        setCurrencyOut(allForeignCurrencies[0]);
        setRate(null);
        setCableData({});
        return;
    }
    if (!isCableOperation) setCableData({});


    if (currenciesInvolvedConfig) {
        const [configIn, configOut] = currenciesInvolvedConfig;
        
        if (configIn === ARS_CURRENCY) setCurrencyIn(ARS_CURRENCY);
        else if (configIn === USD_CURRENCY) setCurrencyIn(USD_CURRENCY);
        else if (configIn === USDT_CURRENCY) setCurrencyIn(USDT_CURRENCY);
        else if (configIn === 'foreign_excluding_usdt') setCurrencyIn(foreignCurrenciesExcludingUSDT.find(c => c !== currencyOut) || foreignCurrenciesExcludingUSDT[0]);
        else if (configIn === 'foreign_excluding_usdt_usd') setCurrencyIn(foreignCurrenciesExcludingUSDTAndUSD.find(c => c !== currencyOut) || foreignCurrenciesExcludingUSDTAndUSD[0]);
        else setCurrencyIn(ARS_CURRENCY);

        if (configOut === ARS_CURRENCY) setCurrencyOut(ARS_CURRENCY);
        else if (configOut === USD_CURRENCY) setCurrencyOut(USD_CURRENCY);
        else if (configOut === USDT_CURRENCY) setCurrencyOut(USDT_CURRENCY);
        else if (configOut === 'foreign_excluding_usdt') setCurrencyOut(foreignCurrenciesExcludingUSDT.find(c => c !== currencyIn) || foreignCurrenciesExcludingUSDT[0]);
        else if (configOut === 'foreign_excluding_usdt_usd') setCurrencyOut(foreignCurrenciesExcludingUSDTAndUSD.find(c => c !== currencyIn) || foreignCurrenciesExcludingUSDTAndUSD[0]);
        else setCurrencyOut(allForeignCurrencies[0]);

    } else if (operationFlow === 'in') {
        setAmountOut(null); 
        setCurrencyOut(allForeignCurrencies[0]); 
        setRate(null);
        if (currencyIn === currencyOut && currencyIn !== ARS_CURRENCY) setCurrencyIn(ARS_CURRENCY);
         else if (currencyIn === currencyOut && currencyIn === ARS_CURRENCY) setCurrencyOut(allForeignCurrencies[0]);
    } else if (operationFlow === 'out') {
        setAmountIn(null);
        setCurrencyIn(allForeignCurrencies[0]);
        setRate(null);
        if (currencyIn === currencyOut && currencyOut !== ARS_CURRENCY) setCurrencyOut(ARS_CURRENCY);
        else if (currencyIn === currencyOut && currencyOut === ARS_CURRENCY) setCurrencyIn(allForeignCurrencies[0]);
    } else { 
        setCurrencyIn(ARS_CURRENCY);
        setCurrencyOut(allForeignCurrencies[0]);
    }
    
    if (!isTransactional) {
        setRate(null);
    }
  }, [operationType, selectedOperationConfig, operationFlow, currenciesInvolvedConfig, isCableOperation]);

  const handleInputChange = (setter, fieldName) => (e) => {
    const value = e.target.value; 
    setter(value);
    setLastEditedField(fieldName);
  };
  
  const autoCalculate = useCallback(() => {
    if (!isTransactional || !lastEditedField || !selectedOperationConfig) return;

    const valIn = parseFloat(amountIn);
    const valOut = parseFloat(amountOut);
    const valRate = parseFloat(rate); 

    let newAmountIn = amountIn;
    let newAmountOut = amountOut;
    let newRate = rate;

    const isVentaType = operationType.startsWith('venta_') || selectedOperationConfig.cableDirection === 'send'; 
    const isCompraType = operationType.startsWith('compra_') || selectedOperationConfig.cableDirection === 'receive'; 

    if (rateType === 'percentage_fee') {
        if (lastEditedField === 'amountIn' && !isNaN(valIn) && !isNaN(valRate)) {
            newAmountOut = parseFloat((valIn * (1 + valRate / 100)).toFixed(2));
        } else if (lastEditedField === 'amountOut' && !isNaN(valOut) && !isNaN(valRate)) {
            newAmountIn = parseFloat((valOut * (1 + valRate / 100)).toFixed(2)); 
        } else if (lastEditedField === 'rate' && !isNaN(valRate)) {
            if (!isNaN(valIn)) { 
                newAmountOut = parseFloat((valIn * (1 + valRate / 100)).toFixed(2));
            } else if (!isNaN(valOut)) { 
                newAmountIn = parseFloat((valOut * (1 + valRate / 100)).toFixed(2)); 
            }
        }
    } else { 
        if (lastEditedField === 'amountIn' && !isNaN(valIn) && !isNaN(valRate) && valRate !== 0) {
            newAmountOut = parseFloat((isVentaType ? valIn * valRate : valIn / valRate).toFixed(2));
        } else if (lastEditedField === 'amountOut' && !isNaN(valOut) && !isNaN(valRate) && valRate !== 0) {
            newAmountIn = parseFloat((isVentaType ? valOut / valRate : valOut * valRate).toFixed(2));
        } else if (lastEditedField === 'rate' && !isNaN(valRate) && valRate !== 0) {
            if (!isNaN(valIn)) {
                newAmountOut = parseFloat((isVentaType ? valIn * valRate : valIn / valRate).toFixed(2));
            } else if (!isNaN(valOut)) {
                newAmountIn = parseFloat((isVentaType ? valOut / valRate : valOut * valRate).toFixed(2));
            }
        } else if (!isNaN(valIn) && !isNaN(valOut) && valOut !== 0 && valIn !== 0) {
            if (lastEditedField === 'amountIn' || lastEditedField === 'amountOut') {
                 newRate = parseFloat((isVentaType ? valOut / valIn : valIn / valOut).toFixed(4));
            }
        }
    }
    
    if (newAmountIn !== amountIn && !isNaN(parseFloat(newAmountIn))) setAmountIn(parseFloat(newAmountIn));
    if (newAmountOut !== amountOut && !isNaN(parseFloat(newAmountOut))) setAmountOut(parseFloat(newAmountOut));
    if (newRate !== rate && !isNaN(parseFloat(newRate))) setRate(parseFloat(newRate));

  }, [amountIn, amountOut, rate, isTransactional, selectedOperationConfig, lastEditedField, operationType, rateType]);

  useEffect(() => {
    if (isTransactional && lastEditedField && selectedOperationConfig) { 
      autoCalculate();
    }
  }, [amountIn, amountOut, rate, isTransactional, autoCalculate, lastEditedField, selectedOperationConfig]);




const handleAddNewClient = async () => {
  if (!newClientName.trim()) {
    toast({
      title: "Error",
      description: "El nombre del nuevo cliente no puede estar vacío.",
      variant: "destructive",
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ name: newClientName }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "No se pudo crear el cliente.");
    }

    setClient(data.id);
    if (!clients.find(c => c.id === data.id)) {
  clients.push(data);
}
    setNewClientName('');
    toast({
      title: "Éxito",
      description: `Cliente "${data.name}" agregado.`,
      icon: <CheckCircle />,
    });
  } catch (error) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};


  const resetForm = () => {
    setOperationType('');
    setAmountIn(null);
    setCurrencyIn(ARS_CURRENCY);
    setAmountOut(null);
    setCurrencyOut(allForeignCurrencies[0]);
    setRate(null);
    setClient(NO_CLIENT_VALUE);
    setDescription('');
    setLastEditedField(null);
    setCableData({});
    setOperationOwnerId(NO_OWNER_VALUE);
  };

  const handleRegisterOperation = (executeImmediately = false) => {
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
                return null;
            }
            if(finalAmountIn > 0 && finalAmountOut > 0){
                toast({title: "Error", description: "Para este tipo de operación, ingrese solo entrada o solo salida, no ambas.", variant: "destructive"});
                return null;
            }
        }
    }

    const parsedRate = rate !== null ? Number(rate) : 0;

    if (!operationType) {
      toast({ title: "Error", description: "Selecciona un tipo de operación.", variant: "destructive", icon: <AlertCircle /> });
      return null;
    }
    
    const allowNegativeAmounts = false; 
    if (!allowNegativeAmounts && (finalAmountIn < 0 || finalAmountOut < 0)) {
       toast({ title: "Error", description: "Los montos no pueden ser negativos.", variant: "destructive", icon: <AlertCircle /> });
       return null;
    }
    
    if (rateType !== 'percentage_fee' && parsedRate < 0) {
        toast({ title: "Error", description: "La cotización no puede ser negativa para este tipo de operación.", variant: "destructive", icon: <AlertCircle /> });
        return null;
    }
    
    if (operationFlow !== 'in_out_selectable' && finalAmountIn === 0 && finalAmountOut === 0) {
      toast({ title: "Error", description: "Debes ingresar al menos un monto.", variant: "destructive", icon: <AlertCircle /> });
      return null;
    }
   
    if (isTransactional) {
         if (finalAmountIn === 0 && finalAmountOut === 0) { 
            toast({ title: "Error", description: "Para operaciones transaccionales, al menos un monto debe ser mayor a cero.", variant: "destructive", icon: <AlertCircle /> });
            return null;
         }
         if (parsedRate === 0 && rateType !== 'percentage_fee' && !isCableOperation) { 
            toast({ title: "Error", description: "Para Compra/Venta (no USDT/Cable), la cotización no puede ser cero.", variant: "destructive", icon: <AlertCircle /> });
            return null;
         }
         if (finalCurrencyIn === finalCurrencyOut && !isCableOperation) { 
            toast({ title: "Error", description: "Las monedas de entrada y salida no pueden ser iguales para Compra/Venta (no Cable).", variant: "destructive", icon: <AlertCircle /> });
            return null;
         }
    }


    try {
      const newOpData = {
        type: operationType,
        amountIn: finalAmountIn,
        currencyIn: finalAmountIn ? finalCurrencyIn : null,
        amountOut: finalAmountOut,
        currencyOut: finalAmountOut ? finalCurrencyOut : null,
        rate: isTransactional ? parsedRate : null,
        rateType: isTransactional ? rateType : null,
        client: client === NO_CLIENT_VALUE ? null : client,
        description: description.trim(),
        additionalData: isCableOperation ? cableData : null,
        ownerId: operationOwnerId === NO_OWNER_VALUE ? null : operationOwnerId,
      };
      const newOperation = addOperation(newOpData);

      toast({ title: "Operación Registrada", description: "La operación ha sido guardada como pendiente.", icon: <CheckCircle /> });
      resetForm();
      
      if (executeImmediately && newOperation) {
        setOperationToExecute(newOperation);
        setIsExecuteModalOpen(true);
      }
      return newOperation;
    } catch (error) {
      toast({ title: "Error al Registrar", description: error.message, variant: "destructive", icon: <AlertCircle /> });
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRegisterOperation(false);
  };

  const handleRegisterAndExecute = (e) => {
    e.preventDefault();
    handleRegisterOperation(true);
  };

  const handleExecuteModalSubmit = (executionData) => {
    if (!operationToExecute) return;
    try {
      executeOperation(operationToExecute.id, executionData);
      toast({ title: "Éxito", description: "Operación ejecutada.", icon: <CheckCircle /> });
      setIsExecuteModalOpen(false);
      setOperationToExecute(null);
    } catch (error) {
      toast({ title: "Error al Ejecutar", description: error.message, variant: "destructive" });
    }
  };

  const getRateLabel = () => {
    if (!isTransactional || !currencyIn || !currencyOut) return "Cotización";
    if (rateType === 'percentage_fee') return `Comisión (%)`;
    return `Cotización (${currencyIn}/${currencyOut})`;
  }

  const renderAmountFields = () => {
    if (!selectedOperationConfig) return null;

    let currencyInOptions = allCurrencies;
    let currencyOutOptions = allCurrencies;
    let currencyInDisabled = false;
    let currencyOutDisabled = false;

    const [configIn, configOut] = selectedOperationConfig.currenciesInvolved || [];

    if (isCableOperation) {
        currencyInOptions = [USD_CURRENCY]; currencyInDisabled = true;
        currencyOutOptions = [USD_CURRENCY]; currencyOutDisabled = true;
    } else {
        if (configIn === ARS_CURRENCY) { currencyInOptions = [ARS_CURRENCY]; currencyInDisabled = true; }
        else if (configIn === USD_CURRENCY) { currencyInOptions = [USD_CURRENCY]; currencyInDisabled = true; }
        else if (configIn === USDT_CURRENCY) { currencyInOptions = [USDT_CURRENCY]; currencyInDisabled = true; }
        else if (configIn === 'foreign_excluding_usdt') currencyInOptions = foreignCurrenciesExcludingUSDT;
        else if (configIn === 'foreign_excluding_usdt_usd') currencyInOptions = foreignCurrenciesExcludingUSDTAndUSD;
        
        if (configOut === ARS_CURRENCY) { currencyOutOptions = [ARS_CURRENCY]; currencyOutDisabled = true; }
        else if (configOut === USD_CURRENCY) { currencyOutOptions = [USD_CURRENCY]; currencyOutDisabled = true; }
        else if (configOut === USDT_CURRENCY) { currencyOutOptions = [USDT_CURRENCY]; currencyOutDisabled = true; }
        else if (configOut === 'foreign_excluding_usdt') currencyOutOptions = foreignCurrenciesExcludingUSDT;
        else if (configOut === 'foreign_excluding_usdt_usd') currencyOutOptions = foreignCurrenciesExcludingUSDTAndUSD;
    }


    if (isTransactional) {
      let labelAmountIn = `Monto ${operationType.startsWith('venta_') ? 'a Entregar' : 'a Pagar'} (${currencyIn})`;
      let labelAmountOut = `Monto ${operationType.startsWith('venta_') ? 'a Recibir' : 'a Obtener'} (${currencyOut})`;

      if (isCableOperation) {
        if (selectedOperationConfig.cableDirection === 'send') {
            labelAmountIn = `Monto a Enviar desde Banco (${currencyIn})`;
            labelAmountOut = `Monto a Recibir en Destino (${currencyOut})`;
        } else { 
            labelAmountIn = `Monto a Recibir en Banco (${currencyIn})`;
            labelAmountOut = `Monto a Entregar a Cliente (${currencyOut})`;
        }
      }

      return (
        <>
          <AmountInputGroup 
            id="amountIn" 
            label={labelAmountIn}
            amount={amountIn} 
            currency={currencyIn} 
            onAmountChange={handleInputChange(setAmountIn, 'amountIn')} 
            onCurrencyChange={setCurrencyIn} 
            currenciesToList={currencyInOptions}
            currencyDisabled={currencyInDisabled}
          />
          <AmountInputGroup 
            id="amountOut" 
            label={labelAmountOut}
            amount={amountOut} 
            currency={currencyOut} 
            onAmountChange={handleInputChange(setAmountOut, 'amountOut')} 
            onCurrencyChange={setCurrencyOut} 
            currenciesToList={currencyOutOptions}
            currencyDisabled={currencyOutDisabled}
          />
          <div className="space-y-2">
            <Label htmlFor="rate">{getRateLabel()}</Label>
            <FormattedInput 
                id="rate" 
                name="rate" 
                placeholder={rateType === 'percentage_fee' ? "Ej: 2.5 (%) o -2.5 (%)" : "Ej: 1.050,50"} 
                value={rate} 
                onChange={handleInputChange(setRate, 'rate')} 
                icon={rateType === 'percentage_fee' ? <Percent className="h-4 w-4 text-muted-foreground" /> : undefined}
                allowNegative={rateType === 'percentage_fee'}
            />
          </div>
          <div className="md:col-span-2 text-sm text-muted-foreground">
            <p><Calculator className="inline h-4 w-4 mr-1"/> El sistema calculará el campo faltante si dos de ellos están completos (monto o comisión/cotización).</p>
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
          <CardDescription>Registra todas las transacciones y movimientos financieros.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OperationTypeSelector value={operationType} onChange={setOperationType} availableTypes={availableOperationTypes} />
            
            {renderAmountFields()}

            {isCableOperation && (
                <CableDetailsForm cableData={cableData} onCableDataChange={setCableData} />
            )}
            
            <ClientSelector 
              value={client} 
              onChange={setClient} 
              clients={clients} 
              newClientName={newClientName} 
              onNewClientNameChange={e => setNewClientName(e.target.value)} 
              onAddNewClient={handleAddNewClient} 
            />

            <div className="space-y-2">
                <Label htmlFor="registeredBy">Registrado por</Label>
                <Input id="registeredBy" value={currentUser?.username || currentUser?.id || 'N/A'} disabled className="bg-muted/50"/>
            </div>

            <UserSelector
                id="operationOwner"
                label="Operación de (Usuario)"
                value={operationOwnerId === NO_OWNER_VALUE ? "" : operationOwnerId}
                onChange={setOperationOwnerId}
                users={[{id: NO_OWNER_VALUE, username: "Ninguno (Sistema/Empresa)"}, ...(userProfiles || [])]}
                icon={<UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />}
            />

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Input id="description" placeholder="Detalles adicionales de la operación..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <CardFooter className="p-0 pt-6 md:col-span-2 flex flex-col sm:flex-row gap-4">
              <Button type="submit" className="w-full sm:w-auto flex-1 gradient-blue-bg text-white" size="lg" disabled={!operationType}>
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Pendiente
              </Button>
              <Button type="button" onClick={handleRegisterAndExecute} variant="outline" className="w-full sm:w-auto flex-1 border-primary text-primary hover:bg-primary/10" size="lg" disabled={!operationType}>
                <Send className="mr-2 h-5 w-5" /> Registrar y Ejecutar
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      {isExecuteModalOpen && operationToExecute && (
        <ExecuteOperationModal
            isOpen={isExecuteModalOpen}
            onClose={() => {
                setIsExecuteModalOpen(false);
                setOperationToExecute(null);
            }}
            operation={operationToExecute}
            onExecute={handleExecuteModalSubmit}
            cashBoxes={cashBoxes}
        />
      )}
    </motion.div>
  );
};

export default LoadOperationPage;
