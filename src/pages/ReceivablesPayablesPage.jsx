
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Coins as HandCoins, HeartHandshake as Handshake, Info, CheckCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { baseOperationTypes, adminOnlyOperationTypes } from '@/pages/LoadOperationPage.jsx';

const ReceivablesPayablesPage = () => {
  const { pendingOperations, clients, userProfiles } = useOperations();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const allDisplayableOperationTypes = useMemo(() => {
    return [...baseOperationTypes, ...adminOnlyOperationTypes];
  }, []);

  const getOperationLabel = (value) => {
    const type = allDisplayableOperationTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Desconocido';
  };
  
  const getUserNameById = (userId) => {
    if (!userId) return 'N/A';
    const profile = userProfiles.find(p => p.id === userId);
    return profile ? profile.username : userId?.substring(0,8) || 'N/A'; 
  };

  const receivables = useMemo(() => {
    return pendingOperations.filter(op => 
      (op.type === 'deuda_nos_deben' || op.type === 'prestamo_otorgado') && 
      (op.status === 'pending' || op.status === 'partial')
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [pendingOperations]);

  const payables = useMemo(() => {
    return pendingOperations.filter(op => 
      (op.type === 'deuda_debemos' || op.type === 'prestamo_recibido') &&
      (op.status === 'pending' || op.status === 'partial')
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [pendingOperations]);

  const handleSettleDebt = (originalOperation, settlementType) => {
    // settlementType: 'cobro_deuda_otorgada' or 'pago_deuda_recibida'
    const amountToSettle = originalOperation.type === 'deuda_nos_deben' || originalOperation.type === 'prestamo_otorgado' 
        ? originalOperation.remainingAmountOut 
        : originalOperation.remainingAmountIn;
    const currency = originalOperation.type === 'deuda_nos_deben' || originalOperation.type === 'prestamo_otorgado'
        ? originalOperation.currencyOut
        : originalOperation.currencyIn;

    const description = `Liquidación de ${getOperationLabel(originalOperation.type)} ID: ${originalOperation.id.substring(0,8)}. Cliente: ${getClientName(originalOperation.client)}`;
    
    // Navigate to LoadOperationPage with pre-filled data (conceptual)
    // Actual pre-filling would require more complex state management or query params
    toast({
      title: "Redirigiendo para Liquidar Deuda",
      description: `Prepara una operación de "${getOperationLabel(settlementType)}" por ${formatCurrency(amountToSettle, currency)}.`,
    });
    navigate('/', { 
        state: { 
            prefill_type: settlementType,
            prefill_amount: amountToSettle,
            prefill_currency: currency,
            prefill_client: originalOperation.client,
            prefill_description: description,
            prefill_related_op: originalOperation.id
        }
    });
  };


  const renderTable = (data, type) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <Info className="mx-auto h-12 w-12 mb-4 text-slate-400" />
          <p className="text-xl font-semibold">No hay {type === 'receivable' ? 'cuentas por cobrar' : 'cuentas por pagar'} pendientes.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Reg.</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto Pendiente</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Registró</TableHead>
              {currentUser?.role === 'admin' && <TableHead>Op. de</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(op => {
              const pendingAmount = type === 'receivable' ? op.remainingAmountOut : op.remainingAmountIn;
              const currency = type === 'receivable' ? op.currencyOut : op.currencyIn;
              const settlementActionType = type === 'receivable' ? 'cobro_deuda_otorgada' : 'pago_deuda_recibida';
              return (
                <TableRow key={op.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(op.timestamp).toLocaleDateString('es-AR')}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{getOperationLabel(op.type)}</TableCell>
                  <TableCell className="whitespace-nowrap">{getClientName(op.client)}</TableCell>
                  <TableCell className={`whitespace-nowrap font-semibold ${type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(pendingAmount, currency)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate whitespace-nowrap text-xs" title={op.description}>{op.description || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{getUserNameById(op.userId)}</TableCell>
                  {currentUser?.role === 'admin' && <TableCell className="whitespace-nowrap text-xs">{getUserNameById(op.ownerId)}</TableCell>}
                  <TableCell className="text-right">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSettleDebt(op, settlementActionType)}
                        className="h-8 px-2 border-primary text-primary hover:bg-primary/10"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> {type === 'receivable' ? 'Registrar Cobro' : 'Registrar Pago'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-indigo-600">
            <HandCoins className="h-8 w-8" /> Cuentas por Cobrar y Pagar
          </CardTitle>
          <CardDescription>
            Seguimiento de deudas pendientes (préstamos otorgados/recibidos y otras deudas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receivables" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="receivables" className="text-lg">
                <HandCoins className="mr-2 h-5 w-5 text-green-500"/> Por Cobrar ({receivables.length})
              </TabsTrigger>
              <TabsTrigger value="payables" className="text-lg">
                <Handshake className="mr-2 h-5 w-5 text-red-500"/> Por Pagar ({payables.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="receivables">
              <Card>
                <CardHeader>
                  <CardTitle>Cuentas por Cobrar</CardTitle>
                  <CardDescription>Deudas que otros tienen contigo.</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderTable(receivables, 'receivable')}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payables">
              <Card>
                <CardHeader>
                  <CardTitle>Cuentas por Pagar</CardTitle>
                  <CardDescription>Deudas que tienes con otros.</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderTable(payables, 'payable')}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReceivablesPayablesPage;
