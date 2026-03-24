import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="font-heading font-black text-5xl text-primary-foreground tracking-tight mb-2">
          Finde R
        </h1>
        <p className="text-primary-foreground/80 text-sm font-medium">
          Find your perfect room
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-12"
      >
        <div className="w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
      </motion.div>
    </div>
  );
}
