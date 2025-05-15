
import React, { useState, useEffect } from 'react';
import { useOperations } from '@/context/OperationContext.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Filter, Download, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient.jsx'; 

const AdminLogPage = () => {
  const { adminLog, userProfiles } = useOperations();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'descending' });

  useEffect(() => {
    let logs = [...adminLog];

    if (searchTerm) {
      logs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.adminUsername && log.adminUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    logs.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setFilteredLogs(logs);
  }, [adminLog, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-2 h-4 w-4 inline transform rotate-180" /> : <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 inline opacity-50" />;
  };
  
  const getUserNameById = (userId) => {
    const profile = userProfiles.find(p => p.id === userId);
    return profile ? profile.username : userId.substring(0,8);
  };


  const downloadLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Timestamp,Admin,Action,Details\n"
      + filteredLogs.map(log => {
        const timestamp = format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss", { locale: es });
        const admin = log.adminUsername || getUserNameById(log.adminId) ;
        const action = log.action;
        const details = JSON.stringify(log.details).replace(/"/g, '""'); // Escape double quotes
        return `"${timestamp}","${admin}","${action}","${details}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admin_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Registro de Actividad del Administrador</h1>
        <Button onClick={downloadLogs} variant="outline" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
          <Download className="mr-2 h-4 w-4" /> Descargar CSV
        </Button>
      </div>

      <div className="mb-6 p-4 bg-card rounded-lg shadow-md">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filtrar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border-border focus:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)] bg-card rounded-lg shadow-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
            <TableRow>
              <TableHead onClick={() => requestSort('timestamp')} className="cursor-pointer hover:bg-muted">
                Fecha y Hora {getSortIndicator('timestamp')}
              </TableHead>
              <TableHead onClick={() => requestSort('adminUsername')} className="cursor-pointer hover:bg-muted">
                Admin {getSortIndicator('adminUsername')}
              </TableHead>
              <TableHead onClick={() => requestSort('action')} className="cursor-pointer hover:bg-muted">
                Acción {getSortIndicator('action')}
              </TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-sm">
                    {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm:ss", { locale: es })}
                  </TableCell>
                  <TableCell className="text-sm">{log.adminUsername || getUserNameById(log.adminId)}</TableCell>
                  <TableCell className="text-sm">{log.action}</TableCell>
                  <TableCell className="text-xs max-w-md">
                    <pre className="whitespace-pre-wrap break-all bg-muted/30 p-2 rounded-md font-mono">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="4" className="text-center text-muted-foreground py-10">
                  No hay registros que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </motion.div>
  );
};

export default AdminLogPage;
