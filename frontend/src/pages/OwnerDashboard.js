import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Eye, MousePointer, Users, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, EmptyState, Skeleton } from '../components/UI';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [rooms, setRooms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, analyticsRes] = await Promise.all([
          fetch(`${API_URL}/api/rooms/owner/my-rooms?token=${token}`),
          fetch(`${API_URL}/api/rooms/owner/analytics?token=${token}`)
        ]);
        
        const roomsData = await roomsRes.json();
        const analyticsData = await analyticsRes.json();
        
        setRooms(roomsData.rooms || []);
        setAnalytics(analyticsData);
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await fetch(`${API_URL}/api/rooms/${roomId}?token=${token}`, {
        method: 'DELETE'
      });
      setRooms(rooms.filter(r => r.id !== roomId));
      toast.success('Listing deleted');
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-xl">Owner Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your listings</p>
          </div>
          <Button onClick={() => navigate('/post')} size="sm" data-testid="add-room-btn">
            <Plus size={18} className="mr-1" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Analytics */}
      {isLoading ? (
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : analytics && (
        <div className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.total_rooms}</p>
                  <p className="text-xs text-muted-foreground">Total Rooms</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/30 rounded-xl flex items-center justify-center">
                  <Eye size={20} className="text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.total_views}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.total_leads}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.conversion_rate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Rooms list */}
      <div className="px-4 pb-4">
        <h2 className="font-heading font-semibold mb-4">Your Listings</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="space-y-4">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={room.images?.[0] || 'https://images.pexels.com/photos/5417293/pexels-photo-5417293.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'}
                      alt={room.title}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium line-clamp-1">{room.title}</h3>
                        <Badge variant={room.verified ? 'success' : 'default'}>
                          {room.verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-primary mb-2">
                        {formatPrice(room.price)}/mo
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {room.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer size={12} />
                          {room.clicks || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {room.leads || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/room/${room.id}`)}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(room.id)}
                      className="text-destructive"
                      data-testid={`delete-${room.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No listings yet"
            description="Post your first room to start receiving leads"
            action={() => navigate('/post')}
            actionLabel="Post a Room"
          />
        )}
      </div>
    </div>
  );
}
