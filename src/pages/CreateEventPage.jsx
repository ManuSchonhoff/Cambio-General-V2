
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '@/context/EventContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { CalendarPlus } from 'lucide-react';

const CreateEventPage = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const { addEvent } = useEvents();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventName || !eventDate || !eventLocation || !eventPrice || !eventDescription) {
       toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(eventPrice);
     if (isNaN(price) || price < 0) {
      toast({
        title: "Error de validación",
        description: "El precio debe ser un número positivo o cero.",
        variant: "destructive",
      });
      return;
    }

    addEvent({
      name: eventName,
      date: eventDate,
      location: eventLocation,
      price: price,
      description: eventDescription,
    });

    toast({
      title: "Éxito",
      description: `El evento "${eventName}" ha sido creado.`,
    });

    navigate('/events');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2">
         <CalendarPlus className="h-8 w-8 text-primary" /> Crear Nuevo Evento
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
        <div className="space-y-2">
          <Label htmlFor="eventName">Nombre del Evento</Label>
          <Input
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Ej: Concierto de Rock Acústico"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="eventDate">Fecha y Hora</Label>
                <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="eventLocation">Ubicación</Label>
                <Input
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Ej: Teatro Principal"
                    required
                />
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventPrice">Precio del Ticket General (USD)</Label>
          <Input
            id="eventPrice"
            type="number"
            value={eventPrice}
            onChange={(e) => setEventPrice(e.target.value)}
            placeholder="Ej: 25.50 (o 0 para gratis)"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventDescription">Descripción</Label>
          <Textarea
            id="eventDescription"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Describe tu evento..."
            rows={5}
            required
          />
        </div>
        <Button type="submit" className="w-full gradient-bg text-white" size="lg">
          Crear Evento
        </Button>
      </form>
    </motion.div>
  );
};

export default CreateEventPage;
