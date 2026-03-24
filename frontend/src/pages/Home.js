import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, SlidersHorizontal, Bell, Map, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { Skeleton, Badge } from '../components/UI';
import { useRoomsStore, useAuthStore, useNotificationsStore } from '../store';

const cities = ['Delhi', 'Noida', 'Bangalore', 'Pune', 'Mumbai', 'Hyderabad'];
const roomTypes = ['All', 'PG', 'Flat', 'Shared', 'Hostel'];

export default function Home() {
  const navigate = useNavigate();
  const { rooms, isLoading, fetchRooms, total } = useRoomsStore();
  const { isAuthenticated, user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationsStore();
  
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms(1, {});
    
    if (isAuthenticated) {
      fetchNotifications(useAuthStore.getState().token).catch(() => {});
    }
  }, [fetchRooms, isAuthenticated, fetchNotifications]);

  const handleSearch = () => {
    const filters = {};
    if (selectedCity) filters.city = selectedCity;
    if (selectedType !== 'All') filters.room_type = selectedType;
    if (searchQuery) filters.search = searchQuery;
    
    navigate('/search', { state: { filters, query: searchQuery } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="px-4 py-4">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">
                Finde R
              </h1>
              <p className="text-sm text-muted-foreground">
                {user ? `Hi, ${user.name?.split(' ')[0] || 'there'}` : 'Find your perfect room'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/map')}
                data-testid="map-view-btn"
                className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Map size={20} className="text-muted-foreground" />
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/notifications')}
                  data-testid="notifications-btn"
                  className="relative w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <Bell size={20} className="text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div 
              onClick={() => navigate('/search')}
              className="flex-1 flex items-center gap-3 h-12 bg-muted rounded-xl px-4 cursor-pointer hover:bg-muted/80 transition-colors"
              data-testid="search-bar"
            >
              <Search size={20} className="text-muted-foreground" />
              <span className="text-muted-foreground text-sm">
                Search rooms, areas...
              </span>
            </div>
            <button
              onClick={() => navigate('/search', { state: { showFilters: true } })}
              data-testid="filters-btn"
              className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* City pills */}
        <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedCity('');
                fetchRooms(1, selectedType !== 'All' ? { room_type: selectedType } : {});
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedCity 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <MapPin size={14} />
              All Cities
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => {
                  setSelectedCity(city);
                  fetchRooms(1, { city, ...(selectedType !== 'All' ? { room_type: selectedType } : {}) });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCity === city 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Room type pills */}
        <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {roomTypes.map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  fetchRooms(1, { 
                    ...(selectedCity ? { city: selectedCity } : {}),
                    ...(type !== 'All' ? { room_type: type } : {})
                  });
                }}
                data-testid={`filter-${type.toLowerCase()}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedType === type 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* AI Recommendations banner */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/20 rounded-2xl border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Best for you</p>
                <p className="text-xs text-muted-foreground">AI-powered recommendations based on your preferences</p>
              </div>
              <Badge variant="secondary">New</Badge>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">
            {total} Rooms Available
          </h2>
        </div>

        {/* Room grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-4"
          >
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoomCard room={room} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">No rooms found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Try adjusting your filters or search in a different area
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
