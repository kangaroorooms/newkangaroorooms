import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { updateRoom } from '../src/store/slices/rooms.slice';
import { loadAllCities, loadAmenities } from '../src/store/slices/metadata.slice';
import ImageUpload from './ImageUpload';
import { Room, IdealFor } from '../src/types/api.types';
import { showToast } from '../src/store/slices/ui.slice';
interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}
export function EditPropertyModal({
  isOpen,
  onClose,
  room
}: EditPropertyModalProps) {
  const dispatch = useAppDispatch();
  const {
    loading
  } = useAppSelector((state) => state.rooms);
  const {
    allCities,
    amenities
  } = useAppSelector((state) => state.metadata);
  const isUpdating = useAppSelector((state) => state.rooms.loading.update);
  const [initialData, setInitialData] = useState<typeof formData | null>(null);
  const [formData, setFormData] = useState({
    title: room.title,
    city: room.city,
    location: room.location,
    landmark: room.landmark,
    pricePerMonth: room.pricePerMonth.toString(),
    roomType: room.roomType,
    idealFor: room.idealFor,
    description: room.description,
    amenities: room.amenities,
    images: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  // Available ideal tenant types
  const idealForOptions: IdealFor[] = ['Students', 'Working Professionals', 'Family'];
  useEffect(() => {
    if (allCities.length === 0) {
      dispatch(loadAllCities());
    }
    if (amenities.length === 0) {
      dispatch(loadAmenities());
    }
  }, [dispatch, allCities.length, amenities.length]);
  useEffect(() => {
    const data = {
      title: room.title,
      city: room.city,
      location: room.location,
      landmark: room.landmark,
      pricePerMonth: room.pricePerMonth.toString(),
      roomType: room.roomType,
      idealFor: room.idealFor,
      description: room.description,
      amenities: room.amenities,
      images: Array.isArray(room.images) ? room.images : []
    };
    setFormData(data);
    setInitialData(data);
  }, [isOpen]);
  // useEffect(() => {
  //   document.body.style.overflow = 'hidden';
  //   return () => {
  //     document.body.style.overflow = '';
  //   };
  // }, []);
  useEffect(() => {
    // store original overflow value
    const originalOverflow = document.body.style.overflow;

    // lock scroll
    document.body.style.overflow = 'hidden';
    return () => {
      // restore original value correctly
      document.body.style.overflow = originalOverflow || 'auto';
    };
  }, []);
  if (!isOpen) return null;
  const getChangedFields = () => {
    if (!initialData) return {};
    const changed: any = {};
    (Object.keys(formData) as (keyof typeof formData)[]).forEach((key) => {
      const current = formData[key];
      const initial = initialData[key];
      if (JSON.stringify(current) !== JSON.stringify(initial)) {
        changed[key] = key === 'pricePerMonth' ? Number(current) : current;
      }
    });
    return changed;
  };
  const validateChangedFields = (data: any) => {
    const newErrors: Record<string, string> = {};
    if ('title' in data && data.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    if ('city' in data && !data.city) {
      newErrors.city = 'City is required';
    }
    if ('location' in data && data.location.trim().length < 3) {
      newErrors.location = 'Location is required';
    }
    if ('pricePerMonth' in data && Number(data.pricePerMonth) <= 0) {
      newErrors.pricePerMonth = 'Price must be positive';
    }
    // if ("description" in data && data.description.trim().length < 20) {
    //   newErrors.description = "Description must be at least 20 characters";
    // }
    if ('description' in data && data.description.trim().length < 20) {
      const remaining = 20 - data.description.trim().length;
      newErrors.description = `${remaining} more character${remaining !== 1 ? 's' : ''} required`;
    }
    if ('idealFor' in data && data.idealFor.length === 0) {
      newErrors.idealFor = 'Select at least one tenant type';
    }
    if ('images' in data && data.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      fieldRefs.current[firstKey]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      fieldRefs.current[firstKey]?.focus?.();
      errorSummaryRef.current?.focus();
      return false;
    }
    return true;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const changedData = getChangedFields();
    if (Object.keys(changedData).length === 0) {
      dispatch(showToast({
        message: 'No changes made',
        type: 'info'
      }));
      return;
    }
    if (!validateChangedFields(changedData)) return;
    dispatch(updateRoom({
      id: room.id,
      data: changedData
    })).then((action) => {
      if (updateRoom.fulfilled.match(action)) {
        onClose();
      }
    });
  };
  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity]
    }));
  };
  const toggleIdealFor = (option: IdealFor) => {
    setFormData((prev) => ({
      ...prev,
      idealFor: prev.idealFor.includes(option) ? prev.idealFor.filter((o) => o !== option) : [...prev.idealFor, option]
    }));
  };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={onClose} />


      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl my-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
          <h3 className="text-2xl font-playfair font-bold text-navy dark:text-white">
            Edit Property
          </h3>
          <button onClick={onClose} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">

            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Error summary */}
          {Object.keys(errors).length > 0 && <div ref={errorSummaryRef} tabIndex={-1} role="alert" aria-live="assertive" className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">

              <p className="font-semibold text-red-700 dark:text-red-400">
                Please fix the following errors:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-red-600 dark:text-red-300">
                {Object.values(errors).map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>}

          {/* Property Photos */}
          <div ref={(el) => fieldRefs.current.images = el}>
            <ImageUpload images={formData.images} onImagesChange={(images) => setFormData((prev) => ({
            ...prev,
            images
          }))} />


            {errors.images && <p className="text-red-500 dark:text-red-400 text-xs mt-2">
                {errors.images}
              </p>}
          </div>

          {/* Title + City */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1 dark:text-slate-300">

                Property Title
              </label>
              <input ref={(el) => fieldRefs.current.title = el} id="title" value={formData.title} onChange={(e) => setFormData({
              ...formData,
              title: e.target.value
            })} aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white
          ${errors.title ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`} />


              {errors.title && <p id="title-error" className="text-red-500 dark:text-red-400 text-xs mt-1">

                  {errors.title}
                </p>}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1 dark:text-slate-300">

                City
              </label>
              <select ref={(el) => fieldRefs.current.city = el} id="city" value={formData.city} onChange={(e) => setFormData({
              ...formData,
              city: e.target.value
            })} aria-invalid={!!errors.city} aria-describedby={errors.city ? 'cityId-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white
                  ${errors.city ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`}>

                {allCities.map((c) => <option key={c.id} value={c.id}>
                    {c.name}
                  </option>)}
              </select>
              {errors.city && <p id="city-error" className="text-red-500 dark:text-red-400 text-xs mt-1">

                  {errors.city}
                </p>}
            </div>
          </div>

          {/* Location + Landmark */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1 dark:text-slate-300">

                Location
              </label>
              <input ref={(el) => fieldRefs.current.location = el} id="location" value={formData.location} onChange={(e) => setFormData({
              ...formData,
              location: e.target.value
            })} aria-invalid={!!errors.location} aria-describedby={errors.location ? 'location-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 dark:bg-slate-700 dark:text-white
          ${errors.location ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`} />


              {errors.location && <p id="location-error" className="text-red-500 dark:text-red-400 text-xs mt-1">

                  {errors.location}
                </p>}
            </div>

            <div>
              <label htmlFor="landmark" className="block text-sm font-medium mb-1 dark:text-slate-300">

                Landmark
              </label>
              <input id="landmark" value={formData.landmark} onChange={(e) => setFormData({
              ...formData,
              landmark: e.target.value
            })} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-gold dark:bg-slate-700 dark:text-white" />

            </div>
          </div>

          {/* Price + Room Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1 dark:text-slate-300">

                Monthly Rent (₹)
              </label>
              <input ref={(el) => fieldRefs.current.pricePerMonth = el} id="price" type="number" value={formData.pricePerMonth} onChange={(e) => setFormData({
              ...formData,
              pricePerMonth: e.target.value
            })} aria-invalid={!!errors.pricePerMonth} aria-describedby={errors.pricePerMonth ? 'price-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 dark:bg-slate-700 dark:text-white
          ${errors.pricePerMonth ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`} />


              {errors.pricePerMonth && <p id="price-error" className="text-red-500 dark:text-red-400 text-xs mt-1">

                  {errors.pricePerMonth}
                </p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                Room Type
              </label>
              <select value={formData.roomType} onChange={(e) => setFormData({
              ...formData,
              roomType: e.target.value as any
            })} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-gold dark:bg-slate-700 dark:text-white">

                <option value="Single">Single</option>
                <option value="Shared">Shared</option>
                <option value="PG">PG</option>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
              </select>
            </div>
          </div>

          {/* Ideal For */}
          <fieldset ref={(el) => fieldRefs.current.idealFor = el} aria-invalid={!!errors.idealFor} className="space-y-2">

            <legend className="block text-sm font-medium dark:text-slate-300">
              Ideal For
            </legend>
            <div className="grid md:grid-cols-3 gap-2">
              {idealForOptions.map((option) => <label key={option} className="flex items-center gap-2 p-3 border dark:border-slate-600 rounded-lg dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">

                  <input type="checkbox" checked={formData.idealFor.includes(option)} onChange={() => toggleIdealFor(option)} />


                  {option}
                </label>)}
            </div>
            {errors.idealFor && <p className="text-red-500 dark:text-red-400 text-xs">
                {errors.idealFor}
              </p>}
          </fieldset>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-slate-300">

              Description
            </label>
            <textarea ref={(el) => fieldRefs.current.description = el} id="description" rows={4} value={formData.description} onChange={(e) => setFormData({
            ...formData,
            description: e.target.value
          })} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 dark:bg-slate-700 dark:text-white
        ${errors.description ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`} />


            {errors.description && <p id="description-error" className="text-red-500 dark:text-red-400 text-xs mt-1">

                {errors.description}
              </p>}
          </div>

          {/* Amenities */}
          <fieldset ref={(el) => fieldRefs.current.amenities = el} className="space-y-2">

            <legend className="block text-sm font-medium dark:text-slate-300">
              Amenities
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {amenities.map((amenity) => <label key={amenity} className="flex items-center gap-2 p-3 border dark:border-slate-600 rounded-lg dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">

                  <input type="checkbox" checked={formData.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />


                  {amenity}
                </label>)}
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose}
          // disabled={loading}
          className="flex-1 py-3 border dark:border-slate-600 rounded-lg dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">

              Cancel
            </button>
            <button type="submit" disabled={isUpdating} className="flex-1 py-3 bg-navy dark:bg-slate-200 text-white dark:text-navy rounded-lg
                 disabled:opacity-50 hover:bg-navy/90 dark:hover:bg-white">










              {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>;
}