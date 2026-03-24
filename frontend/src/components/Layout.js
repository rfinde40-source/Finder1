import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react';
import { useAuthStore } from '../store';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/post', icon: PlusCircle, label: 'Post', protected: true },
  { path: '/favorites', icon: Heart, label: 'Saved', protected: true },
  { path: '/profile', icon: User, label: 'Profile', protected: true },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleNavClick = (item) => {
    if (item.protected && !isAuthenticated) {
      navigate('/login');
    } else {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Main content */}
      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 bottom-nav"
        data-testid="bottom-navigation"
      >
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item)}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`
                  flex flex-col items-center justify-center w-16 h-14 rounded-xl
                  transition-colors duration-200
                  ${isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-xl transition-colors duration-200
                  ${isActive ? 'bg-secondary' : ''}
                `}>
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={isActive ? 'text-primary' : ''}
                  />
                </div>
                <span className={`
                  text-[10px] mt-0.5 font-medium
                  ${isActive ? 'text-primary font-semibold' : ''}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
