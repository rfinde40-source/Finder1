import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input, EmptyState, Skeleton, Badge } from '../components/UI';
import { useChatStore, useAuthStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

export default function Chats() {
  const navigate = useNavigate();
  const { chats, fetchChats } = useChatStore();
  const { token, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        await fetchChats(token);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchChats, token]);

  const filteredChats = chats.filter(chat => 
    chat.room_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <h1 className="font-heading font-bold text-xl mb-4">Messages</h1>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
            data-testid="chat-search"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 p-4 bg-card rounded-2xl">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-3">
            {filteredChats.map((chat, index) => (
              <motion.button
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/20 transition-colors text-left"
                data-testid={`chat-item-${chat.id}`}
              >
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={24} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium truncate">{chat.other_user?.name || 'User'}</p>
                    {chat.last_message_at && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.room_title}</p>
                  {chat.last_message && (
                    <p className="text-sm text-muted-foreground truncate mt-1">{chat.last_message}</p>
                  )}
                </div>
                <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Start chatting with room owners by clicking 'Chat' on any listing"
            action={() => navigate('/search')}
            actionLabel="Browse Rooms"
          />
        )}
      </div>
    </div>
  );
}
