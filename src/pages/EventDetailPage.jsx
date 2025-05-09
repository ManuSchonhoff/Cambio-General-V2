
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '@/context/EventContext.jsx';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign, Info, ArrowLeft, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/components/ui/use-toast";

const EventDetailPage = () => {
  const { id } = useParams();
  const { getEventById } = useEvents();
  const navigate = useNavigate();
  const { toast } = useToast();
  const event = getEventById(id);

  if (!event) {
    toast({
        title: "Error",
        description: "Evento no encontrado.",
        variant: "destructive",
      })
    return (
        <div className="text-center py-16">
            <h1 className="text-2xl font-semibold mb-4">Evento no encontrado</h1>
            <p className="text-muted-foreground mb-6">El evento que buscas no existe o ha sido eliminado.</p>
            <Button onClick={() => navigate('/events')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
            </Button>
        </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>
      <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
         <div className="relative h-64 md:h-96 w-full">
           <img 
            className="absolute inset-0 w-full h-full object-cover"
            alt={`Imagen de ${event.name}`}
            src={event.imageUrl || "https://images.unsplash.com/photo-1703757931698-6b905414d019"} />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-6 text-white">
             <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
             <div className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                {event.location}
             </div>
           </div>
         </div>

        <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="flex items-start p-4 bg-muted/50 rounded-lg border">
                    <Calendar className="h-5 w-5 mr-3 mt-1 text-primary flex-shrink-0" />
                    <div>
                        <span className="font-semibold">Fecha y Hora</span>
                        <p className="text-muted-foreground">{format(new Date(event.date), "PPPP 'a las' HH:mm 'hs.'", { locale: es })}</p>
                    </div>
                </div>
                <div className="flex items-start p-4 bg-muted/50 rounded-lg border">
                    <DollarSign className="h-5 w-5 mr-3 mt-1 text-green-500 flex-shrink-0" />
                    <div>
                        <span className="font-semibold">Precio Ticket General</span>
                        <p className="text-muted-foreground">{event.price > 0 ? `$${event.price.toFixed(2)}` : 'Gratis'}</p>
                    </div>
                </div>
            </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold flex items-center"><Info className="h-5 w-5 mr-2 text-primary" /> Descripción</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="w-full gradient-bg text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Link to={`/checkout/${event.id}`}>
                Comprar Tickets
                <Ticket className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetailPage;
