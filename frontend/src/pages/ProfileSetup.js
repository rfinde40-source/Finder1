import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, LoadingSpinner } from '../components/UI';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { updateProfile, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    occupation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.gender || !formData.occupation) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await updateProfile(formData);
      toast.success('Profile setup complete!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to setup profile');
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-heading font-bold text-3xl mb-2">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground">
          Tell us a bit about yourself to get started
        </p>
      </motion.div>

      {/* Avatar placeholder */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-8"
      >
        <div className="relative">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <User size={40} className="text-muted-foreground" />
          </div>
          <button 
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
            data-testid="upload-avatar-btn"
          >
            <Camera size={16} />
          </button>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="name-input"
              className="pl-11"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <Select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            data-testid="gender-select"
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Occupation</label>
          <div className="relative">
            <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              data-testid="occupation-select"
              className="pl-11"
            >
              <option value="">Select occupation</option>
              <option value="Student">Student</option>
              <option value="Working Professional">Working Professional</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Business Owner">Business Owner</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isLoading}
            data-testid="complete-profile-btn"
          >
            {isLoading ? <LoadingSpinner size={20} /> : 'Complete Setup'}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
