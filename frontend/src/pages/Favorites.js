import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { EmptyState, Skeleton } from '../components/UI';
import { useFavoritesStore, useAuthStore } from '../store';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, fetchFavorites } = useFavoritesStore();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchFavorites(token);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchFavorites, token]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <h1 className="font-heading font-bold text-xl">Saved Rooms</h1>
        <p className="text-sm text-muted-foreground">{favorites.length} rooms saved</p>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {favorites.map((room, index) => (
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
          <EmptyState
            icon={Heart}
            title="No saved rooms"
            description="Save rooms you like to easily find them later"
            action={() => navigate('/search')}
            actionLabel="Browse Rooms"
          />
        )}
      </div>
    </div>
  );
}
