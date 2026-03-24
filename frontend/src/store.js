import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      
      login: async (phone, email) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, email })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail);
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      verifyOTP: async (phone, email, otp) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, email, otp })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail);
          set({ 
            user: data.user, 
            token: data.token, 
            isAuthenticated: true,
            isLoading: false 
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      updateProfile: async (profileData) => {
        const { token } = get();
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/api/auth/profile?token=${token}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail);
          set({ user: data.user, isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      
      deleteAccount: async () => {
        const { token } = get();
        try {
          await fetch(`${API_URL}/api/auth/account?token=${token}`, {
            method: 'DELETE'
          });
          set({ user: null, token: null, isAuthenticated: false });
        } catch (error) {
          throw error;
        }
      }
    }),
    { 
      name: 'finder-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure isAuthenticated is set correctly after rehydration
        if (state && state.token && state.user) {
          state.isAuthenticated = true;
        }
      }
    }
  )
);

// Rooms Store
export const useRoomsStore = create((set, get) => ({
  rooms: [],
  currentRoom: null,
  filters: {},
  isLoading: false,
  total: 0,
  page: 1,
  pages: 1,
  
  setFilters: (filters) => set({ filters }),
  
  fetchRooms: async (page = 1, filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page: page.toString(), ...filters });
      const res = await fetch(`${API_URL}/api/rooms?${params}`);
      const data = await res.json();
      set({ 
        rooms: page === 1 ? data.rooms : [...get().rooms, ...data.rooms],
        total: data.total,
        page: data.page,
        pages: data.pages,
        isLoading: false 
      });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  fetchRoom: async (roomId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      set({ currentRoom: data.room, isLoading: false });
      return data.room;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  createRoom: async (roomData, token) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/rooms?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      set({ isLoading: false });
      return data.room;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  clearRooms: () => set({ rooms: [], page: 1 })
}));

// Favorites Store
export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      favoriteIds: new Set(),
      
      fetchFavorites: async (token) => {
        try {
          const res = await fetch(`${API_URL}/api/favorites?token=${token}`);
          const data = await res.json();
          const ids = new Set(data.rooms.map(r => r.id));
          set({ favorites: data.rooms, favoriteIds: ids });
          return data.rooms;
        } catch (error) {
          throw error;
        }
      },
      
      addFavorite: async (roomId, token) => {
        try {
          await fetch(`${API_URL}/api/favorites/${roomId}?token=${token}`, {
            method: 'POST'
          });
          const newIds = new Set(get().favoriteIds);
          newIds.add(roomId);
          set({ favoriteIds: newIds });
        } catch (error) {
          throw error;
        }
      },
      
      removeFavorite: async (roomId, token) => {
        try {
          await fetch(`${API_URL}/api/favorites/${roomId}?token=${token}`, {
            method: 'DELETE'
          });
          const newIds = new Set(get().favoriteIds);
          newIds.delete(roomId);
          set({ favoriteIds: newIds });
        } catch (error) {
          throw error;
        }
      },
      
      isFavorite: (roomId) => get().favoriteIds.has(roomId)
    }),
    { 
      name: 'finder-favorites',
      partialize: (state) => ({ favoriteIds: Array.from(state.favoriteIds) }),
      onRehydrateStorage: () => (state) => {
        if (state && state.favoriteIds) {
          state.favoriteIds = new Set(state.favoriteIds);
        }
      }
    }
  )
);

// Chat Store
export const useChatStore = create((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  
  fetchChats: async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/chats?token=${token}`);
      const data = await res.json();
      set({ chats: data.chats });
      return data.chats;
    } catch (error) {
      throw error;
    }
  },
  
  fetchMessages: async (chatId, token) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/messages?token=${token}`);
      const data = await res.json();
      set({ messages: data.messages });
      return data.messages;
    } catch (error) {
      throw error;
    }
  },
  
  sendMessage: async (chatId, content, messageType, token) => {
    try {
      const res = await fetch(`${API_URL}/api/chats/${chatId}/messages?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, content, message_type: messageType })
      });
      const data = await res.json();
      set({ messages: [...get().messages, data.message] });
      return data.message;
    } catch (error) {
      throw error;
    }
  },
  
  createChat: async (roomId, token) => {
    try {
      const res = await fetch(`${API_URL}/api/chats?room_id=${roomId}&token=${token}`, {
        method: 'POST'
      });
      const data = await res.json();
      set({ currentChat: data.chat });
      return data.chat;
    } catch (error) {
      throw error;
    }
  },
  
  addMessage: (message) => set({ messages: [...get().messages, message] }),
  setCurrentChat: (chat) => set({ currentChat: chat, messages: [] })
}));

// Bookings Store
export const useBookingsStore = create((set, get) => ({
  bookings: [],
  isLoading: false,
  
  fetchBookings: async (token) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/bookings?token=${token}`);
      const data = await res.json();
      set({ bookings: data.bookings, isLoading: false });
      return data.bookings;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  createBooking: async (bookingData, token) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/api/bookings?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      set({ bookings: [data.booking, ...get().bookings], isLoading: false });
      return data.booking;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  updateBookingStatus: async (bookingId, status, token) => {
    try {
      await fetch(`${API_URL}/api/bookings/${bookingId}/status?status=${status}&token=${token}`, {
        method: 'PUT'
      });
      set({ 
        bookings: get().bookings.map(b => 
          b.id === bookingId ? { ...b, status } : b
        )
      });
    } catch (error) {
      throw error;
    }
  }
}));

// Notifications Store
export const useNotificationsStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  
  fetchNotifications: async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications?token=${token}`);
      const data = await res.json();
      const unread = data.notifications.filter(n => !n.read).length;
      set({ notifications: data.notifications, unreadCount: unread });
      return data.notifications;
    } catch (error) {
      throw error;
    }
  },
  
  markAsRead: async (token) => {
    try {
      await fetch(`${API_URL}/api/notifications/read?token=${token}`, {
        method: 'PUT'
      });
      set({ unreadCount: 0 });
    } catch (error) {
      throw error;
    }
  }
}));
