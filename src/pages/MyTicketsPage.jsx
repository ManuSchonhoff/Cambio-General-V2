
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '@/context/EventContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MyTicketsPage = () => {
  const { getMyTickets } = useEvents();
  const tickets = getMyTickets();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-bold tracking-tight text-center flex items-center justify-center gap-2">
        <Ticket className="h-8 w-8 text-primary"/> Mis Tickets Comprados
      </h1>
      {tickets.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <p className="text-xl mb-4">Aún no has comprado ningún ticket.</p>
          <Button asChild>
            <Link to="/events">Explorar Eventos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="ticket-pattern relative border-dashed border-2 border-primary/50 shadow-md overflow-hidden h-full flex flex-col bg-white dark:bg-gray-800">
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-background dark:bg-gray-900 rounded-full border-dashed border-2 border-primary/50 border-l-transparent"></div>
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-background dark:bg-gray-900 rounded-full border-dashed border-2 border-primary/50 border-r-transparent"></div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-primary">{ticket.eventName}</CardTitle>
                  <CardDescription>Ticket ID: {ticket.id.substring(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  <div className="flex items-center">
                    <Ticket className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span>Cantidad: {ticket.quantity}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    <span>Total Pagado: ${ticket.totalPrice.toFixed(2)}</span>
                  </div>
                   <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span>Comprado: {format(new Date(ticket.purchaseDate), "dd MMM yyyy, HH:mm", { locale: es })}</span>
                  </div>
                </CardContent>
                 <div className="p-4 pt-0 mt-auto text-center">
                   <Button variant="outline" size="sm" asChild>
                        <Link to={`/events/${ticket.eventId}`}>Ver Evento</Link>
                   </Button>
                 </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyTicketsPage;
