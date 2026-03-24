import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X, SlidersHorizontal, MapPin, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import { Button, Input, Select, Skeleton, Badge } from '../components/UI';
import { useRoomsStore, useAuthStore } from '../store';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const amenitiesList = ['WiFi', 'AC', 'Parking', 'Gym', 'Power Backup', 'Security', 'Meals', 'Laundry', 'Kitchen', 'Near Metro'];
const furnishingOptions = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const genderOptions = ['Any', 'Male', 'Female'];
const roomTypeOptions = ['PG', 'Flat', 'Shared', 'Hostel'];
const ownerTypeOptions = ['Owner', 'Broker'];

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rooms, isLoading, fetchRooms, total, page, pages, clearRooms } = useRoomsStore();
  const { isAuthenticated, token } = useAuthStore();
  
  const [showFilters, setShowFilters] = useState(location.state?.showFilters || false);
  const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
  const [aiSearchResult, setAiSearchResult] = useState(null);
  
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    room_type: '',
    gender: '',
    furnishing: '',
    city: '',
    area: '',
    owner_type: '',
    amenities: []
  });

  useEffect(() => {
    if (location.state?.filters) {
      setFilters(prev => ({ ...prev, ...location.state.filters }));
    }
    clearRooms();
    handleSearch();
  }, []);

  const handleSearch = useCallback(async (customFilters = null) => {
    const searchFilters = customFilters || filters;
    const params = {};
    
    Object.keys(searchFilters).forEach(key => {
      if (searchFilters[key] && (typeof searchFilters[key] !== 'object' || searchFilters[key].length > 0)) {
        if (key === 'amenities' && searchFilters[key].length > 0) {
          params[key] = searchFilters[key].join(',');
        } else if (searchFilters[key]) {
          params[key] = searchFilters[key];
        }
      }
    });
    
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    await fetchRooms(1, params);
    setShowFilters(false);
  }, [filters, searchQuery, fetchRooms]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!isAuthenticated) {
      toast.error('Please login to use AI search');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/ai/search?query=${encodeURIComponent(searchQuery)}&token=${token}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.parsed_params && Object.keys(data.parsed_params).length > 0) {
        setAiSearchResult(data.parsed_params);
        const newFilters = { ...filters };
        
        if (data.parsed_params.max_price) newFilters.max_price = data.parsed_params.max_price;
        if (data.parsed_params.min_price) newFilters.min_price = data.parsed_params.min_price;
        if (data.parsed_params.room_type) newFilters.room_type = data.parsed_params.room_type;
        if (data.parsed_params.gender) newFilters.gender = data.parsed_params.gender;
        if (data.parsed_params.city) newFilters.city = data.parsed_params.city;
        if (data.parsed_params.area) newFilters.area = data.parsed_params.area;
        if (data.parsed_params.amenities) newFilters.amenities = data.parsed_params.amenities;
        if (data.parsed_params.furnishing) newFilters.furnishing = data.parsed_params.furnishing;
        
        setFilters(newFilters);
        handleSearch(newFilters);
        toast.success('AI understood your search!');
      } else {
        handleSearch();
      }
    } catch (error) {
      handleSearch();
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      min_price: '',
      max_price: '',
      room_type: '',
      gender: '',
      furnishing: '',
      city: '',
      area: '',
      owner_type: '',
      amenities: []
    });
    setSearchQuery('');
    setAiSearchResult(null);
  };

  const loadMore = () => {
    if (page < pages) {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] && (typeof filters[key] !== 'object' || filters[key].length > 0)) {
          if (key === 'amenities' && filters[key].length > 0) {
            params[key] = filters[key].join(',');
          } else if (filters[key]) {
            params[key] = filters[key];
          }
        }
      });
      if (searchQuery) params.search = searchQuery;
      fetchRooms(page + 1, params);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <X size={24} />
          </button>
          <div className="flex-1 relative">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder='Try "room under ₹8000 near metro"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              data-testid="search-input"
              className="pl-11 pr-12"
            />
            {isAuthenticated && (
              <button
                onClick={handleAISearch}
                data-testid="ai-search-btn"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-secondary rounded-lg flex items-center justify-center"
                title="AI Search"
              >
                <Sparkles size={16} className="text-secondary-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              showFilters ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* AI search result badge */}
        {aiSearchResult && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles size={12} />
              AI Search
            </Badge>
            {aiSearchResult.max_price && (
              <Badge>Under ₹{aiSearchResult.max_price}</Badge>
            )}
            {aiSearchResult.room_type && (
              <Badge>{aiSearchResult.room_type}</Badge>
            )}
            {aiSearchResult.amenities?.map(a => (
              <Badge key={a}>{a}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-card border-b border-border overflow-hidden"
        >
          <div className="p-4 space-y-4">
            {/* Budget */}
            <div>
              <label className="block text-sm font-medium mb-2">Budget (₹)</label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                  data-testid="min-price-input"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                  data-testid="max-price-input"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  type="text"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  data-testid="city-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Area</label>
                <Input
                  type="text"
                  placeholder="Enter area"
                  value={filters.area}
                  onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                  data-testid="area-input"
                />
              </div>
            </div>

            {/* Room type & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Room Type</label>
                <Select
                  value={filters.room_type}
                  onChange={(e) => setFilters({ ...filters, room_type: e.target.value })}
                  data-testid="room-type-select"
                >
                  <option value="">All Types</option>
                  {roomTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <Select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  data-testid="gender-select"
                >
                  <option value="">Any</option>
                  {genderOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Furnishing & Owner type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Furnishing</label>
                <Select
                  value={filters.furnishing}
                  onChange={(e) => setFilters({ ...filters, furnishing: e.target.value })}
                  data-testid="furnishing-select"
                >
                  <option value="">Any</option>
                  {furnishingOptions.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Listed By</label>
                <Select
                  value={filters.owner_type}
                  onChange={(e) => setFilters({ ...filters, owner_type: e.target.value })}
                  data-testid="owner-type-select"
                >
                  <option value="">Anyone</option>
                  {ownerTypeOptions.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.amenities.includes(amenity)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1" data-testid="clear-filters">
                Clear All
              </Button>
              <Button onClick={() => handleSearch()} className="flex-1" data-testid="apply-filters">
                Apply Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold">{total} Results</h2>
        </div>

        {isLoading && rooms.length === 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <RoomCard room={room} />
                </motion.div>
              ))}
            </div>
            
            {page < pages && (
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                  data-testid="load-more-btn"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">No rooms found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Try different filters or search in another area
            </p>
            <Button onClick={clearFilters} data-testid="clear-search">
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
