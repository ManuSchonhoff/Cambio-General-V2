
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '@/context/EventContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Minus, Plus, Ticket } from 'lucide-react';

const CheckoutPage = () => {
  const { id } = useParams();
  const { getEventById, purchaseTicket } = useEvents();
  const navigate = useNavigate();
  const { toast } = useToast();
  const event = getEventById(id);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (event) {
      setTotalPrice(event.price * quantity);
    }
  }, [event, quantity]);

  if (!event) {
     toast({
        title: "Error",
        description: "Evento no encontrado.",
        variant: "destructive",
      })
    return (
        <div className="text-center py-16">
            <h1 className="text-2xl font-semibold mb-4">Evento no encontrado</h1>
             <p className="text-muted-foreground mb-6">No se puede proceder al checkout.</p>
            <Button onClick={() => navigate('/events')}>
                 <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Eventos
            </Button>
        </div>
    );
  }

  const handleQuantityChange = (amount) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const handlePurchase = () => {
    const ticket = purchaseTicket(event.id, quantity);
    if (ticket) {
      toast({
        title: "Compra Exitosa",
        description: `Has comprado ${quantity} ticket(s) para ${event.name}.`,
      });
      navigate('/my-tickets');
    } else {
      toast({
        title: "Error en la Compra",
        description: "No se pudo completar la compra. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto"
    >
       <Button variant="ghost" onClick={() => navigate(`/events/${id}`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Evento
       </Button>

      <Card className="shadow-lg border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Checkout
          </CardTitle>
          <CardDescription>Estás comprando tickets para: <span className="font-semibold text-foreground">{event.name}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
                <Label>Precio por Ticket General</Label>
                <p className="text-lg font-semibold">{event.price > 0 ? `$${event.price.toFixed(2)}` : 'Gratis'}</p>
           </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                readOnly
                className="w-16 text-center"

              />
              <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <Label>Total</Label>
            <p className="text-2xl font-bold text-primary">{`$${totalPrice.toFixed(2)}`}</p>
          </div>

        </CardContent>
        <CardFooter>
          <Button onClick={handlePurchase} className="w-full gradient-bg text-white" size="lg">
            Confirmar Compra
            <Ticket className="ml-2 h-4 w-4"/>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default CheckoutPage;
