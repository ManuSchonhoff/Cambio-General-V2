
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '@/context/EventContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EventsPage = () => {
  const { events } = useEvents();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <h1 className="text-4xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 pb-2">
        Eventos Disponibles
      </h1>
      {events.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <p className="text-xl mb-4">Actualmente no hay eventos disponibles.</p>
          <Button asChild>
            <Link to="/create-event">Crea el primer evento</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="event-card overflow-hidden h-full flex flex-col">
                <div className="relative h-48 w-full">
                   <img 
                    className="absolute inset-0 w-full h-full object-cover"
                    alt={`Imagen de ${event.name}`}
                    src="https://images.unsplash.com/photo-1703757931698-6b905414d019" />
                   <div className="absolute inset-0 bg-black/30"></div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{event.name}</CardTitle>
                  <CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
                    <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    {event.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                   <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
                    <span>{format(new Date(event.date), "PPP 'a las' HH:mm", { locale: es })}</span>
                  </div>
                   <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-1.5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{event.price > 0 ? `$${event.price.toFixed(2)}` : 'Gratis'}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full gradient-bg text-white">
                    <Link to={`/events/${event.id}`}>Ver Detalles</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EventsPage;

