
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, RefreshCw, BarChart3, PlusCircle, Edit3, Trash2, Save } from 'lucide-react';
import { formatCurrency, parseFormattedNumber } from '@/lib/utils';
import FormattedInput from '@/components/FormattedInput.jsx';
import { useToast } from "@/components/ui/use-toast.js";

const cashBoxTypes = [
    {value: "cash", label: "Efectivo"},
    {value: "digital", label: "Moneda Digital (Crypto)"},
    {value: "digital_account", label: "Cuenta Digital (App/Fintech)"},
    {value: "bank_account", label: "Cuenta Bancaria"},
];

const availableCurrencies = ["ARS", "USD", "EUR", "USDT", "BRL", "GBP"];


const CashBoxFormDialog = ({ open, onOpenChange, cashBox, onSave }) => {
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('ARS');
    const [type, setType] = useState('cash');
    const { toast } = useToast();

    useEffect(() => {
        if (cashBox) {
            setName(cashBox.name);
            setCurrency(cashBox.currency);
            setType(cashBox.type);
        } else {
            setName('');
            setCurrency('ARS');
            setType('cash');
        }
    }, [cashBox, open]);

    const handleSubmit = () => {
        if (!name.trim()) {
            toast({ title: "Error", description: "El nombre de la caja es requerido.", variant: "destructive" });
            return;
        }
        onSave({ id: cashBox?.id, name, currency, type });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-primary">{cashBox ? 'Editar Caja' : 'Agregar Nueva Caja'}</DialogTitle>
                    <DialogDescription>
                        {cashBox ? 'Modifica los detalles de esta caja.' : 'Crea una nueva caja para registrar saldos.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="box-name">Nombre de la Caja</Label>
                        <Input id="box-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Caja Principal ARS" />
                    </div>
                    <div>
                        <Label htmlFor="box-currency">Moneda</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger id="box-currency"><SelectValue /></SelectTrigger>
                            <SelectContent>{availableCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="box-type">Tipo de Caja</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger id="box-type"><SelectValue /></SelectTrigger>
                            <SelectContent>{cashBoxTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="gradient-blue-bg text-white">
                        <Save className="mr-2 h-4 w-4" /> {cashBox ? 'Guardar Cambios' : 'Agregar Caja'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AdjustBalanceDialog = ({ open, onOpenChange, cashBox, onAdjust }) => {
    const [newBalance, setNewBalance] = useState(null);
    const [reason, setReason] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (cashBox && open) { // Reset only when dialog opens with a cashbox
            setNewBalance(cashBox.balance); 
            setReason('');
        } else if (!open) { // Clear on close
            setNewBalance(null);
            setReason('');
        }
    }, [cashBox, open]);
    
    if (!cashBox) return null;

    const handleAdjust = () => {
        const numericBalance = parseFormattedNumber(String(newBalance));
        if (numericBalance === null || isNaN(numericBalance)) {
            toast({ title: "Error", description: "El nuevo saldo debe ser un número válido.", variant: "destructive"});
            return;
        }
        if (!reason.trim()) {
            toast({ title: "Error", description: "Se requiere una razón para el ajuste.", variant: "destructive"});
            return;
        }
        onAdjust(cashBox.id, numericBalance, reason);
        onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-primary">Ajustar Saldo de {cashBox.name}</DialogTitle>
                    <DialogDescription>
                        Modifica el saldo actual de esta caja. Esta acción se registrará.
                        Saldo actual: {formatCurrency(cashBox.balance, cashBox.currency)}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="new-balance">Nuevo Saldo ({cashBox.currency})</Label>
                        <FormattedInput id="new-balance" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="0,00"/>
                    </div>
                    <div>
                        <Label htmlFor="adjustment-reason">Razón del Ajuste</Label>
                        <Input id="adjustment-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Conteo físico, corrección error, etc."/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAdjust} className="gradient-blue-bg text-white">
                        <Save className="mr-2 h-4 w-4" /> Confirmar Ajuste
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CashPage = () => {
  const { cashBoxes, addCashBox, updateCashBox, adjustCashBoxBalance, deleteCashBox } = useOperations();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [exchangeRates, setExchangeRates] = useState({
    EUR: 1.08, 
    USDT: 1.00, 
    ARS: 0.001, 
    BRL: 0.20,  
    GBP: 1.27   
  });
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCashBox, setEditingCashBox] = useState(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustingCashBox, setAdjustingCashBox] = useState(null);


  const totalBalanceInUSD = useMemo(() => {
    return cashBoxes.reduce((total, box) => {
      const rateToUSD = box.currency === "USD" ? 1 : (exchangeRates[box.currency] || 0);
      return total + (box.balance * rateToUSD);
    }, 0);
  }, [cashBoxes, exchangeRates]);

  const handleRateChange = (currency, event) => {
    const value = event.target.value; 
    setExchangeRates(prev => ({ ...prev, [currency]: value !== null ? value : 0 }));
  };
  
  const handleSaveCashBox = (data) => {
    try {
        if (data.id) { 
            updateCashBox(data.id, data);
            toast({ title: "Caja Actualizada", description: `Los detalles de "${data.name}" han sido guardados.` });
        } else { 
            addCashBox(data);
            toast({ title: "Caja Agregada", description: `"${data.name}" ha sido creada.` });
        }
    } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleOpenEditDialog = (box) => {
    setEditingCashBox(box);
    setIsFormDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setEditingCashBox(null);
    setIsFormDialogOpen(true);
  };
  
  const handleOpenAdjustDialog = (box) => {
    setAdjustingCashBox(box);
    setIsAdjustDialogOpen(true);
  };

  const handleAdjustBalance = (boxId, newBalance, reason) => {
    try {
        adjustCashBoxBalance(boxId, newBalance, reason);
        toast({ title: "Saldo Ajustado", description: `El saldo de la caja ha sido actualizado.` });
    } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCashBox = (boxId) => {
    try {
        deleteCashBox(boxId);
        toast({title: "Caja Eliminada", description: "La caja ha sido eliminada."});
    } catch(error) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    }
  };

  const groupedBalances = useMemo(() => {
    const grouped = {};
    cashBoxes.forEach(box => {
        if (!grouped[box.type]) {
            grouped[box.type] = [];
        }
        grouped[box.type].push(box);
    });
    for (const type in grouped) {
        grouped[type].sort((a, b) => a.name.localeCompare(b.name));
    }
    return grouped;
  }, [cashBoxes]);


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-green-500">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold flex items-center gap-2 text-green-600">
                <Wallet className="h-8 w-8" /> Estado de Caja General
            </CardTitle>
            {currentUser?.role === 'admin' && (
                <Button onClick={handleOpenNewDialog} className="gradient-blue-bg text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Caja
                </Button>
            )}
          </div>
          <CardDescription>Balance total de todas las cajas y cuentas, convertido a USD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 shadow-md">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm uppercase tracking-wider">Balance Total Estimado (USD)</p>
                        <p className="text-4xl font-bold">{formatCurrency(totalBalanceInUSD, "USD")}</p>
                    </div>
                    <BarChart3 className="h-12 w-12 opacity-70"/>
                </div>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><RefreshCw className="h-5 w-5"/> Cotizaciones a USD</CardTitle>
              <CardDescription>Define las tasas de cambio para convertir otras monedas a USD.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.keys(exchangeRates).filter(c => c !== "USD" && c !== "ARS").map(currency => ( 
                <div key={currency} className="space-y-1">
                  <Label htmlFor={`rate-${currency}`}>1 {currency} = USD</Label>
                  <FormattedInput
                    id={`rate-${currency}`}
                    name={`rate-${currency}`}
                    value={exchangeRates[currency]}
                    onChange={(e) => handleRateChange(currency, e)}
                    placeholder="0,00"
                  />
                </div>
              ))}
               <div key="ARS" className="space-y-1">
                  <Label htmlFor="rate-ARS">1 USD = ARS</Label>
                  <FormattedInput
                    id="rate-ARS"
                    name="rate-ARS"
                    value={exchangeRates["ARS"] ? 1 / exchangeRates["ARS"] : null} 
                    onChange={(e) => {
                        const arsPerUsd = e.target.value;
                        if (arsPerUsd !== null && arsPerUsd !== 0) {
                            handleRateChange("ARS", {target: {value: 1 / arsPerUsd }});
                        } else {
                             handleRateChange("ARS", {target: {value: 0 }});
                        }
                    }}
                    placeholder="0,00"
                  />
                </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      {Object.entries(groupedBalances).map(([type, boxes]) => (
        <Card key={type} className="shadow-md">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-primary">{cashBoxTypes.find(t => t.value === type)?.label || type}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boxes.map(box => (
                <Card key={box.id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">{box.name}</CardTitle>
                                <CardDescription>{box.currency}</CardDescription>
                            </div>
                            {currentUser?.role === 'admin' && (
                                <div className="flex flex-col space-y-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenEditDialog(box)}>
                                        <Edit3 size={14}/>
                                    </Button>
                                    {!box.isDefault && box.balance === 0 && (
                                      <Button variant="destructive-outline" size="icon" className="h-7 w-7" onClick={() => handleDeleteCashBox(box.id)}>
                                          <Trash2 size={14}/>
                                      </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-2xl font-bold">{formatCurrency(box.balance, box.currency)}</p>
                        {box.currency !== "USD" && (
                        <p className="text-sm text-muted-foreground">
                            (aprox. {formatCurrency(box.balance * (exchangeRates[box.currency] || 0), "USD")})
                        </p>
                        )}
                    </CardContent>
                    {currentUser?.role === 'admin' && (
                        <CardContent className="pt-2">
                             <Button variant="secondary" size="sm" className="w-full" onClick={() => handleOpenAdjustDialog(box)}>
                                Ajustar Saldo
                            </Button>
                        </CardContent>
                    )}
                </Card>
            ))}
            </CardContent>
        </Card>
      ))}
       {currentUser?.role === 'admin' && (
        <>
            <CashBoxFormDialog 
                open={isFormDialogOpen} 
                onOpenChange={setIsFormDialogOpen} 
                cashBox={editingCashBox}
                onSave={handleSaveCashBox}
            />
            <AdjustBalanceDialog
                open={isAdjustDialogOpen}
                onOpenChange={setIsAdjustDialogOpen}
                cashBox={adjustingCashBox}
                onAdjust={handleAdjustBalance}
            />
        </>
       )}
    </motion.div>
  );
};

export default CashPage;
