
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, FileText, Info, ListFilter, PlusCircle, Trash2, Edit3, Save, Settings2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/components/ui/use-toast.js";
import SearchableSelect from '@/components/SearchableSelect.jsx';
import { baseOperationTypes as importedBaseOperationTypes, adminOnlyOperationTypes as importedAdminOnlyOperationTypes } from '@/pages/LoadOperationPage.jsx';


const ManageExpenseCategoriesDialog = ({ open, onOpenChange, currentCategories, availableOperationTypes, onAddCategory, onRemoveCategory }) => {
    const [selectedTypeToAdd, setSelectedTypeToAdd] = useState('');
    const { toast } = useToast();

    const operationTypeOptions = availableOperationTypes
        .filter(type => !type.isTransactional && !currentCategories.includes(type.value)) 
        .map(type => ({ value: type.value, label: type.label, icon: type.icon }));
    
    const getOperationTypeLabel = (value) => {
        const type = availableOperationTypes.find(t => t.value === value);
        return type ? type.label : value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleAdd = () => {
        if (!selectedTypeToAdd) {
            toast({ title: "Error", description: "Selecciona un tipo de operación para agregar.", variant: "destructive" });
            return;
        }
        onAddCategory(selectedTypeToAdd);
        setSelectedTypeToAdd(''); 
        toast({ title: "Categoría Agregada", description: `"${getOperationTypeLabel(selectedTypeToAdd)}" ahora se considera un gasto.` });
    };

    const handleRemove = (categoryType) => {
        onRemoveCategory(categoryType);
        toast({ title: "Categoría Eliminada", description: `"${getOperationTypeLabel(categoryType)}" ya no se considera un gasto.` });
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-primary flex items-center gap-2"><Settings2 /> Administrar Categorías de Gastos</DialogTitle>
                    <DialogDescription>
                        Define qué tipos de operación se consideran gastos para los informes. Estos tipos se guardan en localStorage.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="add-expense-category">Agregar Tipo de Operación como Gasto</Label>
                        <div className="flex items-center gap-2">
                            <SearchableSelect
                                id="add-expense-category"
                                options={operationTypeOptions}
                                value={selectedTypeToAdd}
                                onValueChange={setSelectedTypeToAdd}
                                placeholder="Seleccionar tipo..."
                                emptyText="No hay más tipos disponibles."
                            />
                            <Button onClick={handleAdd} size="icon" className="gradient-blue-bg text-white"><PlusCircle size={18}/></Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Categorías de Gastos Actuales</Label>
                        {currentCategories.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2 bg-background/50">
                                {currentCategories.map(category => (
                                    <div key={category} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                                        <span className="text-sm">{getOperationTypeLabel(category)}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => handleRemove(category)}>
                                            <Trash2 size={14}/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-3">No hay categorías de gastos definidas.</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const ExpensesPage = () => {
  const { operations, expenseCategories, addExpenseCategory, removeExpenseCategory } = useOperations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  const allDefinedOperationTypes = useMemo(() => {
    return [...importedBaseOperationTypes, ...importedAdminOnlyOperationTypes];
  }, []);


  const expenseOperations = useMemo(() => {
    return operations.filter(op => expenseCategories.includes(op.type));
  }, [operations, expenseCategories]);

  const aggregatedExpenses = useMemo(() => {
    const grouped = {};
    expenseOperations.forEach(op => {
        op.executions.forEach(exec => {
            const key = op.type;
            const currency = exec.currencyOut || exec.currencyIn;
            const uniqueKey = `${key}_${currency}`;

            if (!grouped[uniqueKey]) {
                grouped[uniqueKey] = { totalAmount: 0, currency: currency, count: 0, type: op.type, details: [] };
            }
            
            const amount = exec.amountOut || -(exec.amountIn || 0); 
            grouped[uniqueKey].totalAmount += amount;
            grouped[uniqueKey].count += 1;
            grouped[uniqueKey].details.push({
                date: op.timestamp,
                description: op.description || op.type,
                amount: amount,
                currency: currency
            });
        });
    });
    return Object.values(grouped);
  }, [expenseOperations]);

  const totalExpensesByCurrency = useMemo(() => {
    const totals = {};
    aggregatedExpenses.forEach(group => {
        if (!totals[group.currency]) {
            totals[group.currency] = 0;
        }
        totals[group.currency] += group.totalAmount;
    });
    return totals;
  }, [aggregatedExpenses]);

  const getOperationTypeLabel = (value) => {
    const type = allDefinedOperationTypes.find(t => t.value === value);
    return type ? type.label : value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-orange-500">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-3xl font-bold flex items-center gap-2 text-orange-600">
                        <TrendingDown className="h-8 w-8" /> Gestión de Gastos y Costos
                    </CardTitle>
                    <CardDescription>Visualiza los gastos y costos calculados a partir de las operaciones completadas.</CardDescription>
                </div>
                {currentUser?.role === 'admin' && (
                    <Button variant="outline" onClick={() => setIsManageCategoriesOpen(true)}>
                        <ListFilter className="mr-2 h-4 w-4" /> Administrar Categorías
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
          {expenseOperations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-16 w-16 mb-4" />
              <p className="text-xl">No hay gastos registrados.</p>
              <p>Carga operaciones de tipo gasto para verlas aquí. Puedes administrar qué tipos de operación cuentan como gastos.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Resumen Total de Gastos (Por Moneda)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {Object.keys(totalExpensesByCurrency).length > 0 ? 
                        Object.entries(totalExpensesByCurrency).map(([currency, total]) => (
                            <p key={currency} className="text-2xl font-bold text-orange-500">
                                {formatCurrency(total, currency)}
                            </p>
                        )) : <p className="text-muted-foreground">No hay gastos para mostrar.</p>
                    }
                  <p className="text-sm text-muted-foreground">Total de gastos registrados y completados.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Detalle de Gastos por Categoría y Moneda</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría de Gasto</TableHead>
                        <TableHead className="text-right">Monto Total</TableHead>
                        <TableHead className="text-center">Operaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregatedExpenses.sort((a,b) => getOperationTypeLabel(a.type).localeCompare(getOperationTypeLabel(b.type)) || a.currency.localeCompare(b.currency)).map((expenseGroup) => (
                        <TableRow key={`${expenseGroup.type}_${expenseGroup.currency}`}>
                          <TableCell className="font-medium">{getOperationTypeLabel(expenseGroup.type)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(expenseGroup.totalAmount, expenseGroup.currency)}</TableCell>
                          <TableCell className="text-center">{expenseGroup.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Últimos Gastos Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenseOperations.slice(0,20).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(op =>
                                op.executions.map(exec => (
                                    <TableRow key={exec.id}>
                                        <TableCell className="text-xs">{format(new Date(op.timestamp), "dd/MM/yy HH:mm", {locale: es})}</TableCell>
                                        <TableCell>{getOperationTypeLabel(op.type)}</TableCell>
                                        <TableCell className="text-xs max-w-xs truncate">{op.description || '-'}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(exec.amountOut || -(exec.amountIn || 0), exec.currencyOut || exec.currencyIn)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
           <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/30">
             <p className="text-blue-700 dark:text-blue-300 flex items-start">
               <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
               <span>
                 <span className="font-semibold">Nota:</span> Los gastos se calculan a partir de operaciones completadas con tipos de operación definidos como gastos. Puedes administrar estas categorías si eres administrador.
               </span>
             </p>
           </div>
        </CardContent>
      </Card>
      {currentUser?.role === 'admin' && (
        <ManageExpenseCategoriesDialog
            open={isManageCategoriesOpen}
            onOpenChange={setIsManageCategoriesOpen}
            currentCategories={expenseCategories}
            availableOperationTypes={allDefinedOperationTypes}
            onAddCategory={addExpenseCategory}
            onRemoveCategory={removeExpenseCategory}
        />
      )}
    </motion.div>
  );
};

export default ExpensesPage;
