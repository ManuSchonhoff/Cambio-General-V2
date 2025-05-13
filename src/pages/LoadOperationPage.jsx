import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, ArrowRightLeft, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/SearchableSelect.jsx';

// Definición de tipos de operación base
export const baseOperationTypes = [
  { value: "compra_divisa", label: "Compra Divisa", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out' },
  { value: "venta_divisa", label: "Venta Divisa", icon: ArrowRightLeft, isTransactional: true, flow: 'in_out' },
];

// Definición de tipos de operación exclusivos para administradores
export const adminOnlyOperationTypes = [
  { value: "asiento_base", label: "Asiento Base / Constitución", icon: Settings2, isTransactional: false, flow: 'in' },
  { value: "ajuste_caja", label: "Ajuste de Caja", icon: Settings2, isTransactional: false, flow: 'in_out_selectable' },
];

const LoadOperationPage = () => {
  const { addOperation, clients } = useOperations();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [operationType, setOperationType] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const availableOperationTypes = useMemo(() => {
    let types = [...baseOperationTypes];
    if (currentUser?.role === 'admin') {
      types = [...types, ...adminOnlyOperationTypes];
    }
    return types.sort((a, b) => a.label.localeCompare(b.label));
  }, [currentUser]);

  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      toast({ title: "Error", description: "El nombre del nuevo cliente no puede estar vacío.", variant: "destructive" });
      return;
    }
    try {
      const newClientData = await addOperation(newClientName, {}); 
      setClient(newClientData.id);
      setNewClientName('');
      toast({ title: "Éxito", description: `Cliente "${newClientData.name}" agregado.` });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!operationType) {
      toast({ title: "Error", description: "Selecciona un tipo de operación.", variant: "destructive" });
      return;
    }

    addOperation({
      type: operationType,
      description: description.trim(),
      client: client || null,
    });

    toast({ title: "Éxito", description: "Operación registrada." });
    setOperationType('');
    setDescription('');
    setClient('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-primary">
            <PlusCircle className="h-8 w-8" /> Cargar Nueva Operación
          </CardTitle>
          <CardDescription>Registra operaciones financieras y movimientos de caja.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Tipo de Operación</Label>
              <SearchableSelect
                options={availableOperationTypes.map((type) => ({
                  value: type.value,
                  label: type.label,
                }))}
                value={operationType}
                onValueChange={setOperationType}
                placeholder="Selecciona un tipo de operación"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la operación"
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <SearchableSelect
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.name,
                }))}
                value={client}
                onValueChange={setClient}
                placeholder="Selecciona un cliente"
              />
            </div>

            <div className="space-y-2">
              <Label>Agregar Nuevo Cliente</Label>
              <div className="flex gap-2">
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nombre del nuevo cliente"
                />
                <Button onClick={handleAddNewClient} type="button" variant="secondary">
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <CardFooter className="md:col-span-2">
              <Button type="submit" className="w-full gradient-blue-bg text-white" size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Registrar Operación
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoadOperationPage;