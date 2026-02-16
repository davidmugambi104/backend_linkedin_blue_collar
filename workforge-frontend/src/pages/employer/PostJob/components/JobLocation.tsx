import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@components/ui/Input';
import { LocationPicker } from '@components/common/LocationPicker';

export const JobLocation: React.FC = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const [useMapPicker, setUseMapPicker] = useState(false);
  
  const locationLat = watch('location_lat');
  const locationLng = watch('location_lng');
  const address = watch('address');

  const handleLocationChange = (location: { lat: number; lng: number; address?: string }) => {
    setValue('location_lat', location.lat, { shouldValidate: true });
    setValue('location_lng', location.lng, { shouldValidate: true });
    if (location.address) {
      setValue('address', location.address, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">
          Job Location
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          Where will the work be performed?
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setUseMapPicker(false)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              !useMapPicker
                ? 'bg-[#2563EB] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            Enter Address Manually
          </button>
          <button
            type="button"
            onClick={() => setUseMapPicker(true)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
              useMapPicker
                ? 'bg-[#2563EB] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            Pick on Map
          </button>
        </div>

        {!useMapPicker ? (
          <Input
            {...register('address')}
            label="Full Address"
            placeholder="Street address, city, state, zip code"
            error={errors.address?.message as string}
          />
        ) : (
          <div className="space-y-4">
            <Input
              {...register('address')}
              label="Address"
              placeholder="Selected address will appear here"
              error={errors.address?.message as string}
              disabled
            />
            <LocationPicker
              value={locationLat && locationLng ? { lat: locationLat, lng: locationLng, address } : undefined}
              onChange={handleLocationChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};