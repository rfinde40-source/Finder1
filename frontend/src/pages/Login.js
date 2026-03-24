import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, LoadingSpinner } from '../components/UI';
import { useAuthStore } from '../store';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyOTP, isLoading } = useAuthStore();
  
  const [step, setStep] = useState('phone'); // phone, otp
  const [loginMethod, setLoginMethod] = useState('phone'); // phone, email
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [testOtp, setTestOtp] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (loginMethod === 'phone' && (!phone || phone.length < 10)) {
      setError('Please enter a valid phone number');
      return;
    }
    if (loginMethod === 'email' && (!email || !email.includes('@'))) {
      setError('Please enter a valid email');
      return;
    }

    try {
      const data = await login(
        loginMethod === 'phone' ? phone : null,
        loginMethod === 'email' ? email : null
      );
      setTestOtp(data.otp_for_testing); // For testing
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
      toast.error(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const data = await verifyOTP(
        loginMethod === 'phone' ? phone : null,
        loginMethod === 'email' ? email : null,
        otp
      );
      
      toast.success('Login successful!');
      
      if (data.is_new_user || !data.user.profile_complete) {
        navigate('/profile-setup');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
      toast.error(err.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        {step === 'otp' && (
          <button 
            onClick={() => setStep('phone')}
            data-testid="back-to-phone"
            className="mb-4 p-2 -ml-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading font-bold text-3xl mb-2"
        >
          {step === 'phone' ? 'Welcome to Finde R' : 'Verify OTP'}
        </motion.h1>
        <p className="text-muted-foreground">
          {step === 'phone' 
            ? 'Enter your phone or email to continue' 
            : `Enter the OTP sent to ${loginMethod === 'phone' ? phone : email}`
          }
        </p>
      </div>

      {step === 'phone' ? (
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleSendOTP}
          className="space-y-6"
        >
          {/* Method toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              data-testid="login-phone-tab"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                loginMethod === 'phone' 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              <Phone size={18} />
              Phone
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              data-testid="login-email-tab"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                loginMethod === 'email' 
                  ? 'bg-card shadow-sm text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              <Mail size={18} />
              Email
            </button>
          </div>

          {/* Input */}
          {loginMethod === 'phone' ? (
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="phone-input"
                error={!!error}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                error={!!error}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isLoading}
            data-testid="send-otp-btn"
          >
            {isLoading ? <LoadingSpinner size={20} /> : 'Send OTP'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.form>
      ) : (
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleVerifyOTP}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-2">Enter OTP</label>
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              data-testid="otp-input"
              error={!!error}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          {/* Show test OTP for development */}
          {testOtp && (
            <div className="p-3 bg-secondary/20 border border-secondary rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Test OTP (for development):</p>
              <p className="font-mono font-bold text-lg text-foreground">{testOtp}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isLoading}
            data-testid="verify-otp-btn"
          >
            {isLoading ? <LoadingSpinner size={20} /> : 'Verify & Continue'}
          </Button>

          <button 
            type="button"
            onClick={handleSendOTP}
            className="w-full text-center text-sm text-primary font-medium"
            disabled={isLoading}
            data-testid="resend-otp-btn"
          >
            Didn't receive OTP? Resend
          </button>
        </motion.form>
      )}
    </div>
  );
}
