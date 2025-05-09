
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Users, PieChart, DollarSign, TrendingUp, TrendingDown, PlusCircle, Edit3, Info, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FormattedInput from '@/components/FormattedInput.jsx';
import { useToast } from "@/components/ui/use-toast.js";

const SOCIO_OPERATION_TYPES = {
  APORTE: "aporte_capital",
  RETIRO: "retiro_capital",
  DIVIDENDO: "dividendos_pagados" 
};

// Simulación de datos de socios - idealmente vendría de una BBDD o un estado global más complejo
const initialPartnersData = [
  { id: "socio_1", name: "Socio A", sharePercentage: 50 },
  { id: "socio_2", name: "Socio B", sharePercentage: 30 },
  { id: "socio_3", name: "Socio C", sharePercentage: 20 },
];

const PartnerFormDialog = ({ open, onOpenChange, partner, onSave }) => {
    const [name, setName] = useState('');
    const [sharePercentage, setSharePercentage] = useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        if (partner) {
            setName(partner.name);
            setSharePercentage(partner.sharePercentage);
        } else {
            setName('');
            setSharePercentage('');
        }
    }, [partner, open]);

    const handleSubmit = () => {
        const numericShare = parseFloat(sharePercentage);
        if (!name.trim()) {
            toast({ title: "Error", description: "El nombre del socio es requerido.", variant: "destructive" });
            return;
        }
        if (isNaN(numericShare) || numericShare <= 0 || numericShare > 100) {
            toast({ title: "Error", description: "El porcentaje de tenencia debe ser un número entre 0 y 100.", variant: "destructive" });
            return;
        }
        onSave({ id: partner?.id, name, sharePercentage: numericShare });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-primary">{partner ? 'Editar Socio' : 'Agregar Nuevo Socio'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="partner-name">Nombre del Socio</Label>
                        <Input id="partner-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
                    </div>
                    <div>
                        <Label htmlFor="partner-share">Porcentaje de Tenencia (%)</Label>
                        <FormattedInput id="partner-share" value={sharePercentage} onChange={(e) => setSharePercentage(e.target.value)} placeholder="Ej: 40" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="gradient-blue-bg text-white"><Save className="mr-2 h-4 w-4" />{partner ? 'Guardar Cambios' : 'Agregar Socio'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const SocietyPage = () => {
  const { operations, clients, addClient } = useOperations(); 
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [partners, setPartners] = useState(() => {
    const savedPartners = localStorage.getItem('accountingPartners_v1');
    return savedPartners ? JSON.parse(savedPartners) : initialPartnersData;
  });

  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  React.useEffect(() => {
    localStorage.setItem('accountingPartners_v1', JSON.stringify(partners));
  }, [partners]);

  const handleSavePartner = (partnerData) => {
     setPartners(prev => {
        if (partnerData.id) { // Editing
            return prev.map(p => p.id === partnerData.id ? {...p, ...partnerData} : p);
        } else { // Adding
            return [...prev, {...partnerData, id: `socio_${Date.now()}`}];
        }
     });
     toast({title: "Socio Guardado", description: `Los datos de ${partnerData.name} se han guardado.`});
  };

  const partnerOperations = useMemo(() => {
    const partnerClientIds = clients.filter(c => partners.some(p => p.name.toLowerCase() === c.name.toLowerCase())).map(c => c.id);
    
    return operations.filter(op => 
      (Object.values(SOCIO_OPERATION_TYPES).includes(op.type)) &&
      (op.client && partnerClientIds.includes(op.client)) // Ensure client is one of the partners
    );
  }, [operations, partners, clients]);


  const partnerDetails = useMemo(() => {
    return partners.map(partner => {
      const clientRecord = clients.find(c => c.name.toLowerCase() === partner.name.toLowerCase());
      const clientId = clientRecord?.id;

      let capitalAportado = 0;
      let dividendosRecibidos = 0;
      let retiros = 0;

      partnerOperations.forEach(op => {
        if (op.client === clientId) {
          op.executions.forEach(exec => {
            if (op.type === SOCIO_OPERATION_TYPES.APORTE) {
              capitalAportado += exec.amountIn || 0; // Assuming ARS or need conversion
            } else if (op.type === SOCIO_OPERATION_TYPES.RETIRO) {
              retiros += exec.amountOut || 0; // Assuming ARS
            } else if (op.type === SOCIO_OPERATION_TYPES.DIVIDENDO) {
              dividendosRecibidos += exec.amountOut || 0; // Assuming ARS
            }
          });
        }
      });
      return { ...partner, capitalAportado, dividendosRecibidos, retiros };
    });
  }, [partners, partnerOperations, clients]);

  const totalCapitalAportado = partnerDetails.reduce((sum, p) => sum + p.capitalAportado, 0);
  const totalDividendos = partnerDetails.reduce((sum, p) => sum + p.dividendosRecibidos, 0);
  const totalRetiros = partnerDetails.reduce((sum, p) => sum + p.retiros, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-purple-500">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold flex items-center gap-2 text-purple-600">
                <Building className="h-8 w-8" /> Gestión Societaria
            </CardTitle>
            {currentUser?.role === 'admin' && (
                <Button onClick={() => { setEditingPartner(null); setIsPartnerFormOpen(true); }} className="gradient-blue-bg text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar Socio
                </Button>
            )}
          </div>
          <CardDescription>Información sobre aportes, dividendos, tenencia y retiros de capital de los socios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-purple-50 dark:bg-purple-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-1"><DollarSign className="h-5 w-5 text-purple-500"/>Capital Aportado Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCapitalAportado, "ARS")}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-1"><TrendingUp className="h-5 w-5 text-green-500"/>Dividendos Pagados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDividendos, "ARS")}</p>
              </CardContent>
            </Card>
             <Card className="bg-red-50 dark:bg-red-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-1"><TrendingDown className="h-5 w-5 text-red-500"/>Retiros de Capital</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRetiros, "ARS")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Users className="h-6 w-6"/>Detalle por Socio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Socio</th>
                      <th className="text-center p-3 font-semibold">Tenencia (%)</th>
                      <th className="text-right p-3 font-semibold">Capital Aportado</th>
                      <th className="text-right p-3 font-semibold">Dividendos</th>
                      <th className="text-right p-3 font-semibold">Retiros</th>
                      {currentUser?.role === 'admin' && <th className="text-center p-3 font-semibold">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {partnerDetails.map(p => (
                      <tr key={p.id} className="border-b hover:bg-accent">
                        <td className="p-3">{p.name}</td>
                        <td className="text-center p-3">{p.sharePercentage}%</td>
                        <td className="text-right p-3">{formatCurrency(p.capitalAportado, "ARS")}</td>
                        <td className="text-right p-3 text-green-600">{formatCurrency(p.dividendosRecibidos, "ARS")}</td>
                        <td className="text-right p-3 text-red-600">{formatCurrency(p.retiros, "ARS")}</td>
                        {currentUser?.role === 'admin' && (
                            <td className="text-center p-3">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setEditingPartner(p); setIsPartnerFormOpen(true);}}>
                                    <Edit3 size={16}/>
                                </Button>
                            </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
           <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/30">
             <p className="text-blue-700 dark:text-blue-300 flex items-start">
               <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
               <span>
                 <span className="font-semibold">Nota:</span> Los datos societarios se calculan a partir de operaciones completadas (Aporte de Capital, Retiro de Capital, Dividendos Pagados) asociadas a un cliente cuyo nombre coincida con un socio registrado.
                 Asegúrate de que los nombres de los socios existan como clientes y que las operaciones se registren correctamente para una visualización precisa. Todos los montos se asumen en ARS para este resumen.
               </span>
             </p>
           </div>
        </CardContent>
      </Card>
      {currentUser?.role === 'admin' && (
        <PartnerFormDialog
            open={isPartnerFormOpen}
            onOpenChange={setIsPartnerFormOpen}
            partner={editingPartner}
            onSave={handleSavePartner}
        />
      )}
    </motion.div>
  );
};

export default SocietyPage;
