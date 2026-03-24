import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Skeleton } from '../components/UI';
import { useRoomsStore } from '../store';

// Simple map component using static map + markers
export default function MapView() {
  const navigate = useNavigate();
  const { rooms, isLoading, fetchRooms } = useRoomsStore();
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetchRooms(1, { limit: 50 });
  }, [fetchRooms]);

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `₹${(price / 1000).toFixed(0)}K`;
    }
    return `₹${price}`;
  };

  // Group rooms by approximate location for clustering
  const groupedRooms = rooms.reduce((acc, room) => {
    if (room.location?.lat && room.location?.lng) {
      const key = `${Math.round(room.location.lat * 10)}_${Math.round(room.location.lng * 10)}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(room);
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            data-testid="back-btn"
            className="w-10 h-10 bg-card shadow-lg rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 bg-card shadow-lg rounded-full px-4 py-3 flex items-center gap-2">
            <MapPin size={18} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Search this area</span>
          </div>
          <button
            onClick={() => navigate('/search', { state: { showFilters: true } })}
            className="w-10 h-10 bg-card shadow-lg rounded-full flex items-center justify-center"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Map area */}
      <div className="relative h-screen bg-muted">
        {/* Static map background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/77.2090,28.6139,11,0/1200x800?access_token=pk.placeholder')`
          }}
        />
        
        {/* Map grid overlay for visual effect */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Price markers */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-card p-4 rounded-2xl shadow-lg">
              <Skeleton className="w-32 h-8" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 pt-20 pb-32">
            {/* Simulated markers positioned randomly */}
            {rooms.slice(0, 15).map((room, index) => {
              const top = 15 + (index % 5) * 15 + Math.random() * 10;
              const left = 10 + (index % 4) * 20 + Math.random() * 15;
              
              return (
                <motion.button
                  key={room.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRoom(room)}
                  className={`
                    absolute transform -translate-x-1/2 -translate-y-1/2
                    px-3 py-1.5 rounded-full font-bold text-sm shadow-lg
                    transition-all hover:scale-110 hover:z-10
                    ${selectedRoom?.id === room.id 
                      ? 'bg-primary text-primary-foreground scale-110 z-10' 
                      : 'bg-card text-foreground'
                    }
                  `}
                  style={{ top: `${top}%`, left: `${left}%` }}
                  data-testid={`map-marker-${room.id}`}
                >
                  {formatPrice(room.price)}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Current location button */}
        <button
          className="absolute bottom-32 right-4 w-12 h-12 bg-card shadow-lg rounded-full flex items-center justify-center"
          data-testid="my-location-btn"
        >
          <Navigation size={20} className="text-primary" />
        </button>
      </div>

      {/* Bottom sheet with selected room or list */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: selectedRoom ? 0 : '70%' }}
        className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl z-40 min-h-[30vh]"
      >
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3" />
        
        {selectedRoom ? (
          <div className="p-4">
            <div className="flex gap-4">
              <img
                src={selectedRoom.images?.[0] || 'https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'}
                alt={selectedRoom.title}
                className="w-24 h-24 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-heading font-semibold line-clamp-1">{selectedRoom.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedRoom.location?.area}, {selectedRoom.location?.city}
                </p>
                <p className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                  }).format(selectedRoom.price)}/mo
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedRoom(null)}
              >
                Close
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate(`/room/${selectedRoom.id}`)}
                data-testid="view-room-btn"
              >
                View Details
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="font-heading font-semibold mb-3">{rooms.length} rooms in this area</h3>
            <p className="text-sm text-muted-foreground">
              Tap on a price marker to see room details
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/search')}
            >
              View List
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
