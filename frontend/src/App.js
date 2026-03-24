import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store';

// Pages
import SplashScreen from './pages/SplashScreen';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import Search from './pages/Search';
import RoomDetail from './pages/RoomDetail';
import PostRoom from './pages/PostRoom';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Chats from './pages/Chats';
import ChatRoom from './pages/ChatRoom';
import MapView from './pages/MapView';
import Bookings from './pages/Bookings';
import OwnerDashboard from './pages/OwnerDashboard';

// Layout
import Layout from './components/Layout';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isAuthenticated, user, token } = useAuthStore();

  useEffect(() => {
    // Seed data on first load
    fetch(`${API_URL}/api/seed`, { method: 'POST' }).catch(() => {});
    
    // Check if first time user
    const hasSeenOnboarding = localStorage.getItem('finder-onboarding-seen');
    
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (!hasSeenOnboarding && !isAuthenticated) {
        setShowOnboarding(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('finder-onboarding-seen', 'true');
    setShowOnboarding(false);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Router>
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          className: 'font-body',
          duration: 3000
        }}
      />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/profile-setup" element={
          isAuthenticated && user && !user.profile_complete 
            ? <ProfileSetup /> 
            : <Navigate to="/" />
        } />
        
        {/* Protected routes with bottom nav */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={
            isAuthenticated ? <Favorites /> : <Navigate to="/login" />
          } />
          <Route path="/profile" element={
            isAuthenticated ? <Profile /> : <Navigate to="/login" />
          } />
          <Route path="/chats" element={
            isAuthenticated ? <Chats /> : <Navigate to="/login" />
          } />
          <Route path="/bookings" element={
            isAuthenticated ? <Bookings /> : <Navigate to="/login" />
          } />
          <Route path="/owner-dashboard" element={
            isAuthenticated ? <OwnerDashboard /> : <Navigate to="/login" />
          } />
        </Route>
        
        {/* Full screen routes (no bottom nav) */}
        <Route path="/post" element={
          isAuthenticated ? <PostRoom /> : <Navigate to="/login" />
        } />
        <Route path="/room/:id" element={<RoomDetail />} />
        <Route path="/chat/:id" element={
          isAuthenticated ? <ChatRoom /> : <Navigate to="/login" />
        } />
        <Route path="/map" element={<MapView />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
