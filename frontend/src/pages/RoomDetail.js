import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Share2, MapPin, BadgeCheck, Phone, MessageCircle, 
  Calendar, Flag, ChevronRight, Wifi, Car, Dumbbell, Utensils,
  Shield, Zap, Users, Home, Ruler, IndianRupee
} from 'lucide-react';
import { Button, Badge, Skeleton, Card } from '../components/UI';
import { useRoomsStore, useAuthStore, useFavoritesStore, useChatStore, useBookingsStore } from '../store';
import { toast } from 'sonner';

const amenityIcons = {
  'WiFi': Wifi,
  'Parking': Car,
  'Gym': Dumbbell,
  'Meals': Utensils,
  'Security': Shield,
  'Power Backup': Zap,
  'AC': Home,
  'Kitchen': Utensils,
  'Near Metro': MapPin,
  'Laundry': Home
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRoom, isLoading, fetchRoom } = useRoomsStore();
  const { isAuthenticated, token, user } = useAuthStore();
  const { favoriteIds, addFavorite, removeFavorite } = useFavoritesStore();
  const { createChat } = useChatStore();
  const { createBooking } = useBookingsStore();
  
  const [currentImage, setCurrentImage] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({ date: '', time_slot: '', message: '' });
  
  const isFavorite = currentRoom && favoriteIds.has(currentRoom.id);

  useEffect(() => {
    fetchRoom(id);
  }, [id, fetchRoom]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save rooms');
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite(currentRoom.id, token);
        toast.success('Removed from favorites');
      } else {
        await addFavorite(currentRoom.id, token);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: currentRoom.title,
        text: `Check out this room on Finde R: ${currentRoom.title}`,
        url: window.location.href
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to chat');
      navigate('/login');
      return;
    }

    try {
      const chat = await createChat(currentRoom.id, token);
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to start chat');
    }
  };

  const handleBookVisit = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a visit');
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
  };

  const submitBooking = async () => {
    if (!bookingData.date || !bookingData.time_slot) {
      toast.error('Please select date and time');
      return;
    }

    try {
      await createBooking({
        room_id: currentRoom.id,
        ...bookingData
      }, token);
      toast.success('Visit booked successfully!');
      setShowBookingModal(false);
      setBookingData({ date: '', time_slot: '', message: '' });
    } catch (error) {
      toast.error(error.message || 'Failed to book visit');
    }
  };

  if (isLoading || !currentRoom) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-80" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image gallery */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={currentRoom.images?.[currentImage] || 'https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'}
            alt={currentRoom.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Header buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            data-testid="back-btn"
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              data-testid="share-btn"
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={handleFavorite}
              data-testid="favorite-btn"
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
            >
              <Heart size={18} className={isFavorite ? 'fill-accent text-accent' : ''} />
            </button>
          </div>
        </div>

        {/* Image indicators */}
        {currentRoom.images?.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {currentRoom.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentImage ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Verified badge */}
        {currentRoom.verified && (
          <div className="absolute bottom-4 left-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <BadgeCheck size={14} />
              Verified
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title & Price */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <Badge className="mb-2">{currentRoom.room_type}</Badge>
              <h1 className="font-heading font-bold text-2xl leading-tight">
                {currentRoom.title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin size={16} />
            <span>{currentRoom.location?.address}, {currentRoom.location?.city}</span>
          </div>

          {/* Price breakdown */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-heading font-bold text-2xl text-primary">
                {formatPrice(currentRoom.price)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Deposit</p>
                <p className="font-semibold">{formatPrice(currentRoom.deposit)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Maintenance</p>
                <p className="font-semibold">{currentRoom.maintenance ? formatPrice(currentRoom.maintenance) : 'N/A'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Electricity</p>
                <p className="font-semibold">{currentRoom.electricity || 'Extra'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <Users size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">For</p>
            <p className="font-medium text-sm">{currentRoom.gender_preference}</p>
          </Card>
          <Card className="p-3 text-center">
            <Home size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Furnishing</p>
            <p className="font-medium text-sm">{currentRoom.furnishing}</p>
          </Card>
          <Card className="p-3 text-center">
            <Calendar size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-medium text-sm">{currentRoom.available_from || 'Now'}</p>
          </Card>
        </div>

        {/* Description */}
        <div>
          <h2 className="font-heading font-semibold text-lg mb-3">About</h2>
          <p className="text-muted-foreground leading-relaxed">
            {currentRoom.description}
          </p>
        </div>

        {/* Amenities */}
        {currentRoom.amenities?.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">Amenities</h2>
            <div className="grid grid-cols-2 gap-3">
              {currentRoom.amenities.map((amenity, idx) => {
                const Icon = amenityIcons[amenity] || Home;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <Icon size={18} className="text-primary" />
                    <span className="text-sm">{amenity}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rules */}
        {currentRoom.rules?.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-lg mb-3">House Rules</h2>
            <Card className="p-4">
              <ul className="space-y-2">
                {currentRoom.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {rule}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Owner info */}
        <div>
          <h2 className="font-heading font-semibold text-lg mb-3">Listed by</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Users size={24} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{currentRoom.owner_name}</p>
                  <Badge variant={currentRoom.owner_type === 'Owner' ? 'success' : 'default'}>
                    {currentRoom.owner_type}
                  </Badge>
                </div>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Report */}
        <button 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          data-testid="report-btn"
        >
          <Flag size={16} />
          Report this listing
        </button>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-50">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => window.open(`tel:${currentRoom.owner_phone}`)}
            data-testid="call-btn"
          >
            <Phone size={18} />
            Call
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleChat}
            data-testid="chat-btn"
          >
            <MessageCircle size={18} />
            Chat
          </Button>
          <Button 
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleBookVisit}
            data-testid="book-visit-btn"
          >
            <Calendar size={18} />
            Book Visit
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-card rounded-t-3xl w-full max-w-lg p-6"
          >
            <h2 className="font-heading font-bold text-xl mb-4">Book a Visit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4"
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="booking-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'].map(slot => (
                    <button
                      key={slot}
                      onClick={() => setBookingData({ ...bookingData, time_slot: slot })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        bookingData.time_slot === slot
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowBookingModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={submitBooking}
                  data-testid="confirm-booking"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
