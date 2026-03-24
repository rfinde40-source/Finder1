import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Image, Mic, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, LoadingSpinner } from '../components/UI';
import { useChatStore, useAuthStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentChat, messages, fetchMessages, sendMessage, setCurrentChat } = useChatStore();
  const { token, user } = useAuthStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchMessages(id, token);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    // WebSocket connection
    const wsUrl = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');
    if (wsUrl && user?.id) {
      socketRef.current = io(wsUrl, {
        query: { user_id: user.id }
      });

      socketRef.current.on('new_message', (data) => {
        if (data.chat_id === id) {
          useChatStore.getState().addMessage(data.message);
        }
      });

      socketRef.current.on('typing', (data) => {
        if (data.chat_id === id && data.user_id !== user.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000);
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setCurrentChat(null);
    };
  }, [id, token, fetchMessages, setCurrentChat, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(id, newMessage.trim(), 'text', token);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { chat_id: id, user_id: user?.id });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/chats')} data-testid="back-btn">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="font-medium truncate">{currentChat?.room_title || 'Chat'}</h1>
            {isTyping && (
              <p className="text-xs text-primary">typing...</p>
            )}
          </div>
          <button className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <LoadingSpinner size={32} />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === user?.id;
            const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                  {showAvatar && !isOwn && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.sender_name}</p>
                  )}
                  <div className={`
                    px-4 py-3 rounded-2xl
                    ${isOwn 
                      ? 'bg-primary text-primary-foreground rounded-br-md' 
                      : 'bg-muted rounded-bl-md'
                    }
                  `}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
                    {isOwn && (
                      msg.seen 
                        ? <CheckCheck size={12} className="text-primary" />
                        : <Check size={12} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-card/95 backdrop-blur-lg border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
            <Image size={20} className="text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              data-testid="message-input"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            data-testid="send-btn"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              newMessage.trim() 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isSending ? <LoadingSpinner size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
