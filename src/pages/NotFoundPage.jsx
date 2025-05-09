
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center space-y-6 py-16"
    >
      <AlertTriangle className="h-16 w-16 text-yellow-500" />
      <h1 className="text-4xl font-bold">Página No Encontrada</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>
      <Button asChild className="gradient-blue-bg text-white">
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Link>
      </Button>
    </motion.div>
  );
};

export default NotFoundPage;
