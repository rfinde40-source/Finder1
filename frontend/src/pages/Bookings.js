import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Check, X, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, EmptyState, Skeleton } from '../components/UI';
import { useBookingsStore, useAuthStore } from '../store';
import { toast } from 'sonner';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  completed: 'default'
};

export default function Bookings() {
  const navigate = useNavigate();
  const { bookings, fetchBookings, updateBookingStatus, isLoading } = useBookingsStore();
  const { token, user } = useAuthStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings(token);
  }, [fetchBookings, token]);

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'my') return b.user_id === user?.id;
    if (filter === 'received') return b.owner_id === user?.id;
    return true;
  });

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status, token);
      toast.success(`Booking ${status}`);
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <h1 className="font-heading font-bold text-xl mb-4">Bookings</h1>
        <div className="flex gap-2">
          {['all', 'my', 'received'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'my' ? 'My Visits' : 'Received'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => {
              const isOwner = booking.owner_id === user?.id;
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{booking.room_title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {isOwner ? `From: ${booking.user_name}` : 'Your visit request'}
                        </p>
                      </div>
                      <Badge variant={statusColors[booking.status]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {booking.time_slot}
                      </div>
                    </div>

                    {booking.message && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-xl mb-4">
                        "{booking.message}"
                      </p>
                    )}

                    {isOwner && booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                          className="flex-1 text-destructive"
                          data-testid={`reject-${booking.id}`}
                        >
                          <X size={16} className="mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'approved')}
                          className="flex-1"
                          data-testid={`approve-${booking.id}`}
                        >
                          <Check size={16} className="mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}

                    {!isOwner && booking.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/room/${booking.room_id}`)}
                        className="w-full"
                      >
                        <Building2 size={16} className="mr-2" />
                        View Room
                      </Button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No bookings yet"
            description={filter === 'received' 
              ? "You haven't received any visit requests"
              : "Book a visit on any room to see it here"
            }
            action={() => navigate('/search')}
            actionLabel="Browse Rooms"
          />
        )}
      </div>
    </div>
  );
}
