
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOperations } from '@/context/OperationContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShieldAlert, ListChecks, FileJson } from 'lucide-react';

const AdminLogPage = () => {
  const { getAdminActivityLog } = useOperations();
  const logs = useMemo(() => getAdminActivityLog(), [getAdminActivityLog]);

  const formatDetails = (details) => {
    if (typeof details === 'object' && details !== null) {
      return JSON.stringify(details, null, 2);
    }
    return String(details);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="shadow-lg border-t-4 border-amber-500">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-8 w-8" /> Log de Actividad del Administrador
          </CardTitle>
          <CardDescription>Registro de acciones importantes realizadas por administradores (simulado, guardado en localStorage).</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="mx-auto h-16 w-16 mb-4" />
                <p className="text-xl">No hay actividades registradas.</p>
                <p>Las acciones de administrador como editar o eliminar operaciones se registrarán aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario Admin</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yy HH:mm:ss", { locale: es })}
                      </TableCell>
                      <TableCell className="text-xs">{log.userId}</TableCell>
                      <TableCell className="font-medium text-xs">{log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>
                      <TableCell className="text-xs">
                        <details className="max-w-md cursor-pointer">
                            <summary className="hover:text-primary flex items-center gap-1">
                                <FileJson size={14}/> Ver JSON
                            </summary>
                            <pre className="mt-1 p-2 bg-muted/50 rounded text-xs max-h-40 overflow-auto">{formatDetails(log.details)}</pre>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminLogPage;
