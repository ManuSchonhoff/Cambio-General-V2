
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Ticket, CalendarPlus } from 'lucide-react';

const HomePage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center space-y-8 pt-16"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        className="relative w-32 h-32 mb-4"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-70"></div>
        <Ticket className="relative w-full h-full text-white p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-lg" />
      </motion.div>

      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500"
      >
        Bienvenido a Ticket General
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-lg md:text-xl text-muted-foreground max-w-2xl"
      >
        Tu plataforma central para descubrir, crear y vender tickets para los eventos más emocionantes. ¡Empieza ahora!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 pt-4"
      >
        <Button asChild size="lg" className="gradient-bg text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <Link to="/events">
            Explorar Eventos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/create-event">
            Crear un Evento
            <CalendarPlus className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </motion.div>

      <div className="pt-12 w-full max-w-4xl">
        <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="text-3xl font-semibold mb-6"
        >
            Cómo funciona
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="p-6 border rounded-lg bg-card shadow-sm"
            >
                <h3 className="text-lg font-semibold mb-2 text-primary">1. Descubre</h3>
                <p className="text-sm text-muted-foreground">Encuentra eventos cerca de ti o explora categorías.</p>
            </motion.div>
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="p-6 border rounded-lg bg-card shadow-sm"
            >
                <h3 className="text-lg font-semibold mb-2 text-primary">2. Compra</h3>
                <p className="text-sm text-muted-foreground">Compra tickets de forma segura y rápida.</p>
            </motion.div>
             <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="p-6 border rounded-lg bg-card shadow-sm"
            >
                <h3 className="text-lg font-semibold mb-2 text-primary">3. Crea</h3>
                <p className="text-sm text-muted-foreground">Publica tu propio evento y vende entradas fácilmente.</p>
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
