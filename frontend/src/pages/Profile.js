import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Settings, LogOut, ChevronRight, Heart, MessageCircle, 
  Calendar, Building2, Bell, Shield, Trash2, Moon, Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { useAuthStore, useFavoritesStore } from '../store';
import { toast } from 'sonner';

const menuItems = [
  { icon: Heart, label: 'Saved Rooms', path: '/favorites', badge: null },
  { icon: MessageCircle, label: 'My Chats', path: '/chats', badge: null },
  { icon: Calendar, label: 'My Bookings', path: '/bookings', badge: null },
  { icon: Building2, label: 'My Listings', path: '/owner-dashboard', badge: null },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: null },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuthStore();
  const { favoriteIds } = useFavoritesStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('Account deleted');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-8 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            {user?.profile_image ? (
              <img src={user.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={40} className="text-primary-foreground" />
            )}
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">{user?.name || 'User'}</h1>
            <p className="text-primary-foreground/80 text-sm">{user?.phone || user?.email}</p>
            {user?.occupation && (
              <Badge variant="secondary" className="mt-2">{user.occupation}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-8 mb-6">
        <Card className="p-4">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center px-2">
              <p className="font-heading font-bold text-2xl">{favoriteIds.size}</p>
              <p className="text-xs text-muted-foreground">Saved</p>
            </div>
            <div className="text-center px-2">
              <p className="font-heading font-bold text-2xl">0</p>
              <p className="text-xs text-muted-foreground">Chats</p>
            </div>
            <div className="text-center px-2">
              <p className="font-heading font-bold text-2xl">0</p>
              <p className="text-xs text-muted-foreground">Bookings</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Menu items */}
      <div className="px-4 space-y-3">
        {menuItems.map((item) => (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/40 hover:border-primary/20 transition-colors"
          >
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
              <item.icon size={20} className="text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
            <ChevronRight size={20} className="text-muted-foreground" />
          </motion.button>
        ))}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/40"
        >
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
            {isDark ? <Sun size={20} className="text-muted-foreground" /> : <Moon size={20} className="text-muted-foreground" />}
          </div>
          <span className="flex-1 text-left font-medium">Dark Mode</span>
          <div className={`w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/40 text-foreground"
        >
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
            <LogOut size={20} className="text-muted-foreground" />
          </div>
          <span className="flex-1 text-left font-medium">Logout</span>
        </button>

        {/* Delete account */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          data-testid="delete-account-btn"
          className="w-full flex items-center gap-4 p-4 bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive"
        >
          <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center">
            <Trash2 size={20} />
          </div>
          <span className="flex-1 text-left font-medium">Delete Account</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 w-full max-w-sm"
          >
            <h2 className="font-heading font-bold text-xl mb-2">Delete Account?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount} className="flex-1">
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Legal links */}
      <div className="px-4 mt-8 flex justify-center gap-6 text-xs text-muted-foreground">
        <button>Privacy Policy</button>
        <button>Terms of Service</button>
        <button>Help</button>
      </div>
    </div>
  );
}
