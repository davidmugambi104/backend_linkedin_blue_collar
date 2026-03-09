import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { cn } from '@lib/utils/cn';

interface LocationPickerProps {
  value?: {
    lat: number;
    lng: number;
    address?: string;
  };
  onChange: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
  height?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  className,
  height = '400px',
}) => {
  const [searchQuery, setSearchQuery] = useState(value?.address || '');

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Mock implementation - in production would use geocoding API
    onChange({
      lat: 40.7128,
      lng: -74.0060,
      address: searchQuery,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      (error) => {
        alert('Failed to get location: ' + error.message);
      }
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <form onSubmit={handleSearch} className="flex items-center space-x-2">
        <Input
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" onClick={handleGetCurrentLocation}>
          Use My Location
        </Button>
      </form>

      {value?.address && (
        <div className="text-sm text-gray-600 bg-text-gray-400">
          Selected: {value.address}
        </div>
      )}

      <div
        style={{ height }}
        className="rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-border-gray-700 flex items-center justify-center bg-gray-50 bg-bg-gray-800"
      >
        <p className="text-gray-500 bg-text-gray-400 text-center px-4">
          Map support coming soon. Your location: {value ? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : 'Not selected'}
        </p>
      </div>
    </div>
  );
};
