import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, MapPin, Camera, Check, 
  Home, IndianRupee, Image, FileText, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Textarea, Card, LoadingSpinner } from '../components/UI';
import { useRoomsStore, useAuthStore } from '../store';
import { toast } from 'sonner';

const steps = [
  { id: 'details', title: 'Room Details', icon: Home },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'photos', title: 'Photos', icon: Image },
  { id: 'rules', title: 'Rules & Publish', icon: FileText }
];

const amenitiesList = ['WiFi', 'AC', 'Parking', 'Gym', 'Power Backup', 'Security', 'Meals', 'Laundry', 'Kitchen', 'Near Metro', 'Washing Machine', 'TV', 'Refrigerator'];

export default function PostRoom() {
  const navigate = useNavigate();
  const { createRoom, isLoading } = useRoomsStore();
  const { token } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    room_type: '',
    price: '',
    deposit: '',
    maintenance: '',
    electricity: 'Extra',
    furnishing: '',
    gender_preference: '',
    available_from: '',
    owner_type: 'Owner',
    amenities: [],
    rules: [],
    images: [],
    location: {
      address: '',
      city: '',
      area: '',
      lat: 28.6139,
      lng: 77.2090
    }
  });

  const [newRule, setNewRule] = useState('');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateLocation = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 0) {
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.room_type) newErrors.room_type = 'Room type is required';
      if (!formData.price) newErrors.price = 'Price is required';
      if (!formData.deposit) newErrors.deposit = 'Deposit is required';
      if (!formData.furnishing) newErrors.furnishing = 'Furnishing is required';
      if (!formData.gender_preference) newErrors.gender_preference = 'Gender preference is required';
    }
    
    if (currentStep === 1) {
      if (!formData.location.address) newErrors.address = 'Address is required';
      if (!formData.location.city) newErrors.city = 'City is required';
      if (!formData.location.area) newErrors.area = 'Area is required';
    }
    
    if (currentStep === 2) {
      if (formData.images.length < 1) newErrors.images = 'Add at least 1 image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // For demo, using placeholder images
    const newImages = files.map((_, idx) => 
      `https://images.pexels.com/photos/${5417293 + idx * 1000}/pexels-photo-${5417293 + idx * 1000}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`
    );
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 10)
    }));
    setErrors(prev => ({ ...prev, images: null }));
    toast.success(`${files.length} image(s) added`);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      const roomData = {
        ...formData,
        price: parseInt(formData.price),
        deposit: parseInt(formData.deposit),
        maintenance: formData.maintenance ? parseInt(formData.maintenance) : 0
      };
      
      await createRoom(roomData, token);
      toast.success('Room posted successfully!');
      navigate('/owner-dashboard');
    } catch (error) {
      toast.error(error.message || 'Failed to post room');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-heading font-bold text-xl">Post Your Room</h1>
        </div>
        
        {/* Progress */}
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  idx < currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : idx === currentStep
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx < currentStep ? <Check size={16} /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 rounded ${
                  idx < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{steps[currentStep].title}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {/* Step 1: Details */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Room Title *</label>
                <Input
                  placeholder="e.g., Spacious 1BHK near Metro"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  error={!!errors.title}
                  data-testid="room-title"
                />
                {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  placeholder="Describe your room, amenities, nearby places..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  data-testid="room-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Room Type *</label>
                  <Select
                    value={formData.room_type}
                    onChange={(e) => updateField('room_type', e.target.value)}
                    error={!!errors.room_type}
                    data-testid="room-type"
                  >
                    <option value="">Select</option>
                    <option value="PG">PG</option>
                    <option value="Flat">Flat</option>
                    <option value="Shared">Shared Room</option>
                    <option value="Hostel">Hostel</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Furnishing *</label>
                  <Select
                    value={formData.furnishing}
                    onChange={(e) => updateField('furnishing', e.target.value)}
                    error={!!errors.furnishing}
                    data-testid="furnishing"
                  >
                    <option value="">Select</option>
                    <option value="Furnished">Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Rent (₹) *</label>
                  <Input
                    type="number"
                    placeholder="8000"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    error={!!errors.price}
                    data-testid="room-price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deposit (₹) *</label>
                  <Input
                    type="number"
                    placeholder="16000"
                    value={formData.deposit}
                    onChange={(e) => updateField('deposit', e.target.value)}
                    error={!!errors.deposit}
                    data-testid="room-deposit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Maintenance (₹)</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={formData.maintenance}
                    onChange={(e) => updateField('maintenance', e.target.value)}
                    data-testid="room-maintenance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Electricity</label>
                  <Select
                    value={formData.electricity}
                    onChange={(e) => updateField('electricity', e.target.value)}
                    data-testid="electricity"
                  >
                    <option value="Included">Included</option>
                    <option value="Extra">Extra</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Gender *</label>
                  <Select
                    value={formData.gender_preference}
                    onChange={(e) => updateField('gender_preference', e.target.value)}
                    error={!!errors.gender_preference}
                    data-testid="gender"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Any">Any</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Listed As</label>
                  <Select
                    value={formData.owner_type}
                    onChange={(e) => updateField('owner_type', e.target.value)}
                    data-testid="owner-type"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Broker">Broker</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Available From</label>
                <Input
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => updateField('available_from', e.target.value)}
                  data-testid="available-from"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.amenities.includes(amenity)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <Input
                  placeholder="Building name, street"
                  value={formData.location.address}
                  onChange={(e) => updateLocation('address', e.target.value)}
                  error={!!errors.address}
                  data-testid="address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <Input
                    placeholder="Delhi"
                    value={formData.location.city}
                    onChange={(e) => updateLocation('city', e.target.value)}
                    error={!!errors.city}
                    data-testid="city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Area *</label>
                  <Input
                    placeholder="Koramangala"
                    value={formData.location.area}
                    onChange={(e) => updateLocation('area', e.target.value)}
                    error={!!errors.area}
                    data-testid="area"
                  />
                </div>
              </div>

              {/* Map placeholder */}
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin size={20} className="text-primary" />
                  <span className="font-medium">Pin Location on Map</span>
                </div>
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Map picker will appear here</p>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-xl">
                <AlertCircle size={18} className="text-primary" />
                <span className="text-sm">Add at least 3 clear photos for better visibility</span>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary transition-colors"
              >
                <Camera size={32} className="text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Upload Photos</span>
                <span className="text-xs text-muted-foreground">Max 10 photos</span>
              </label>

              {errors.images && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.images}
                </p>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Rules */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">House Rules</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a rule (e.g., No Smoking)"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRule()}
                    data-testid="new-rule"
                  />
                  <Button type="button" onClick={addRule} variant="secondary">
                    Add
                  </Button>
                </div>
              </div>

              {formData.rules.length > 0 && (
                <div className="space-y-2">
                  {formData.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                      <span className="text-sm">{rule}</span>
                      <button
                        onClick={() => removeRule(idx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview card */}
              <Card className="p-4 mt-6">
                <h3 className="font-heading font-semibold mb-4">Preview</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Title:</strong> {formData.title || '-'}</p>
                  <p><strong>Type:</strong> {formData.room_type || '-'}</p>
                  <p><strong>Price:</strong> ₹{formData.price || '0'}/month</p>
                  <p><strong>Location:</strong> {formData.location.area}, {formData.location.city}</p>
                  <p><strong>Photos:</strong> {formData.images.length} uploaded</p>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom buttons - positioned above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep} className="flex-1" data-testid="prev-step">
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep} className="flex-1" data-testid="next-step">
              Next
              <ArrowRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={isLoading}
              data-testid="submit-room"
            >
              {isLoading ? <LoadingSpinner size={20} /> : 'Publish Room'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
