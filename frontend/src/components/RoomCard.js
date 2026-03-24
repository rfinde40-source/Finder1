import React from 'react';
import { Heart, MapPin, BadgeCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useFavoritesStore } from '../store';
import { toast } from 'sonner';

export default function RoomCard({ room, showFavorite = true }) {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const { favoriteIds, addFavorite, removeFavorite } = useFavoritesStore();
  
  const isFavorite = favoriteIds.has(room.id);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to save rooms');
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite(room.id, token);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(room.id, token);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const getGenderIcon = () => {
    if (room.gender_preference === 'Male') return 'Boys';
    if (room.gender_preference === 'Female') return 'Girls';
    return 'Any';
  };

  return (
    <div 
      onClick={() => navigate(`/room/${room.id}`)}
      data-testid={`room-card-${room.id}`}
      className="room-card bg-card rounded-2xl overflow-hidden border border-border/40 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={room.images?.[0] || 'https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {room.verified && (
            <span className="verified-badge flex items-center gap-1">
              <BadgeCheck size={12} />
              Verified
            </span>
          )}
          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
            {room.room_type}
          </span>
        </div>
        
        {/* Favorite button */}
        {showFavorite && (
          <button
            onClick={handleFavoriteClick}
            data-testid={`favorite-btn-${room.id}`}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart 
              size={18} 
              className={isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}
            />
          </button>
        )}
        
        {/* Price tag */}
        <div className="absolute bottom-3 left-3 price-tag">
          {formatPrice(room.price)}/mo
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground line-clamp-1 mb-1">
          {room.title}
        </h3>
        
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
          <MapPin size={14} />
          <span className="line-clamp-1">
            {room.location?.area}, {room.location?.city}
          </span>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="bg-muted px-2 py-1 rounded-lg text-xs text-muted-foreground flex items-center gap-1">
            <Users size={12} />
            {getGenderIcon()}
          </span>
          <span className="bg-muted px-2 py-1 rounded-lg text-xs text-muted-foreground">
            {room.furnishing}
          </span>
          {room.amenities?.slice(0, 2).map((amenity, i) => (
            <span key={i} className="bg-muted px-2 py-1 rounded-lg text-xs text-muted-foreground">
              {amenity}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
