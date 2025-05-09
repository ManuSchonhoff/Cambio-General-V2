
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea.jsx';
import { useToast } from "@/components/ui/use-toast";
import { Users, PlusCircle, Edit, Trash2, AlertCircle, CheckCircle, Phone, Mail, Landmark as BankIcon, Bitcoin, Save, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ClientDetailField = ({ label, value, onChange, name, placeholder, type = "text" }) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="text-xs text-muted-foreground">{label}</Label>
    {type === "textarea" ? (
       <Textarea id={name} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="h-20"/>
    ) : (
       <Input type={type} id={name} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} />
    )}
  </div>
);

const ClientsPage = () => {
  const { clients, addClient, updateClient, operations } = useOperations();
  const { toast } = useToast();
  const [newClientName, setNewClientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast({ title: "Error", description: "El nombre del cliente no puede estar vacío.", variant: "destructive", icon: <AlertCircle /> });
      return;
    }
    try {
      await addClient(newClientName, {}); // Add with empty additionalData initially
      toast({ title: "Cliente Agregado", description: `"${newClientName}" ha sido agregado.`, icon: <CheckCircle /> });
      setNewClientName('');
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive", icon: <AlertCircle /> });
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setEditFormData({
      name: client.name,
      phone: client.additionalData?.phone || '',
      email: client.additionalData?.email || '',
      bankAccount: client.additionalData?.bankAccount || '',
      cryptoAddress: client.additionalData?.cryptoAddress || '',
      cryptoNetwork: client.additionalData?.cryptoNetwork || '',
      notes: client.additionalData?.notes || '',
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClientChanges = () => {
    if (!selectedClient) return;
    if (!editFormData.name?.trim()) {
        toast({ title: "Error", description: "El nombre del cliente no puede estar vacío.", variant: "destructive" });
        return;
    }
    const updatedClientData = {
      ...selectedClient,
      name: editFormData.name,
      additionalData: {
        phone: editFormData.phone,
        email: editFormData.email,
        bankAccount: editFormData.bankAccount,
        cryptoAddress: editFormData.cryptoAddress,
        cryptoNetwork: editFormData.cryptoNetwork,
        notes: editFormData.notes,
      }
    };
    try {
        updateClient(selectedClient.id, updatedClientData);
        toast({ title: "Cliente Actualizado", description: `Los datos de "${updatedClientData.name}" han sido guardados.`, icon: <CheckCircle /> });
        setSelectedClient(updatedClientData); // Update selected client state
    } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDeleteClient = (clientId) => {
     toast({ title: "Función no implementada", description: "La eliminación de clientes requiere una base de datos para asegurar la integridad de los datos. Esta función se implementará con Supabase.", variant: "default" });
     console.warn("Delete client functionality requires backend or advanced localStorage logic not yet implemented.", clientId);
  };

  const filteredClients = useMemo(() => 
    clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name)),
  [clients, searchTerm]);
  
  const getClientInsights = (clientId) => {
    const clientOps = operations.filter(op => op.client === clientId && op.status === 'completed');
    let totalInputARS = 0;
    let totalOutputARS = 0;

    clientOps.forEach(op => {
        (op.executions || []).forEach(exec => {
            if (exec.currencyIn === 'ARS') totalInputARS += exec.amountIn || 0;
            if (exec.currencyOut === 'ARS') totalOutputARS += exec.amountOut || 0;
            // Simplistic for now, could expand for other currencies with rates
        });
    });
    return {
        operationCount: clientOps.length,
        totalInputARS,
        totalOutputARS,
    };
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg border-t-4 border-teal-500">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-teal-600">
              <Users className="h-7 w-7" /> Clientes
            </CardTitle>
            <CardDescription>Agrega nuevos clientes y selecciona uno para ver/editar detalles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddClient} className="space-y-3">
              <div>
                <Label htmlFor="newClientName">Nombre del Nuevo Cliente</Label>
                <Input id="newClientName" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ej: Juan Pérez" />
              </div>
              <Button type="submit" className="w-full gradient-blue-bg text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Cliente
              </Button>
            </form>
            
            <div className="space-y-1">
              <Label htmlFor="searchClient">Buscar Cliente</Label>
              <Input id="searchClient" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Escribe para filtrar..." />
            </div>

            {filteredClients.length === 0 ? (
              <p className="text-muted-foreground text-center py-3">No hay clientes.</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {filteredClients.map(client => (
                  <Button 
                    key={client.id} 
                    variant={selectedClient?.id === client.id ? "secondary" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => handleSelectClient(client)}
                  >
                    {client.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        {selectedClient ? (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold text-primary">{editFormData.name}</CardTitle>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive-outline" size="sm" disabled>
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar Cliente
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La eliminación de clientes está deshabilitada en esta versión.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteClient(selectedClient.id)} disabled>Eliminar (Deshabilitado)</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
              <CardDescription>ID: {selectedClient.id.substring(0,8)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClientDetailField label="Nombre Completo" name="name" value={editFormData.name} onChange={handleEditFormChange} placeholder="Nombre del cliente"/>
                <ClientDetailField label="Teléfono" name="phone" value={editFormData.phone} onChange={handleEditFormChange} placeholder="Ej: +54 9 11 ..."/>
                <ClientDetailField label="Email" name="email" type="email" value={editFormData.email} onChange={handleEditFormChange} placeholder="cliente@ejemplo.com"/>
                <ClientDetailField label="Cuenta Bancaria (CBU/Alias)" name="bankAccount" value={editFormData.bankAccount} onChange={handleEditFormChange} placeholder="CBU o Alias"/>
                <ClientDetailField label="Dirección Crypto" name="cryptoAddress" value={editFormData.cryptoAddress} onChange={handleEditFormChange} placeholder="Ej: 0x... o T..."/>
                <ClientDetailField label="Red Crypto" name="cryptoNetwork" value={editFormData.cryptoNetwork} onChange={handleEditFormChange} placeholder="Ej: ERC20, TRC20, BTC"/>
              </div>
              <ClientDetailField label="Notas Adicionales" name="notes" type="textarea" value={editFormData.notes} onChange={handleEditFormChange} placeholder="Información relevante sobre el cliente..."/>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedClient(null)}><XCircle className="mr-2 h-4 w-4"/> Deseleccionar</Button>
                <Button onClick={handleSaveClientChanges} className="gradient-blue-bg text-white"><Save className="mr-2 h-4 w-4"/> Guardar Cambios</Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="shadow-lg flex flex-col items-center justify-center min-h-[300px]">
            <CardContent className="text-center">
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Selecciona un cliente</p>
              <p className="text-sm text-muted-foreground">Elige un cliente de la lista para ver o editar sus detalles.</p>
            </CardContent>
          </Card>
        )}
        {selectedClient && (
            <Card className="mt-6 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Resumen de Operaciones (ARS - Completadas)</CardTitle>
                </CardHeader>
                <CardContent>
                    {(() => {
                        const insights = getClientInsights(selectedClient.id);
                        return (
                            <div className="space-y-2 text-sm">
                                <p>Operaciones Completadas Registradas: <span className="font-medium">{insights.operationCount}</span></p>
                                <p>Total Entregado por Cliente (ARS): <span className="font-medium text-green-600">{insights.totalInputARS.toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</span></p>
                                <p>Total Recibido por Cliente (ARS): <span className="font-medium text-red-600">{insights.totalOutputARS.toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</span></p>
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>
        )}
      </div>
    </motion.div>
  );
};

export default ClientsPage;
