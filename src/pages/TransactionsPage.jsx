
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ListFilter, Search, Edit3, Trash2, FileText, ArrowUpDown, Eye, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FormattedInput from '@/components/FormattedInput.jsx';
import { useToast } from "@/components/ui/use-toast.js";
import { cn } from "@/lib/utils";


const operationTypesForFilter = [
  { value: "all", label: "Todos los Tipos" },
  { value: "compra_divisa", label: "Compra Divisa" },
  { value: "venta_divisa", label: "Venta Divisa" },
  { value: "caja_chica", label: "Movimiento Caja Chica" },
  { value: "sueldos", label: "Sueldos" },
  { value: "gastos_varios", label: "Gastos Varios" },
  { value: "costos_fijos", label: "Costos Fijos" },
  { value: "prestamo_otorgado", label: "Préstamo Otorgado" },
  { value: "prestamo_recibido", label: "Préstamo Recibido" },
  { value: "comision_ganada", label: "Comisión Ganada" },
  { value: "comision_pagada", label: "Comisión Pagada" },
  { value: "pago_deuda", label: "Pago Deuda" },
  { value: "cobro_deuda", label: "Cobro Deuda" },
  { value: "inversion_realizada", label: "Inversión Realizada" },
  { value: "inversion_retorno", label: "Retorno Inversión" },
  { value: "dividendos_pagados", label: "Dividendos Pagados" },
  { value: "dividendos_recibidos", label: "Dividendos Recibidos" },
  { value: "aporte_capital", label: "Aporte de Capital" },
  { value: "retiro_capital", label: "Retiro de Capital" },
  { value: "otro_ingreso", label: "Otro Ingreso" },
  { value: "otro_egreso", label: "Otro Egreso" },
  { value: "asiento_base", label: "Asiento Base / Constitución" },
  { value: "ajuste_caja", label: "Ajuste de Caja"},
];

const ARS_CURRENCY = "ARS";
const foreignCurrencies = ["USD", "EUR", "USDT", "BRL", "GBP"];
const allCurrencies = [ARS_CURRENCY, ...foreignCurrencies];


const EditOperationDialog = ({ open, onOpenChange, operation, onSave }) => {
  const [editedOperation, setEditedOperation] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (operation) {
      setEditedOperation({ ...operation });
    }
  }, [operation]);

  if (!editedOperation) return null;

  const handleChange = (field, value) => {
    setEditedOperation(prev => ({ ...prev, [field]: value }));
  };

  const handleFormattedInputChange = (field, e) => {
    handleChange(field, e.target.value);
  };

  const handleSave = () => {
    const parsedAmountIn = editedOperation.amountIn !== null ? Number(editedOperation.amountIn) : 0;
    const parsedAmountOut = editedOperation.amountOut !== null ? Number(editedOperation.amountOut) : 0;
    const parsedRate = editedOperation.rate !== null ? Number(editedOperation.rate) : null;

    onSave({
      ...editedOperation,
      amountIn: parsedAmountIn,
      amountOut: parsedAmountOut,
      rate: parsedRate,
    });
    onOpenChange(false);
    toast({ title: "Operación Actualizada", description: "Los cambios en la operación han sido guardados." });
  };

  const isTransactionType = ["compra_divisa", "venta_divisa"].includes(editedOperation.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-primary">Editar Operación</DialogTitle>
          <DialogDescription>Modifica los detalles de la operación. Los cambios afectarán los cálculos futuros.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="edit-type">Tipo de Operación</Label>
            <Input id="edit-type" value={operationTypesForFilter.find(t => t.value === editedOperation.type)?.label || editedOperation.type} disabled />
          </div>
           <div>
            <Label htmlFor="edit-status">Estado</Label>
            <Input id="edit-status" value={editedOperation.status} disabled />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="edit-amountIn">Monto Entrada</Label>
            <FormattedInput id="edit-amountIn" value={editedOperation.amountIn} onChange={(e) => handleFormattedInputChange('amountIn', e)} />
          </div>
          <div>
            <Label htmlFor="edit-currencyIn">Moneda Entrada</Label>
            <Select value={editedOperation.currencyIn || ''} onValueChange={(val) => handleChange('currencyIn', val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-amountOut">Monto Salida</Label>
            <FormattedInput id="edit-amountOut" value={editedOperation.amountOut} onChange={(e) => handleFormattedInputChange('amountOut', e)} />
          </div>
          <div>
            <Label htmlFor="edit-currencyOut">Moneda Salida</Label>
            <Select value={editedOperation.currencyOut || ''} onValueChange={(val) => handleChange('currencyOut', val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          
          {isTransactionType && (
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="edit-rate">Cotización</Label>
              <FormattedInput id="edit-rate" value={editedOperation.rate} onChange={(e) => handleFormattedInputChange('rate', e)} />
            </div>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Input id="edit-description" value={editedOperation.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gradient-blue-bg text-white">Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const TransactionsPage = () => {
  const { operations, allOperationsForAdmin, clients, deleteOperation, updateOperation } = useOperations();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'descending' });
  const [operationToEdit, setOperationToEdit] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const dataToDisplay = currentUser?.role === 'admin' ? allOperationsForAdmin : operations;

  const getClientNameById = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'N/A';
  };
  
  const getOperationLabel = (value) => {
    const type = operationTypesForFilter.find(t => t.value === value);
    return type ? type.label : value;
  };

  const filteredAndSortedOperations = useMemo(() => {
    let filtered = [...dataToDisplay];
    if (filterType !== 'all') {
      filtered = filtered.filter(op => op.type === filterType);
    }
    if (filterDateStart) {
      filtered = filtered.filter(op => new Date(op.timestamp) >= new Date(filterDateStart));
    }
    if (filterDateEnd) {
      const endDate = new Date(filterDateEnd);
      endDate.setDate(endDate.getDate() + 1);
      filtered = filtered.filter(op => new Date(op.timestamp) < endDate);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(op => 
        op.description?.toLowerCase().includes(lowerSearchTerm) ||
        getClientNameById(op.client)?.toLowerCase().includes(lowerSearchTerm) ||
        op.amountIn?.toString().includes(lowerSearchTerm) ||
        op.amountOut?.toString().includes(lowerSearchTerm) ||
        op.userId?.toLowerCase().includes(lowerSearchTerm) ||
        op.status?.toLowerCase().includes(lowerSearchTerm) ||
        getOperationLabel(op.type)?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (['amountIn', 'amountOut', 'rate', 'executedAmountIn', 'executedAmountOut', 'remainingAmountIn', 'remainingAmountOut'].includes(sortConfig.key)) {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [dataToDisplay, searchTerm, filterType, filterDateStart, filterDateEnd, sortConfig, clients]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const formatCurrencyDisplay = (amount, currency) => {
    if (amount === null || amount === undefined || !currency) return '-';
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return '-';
    return `${numericAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const handleDelete = (operationId) => {
    try {
      deleteOperation(operationId);
      toast({ title: "Operación Eliminada", description: "La operación ha sido eliminada." });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (operation) => {
    setOperationToEdit(operation);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedOpData) => {
    try {
      updateOperation(updatedOpData.id, updatedOpData);
    } catch (error) {
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    }
  };
  
  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300';
      case 'partial':
        return 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'hover:bg-muted/50';
    }
  };

  const StatusBadge = ({ status }) => {
    let IconComponent = Eye;
    let text = status;
    let colorClass = "";

    switch (status) {
        case 'completed':
            IconComponent = CheckCircle;
            text = "Completa";
            colorClass = "text-green-600 dark:text-green-400";
            break;
        case 'partial':
            IconComponent = Clock;
            text = "Parcial";
            colorClass = "text-blue-600 dark:text-blue-400";
            break;
        case 'pending':
            IconComponent = AlertTriangle;
            text = "Pendiente";
            colorClass = "text-yellow-600 dark:text-yellow-500";
            break;
    }
    return (
        <span className={cn("flex items-center gap-1.5 text-xs capitalize whitespace-nowrap", colorClass)}>
            <IconComponent size={14} />
            {text}
        </span>
    );
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-primary">
            <ListFilter className="h-8 w-8" /> 
            {currentUser?.role === 'admin' ? 'Todas las Operaciones (Admin)' : 'Historial de Transacciones'}
          </CardTitle>
          <CardDescription>
            {currentUser?.role === 'admin' 
              ? 'Visualiza, filtra, edita y elimina todas las operaciones del sistema.'
              : 'Visualiza y filtra todas tus operaciones completadas.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/10">
            <div>
              <Label htmlFor="searchTerm" className="text-sm font-medium">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="searchTerm" placeholder="Cliente, descripción, monto, estado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div>
              <Label htmlFor="filterType" className="text-sm font-medium">Tipo Operación</Label>
              <Select onValueChange={setFilterType} value={filterType}>
                <SelectTrigger id="filterType"><SelectValue /></SelectTrigger>
                <SelectContent>{operationTypesForFilter.map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterDateStart" className="text-sm font-medium">Fecha Desde</Label>
              <Input id="filterDateStart" type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filterDateEnd" className="text-sm font-medium">Fecha Hasta</Label>
              <Input id="filterDateEnd" type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
            </div>
          </div>

          {filteredAndSortedOperations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-16 w-16 mb-4" />
                <p className="text-xl">No se encontraron operaciones.</p>
                <p>Intenta ajustar los filtros o cargar nuevas operaciones.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => requestSort('timestamp')} className="cursor-pointer hover:bg-accent">Fecha <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                    <TableHead onClick={() => requestSort('type')} className="cursor-pointer hover:bg-accent">Tipo <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                    {currentUser?.role === 'admin' && <TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-accent">Estado <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>}
                    <TableHead>Descripción</TableHead>
                    <TableHead onClick={() => requestSort('client')} className="cursor-pointer hover:bg-accent">Cliente <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                    <TableHead onClick={() => requestSort('amountIn')} className="text-right cursor-pointer hover:bg-accent">Entrada Total <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                    <TableHead onClick={() => requestSort('amountOut')} className="text-right cursor-pointer hover:bg-accent">Salida Total <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                    {currentUser?.role === 'admin' && <TableHead onClick={() => requestSort('executedAmountIn')} className="text-right cursor-pointer hover:bg-accent">Ejec. Entrada <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>}
                    {currentUser?.role === 'admin' && <TableHead onClick={() => requestSort('executedAmountOut')} className="text-right cursor-pointer hover:bg-accent">Ejec. Salida <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>}
                    <TableHead className="text-right">Cotización</TableHead>
                    {currentUser?.role === 'admin' && <TableHead onClick={() => requestSort('userId')} className="cursor-pointer hover:bg-accent">Usuario <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>}
                    {currentUser?.role === 'admin' && <TableHead className="text-center">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOperations.map(op => (
                    <TableRow key={op.id} className={cn(getStatusStyles(op.status))}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(op.timestamp), "dd/MM/yy HH:mm", { locale: es })}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{getOperationLabel(op.type)}</TableCell>
                      {currentUser?.role === 'admin' && <TableCell><StatusBadge status={op.status} /></TableCell>}
                      <TableCell className="text-xs max-w-[150px] truncate" title={op.description}>{op.description || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{getClientNameById(op.client) || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrencyDisplay(op.amountIn, op.currencyIn)}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">{formatCurrencyDisplay(op.amountOut, op.currencyOut)}</TableCell>
                      {currentUser?.role === 'admin' && <TableCell className="text-right text-xs text-green-500 whitespace-nowrap">{formatCurrencyDisplay(op.executedAmountIn, op.currencyIn)}</TableCell>}
                      {currentUser?.role === 'admin' && <TableCell className="text-right text-xs text-red-500 whitespace-nowrap">{formatCurrencyDisplay(op.executedAmountOut, op.currencyOut)}</TableCell>}
                      <TableCell className="text-right text-xs whitespace-nowrap">{op.rate ? Number(op.rate).toFixed(4) : '-'}</TableCell>
                      {currentUser?.role === 'admin' && <TableCell className="text-xs whitespace-nowrap">{op.userId}</TableCell>}
                      {currentUser?.role === 'admin' && (
                        <TableCell className="text-center space-x-1 whitespace-nowrap">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => handleEdit(op)}><Edit3 size={16}/></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"><Trash2 size={16}/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive">¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la operación.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(op.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {operationToEdit && currentUser?.role === 'admin' && (
        <EditOperationDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen} 
          operation={operationToEdit}
          onSave={handleSaveEdit}
        />
      )}
    </motion.div>
  );
};

export default TransactionsPage;
