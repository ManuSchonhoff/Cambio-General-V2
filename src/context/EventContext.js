
import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const EventContext = createContext();

export const useEvents = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState(() => {
    const localData = localStorage.getItem('events');
    return localData ? JSON.parse(localData) : [];
  });

  const [tickets, setTickets] = useState(() => {
    const localData = localStorage.getItem('tickets');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);

  const addEvent = (eventData) => {
    const newEvent = { ...eventData, id: uuidv4() };
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const getEventById = (id) => {
    return events.find((event) => event.id === id);
  };

  const purchaseTicket = (eventId, quantity) => {
    const event = getEventById(eventId);
    if (!event) return null;

    const ticket = {
      id: uuidv4(),
      eventId: event.id,
      eventName: event.name,
      purchaseDate: new Date().toISOString(),
      quantity: quantity,
      totalPrice: event.price * quantity,
    };

    setTickets((prevTickets) => [...prevTickets, ticket]);
    return ticket;
  };

  const getMyTickets = () => {
    return tickets;
  };

  return (
    <EventContext.Provider value={{ events, addEvent, getEventById, purchaseTicket, getMyTickets }}>
      {children}
    </EventContext.Provider>
  );
};
