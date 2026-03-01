import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { createRoom } from '../src/store/slices/rooms.slice';
import { getCurrentUser } from '../src/store/slices/auth.slice';
import { loadAllCities, loadAmenities } from '../src/store/slices/metadata.slice';
import ImageUpload from './ImageUpload';
import { RoomType, IdealFor } from '../src/types/api.types';
interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export function AddPropertyModal({
  isOpen,
  onClose
}: AddPropertyModalProps) {
  const dispatch = useAppDispatch();
  const isCreating = useAppSelector((state) => state.rooms.loading.create);
  const {
    allCities,
    amenities
  } = useAppSelector((state) => state.metadata);
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    location: '',
    landmark: '',
    pricePerMonth: '',
    roomType: 'Single' as RoomType,
    idealFor: ['Students'] as IdealFor[],
    description: '',
    amenities: [] as string[],
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
      // restore original value safely
      document.body.style.overflow = originalOverflow || 'auto';
    };
  }, []);
  if (!isOpen) return null;
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    if (formData.location.trim().length < 3) {
      newErrors.location = 'Location is required';
    }
    if (!formData.pricePerMonth || Number(formData.pricePerMonth) <= 0) {
      newErrors.pricePerMonth = 'Price must be positive';
    }
    // if (formData.description.trim().length < 20) {
    //   newErrors.description = "Description must be at least 20 characters";
    // }
    if (formData.description.trim().length < 20) {
      const remaining = 20 - formData.description.trim().length;
      newErrors.description = `${remaining} more character${remaining !== 1 ? 's' : ''} required`;
    }
    if (formData.idealFor.length === 0) {
      newErrors.idealFor = 'Please select at least one tenant type';
    }
    if (formData.images.length < 3) {
      newErrors.images = 'At least three images are required';
    }
    setErrors(newErrors);
    // 👇 Accessibility magic
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = fieldRefs.current[firstErrorKey];
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        (el as HTMLElement).focus();
      } else {
        errorSummaryRef.current?.focus();
      }
      return false;
    }
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const apiData = {
      ...formData,
      pricePerMonth: Number(formData.pricePerMonth)
    };
    dispatch(createRoom(apiData)).then((action) => {
      if (createRoom.fulfilled.match(action)) {
        // Refetch current user so role upgrade (TENANT → OWNER) is reflected in Redux state
        dispatch(getCurrentUser());
        onClose();
        setFormData({
          title: '',
          city: '',
          location: '',
          landmark: '',
          pricePerMonth: '',
          roomType: 'Single',
          idealFor: ['Students'],
          description: '',
          amenities: [],
          images: []
        });
        setErrors({});
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
            Add New Property
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
                {Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}
              </ul>
            </div>}

          {/* Property Photos */}
          <div ref={(el) => fieldRefs.current.images = el}>
            <ImageUpload images={formData.images} onImagesChange={(images) => setFormData((prev) => ({
            ...prev,
            images
          }))} />


            {errors.images && <p id="images-error" className="text-red-500 dark:text-red-400 text-xs mt-2">

                {errors.images}
              </p>}
          </div>

          {/* Title + City */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1 dark:text-slate-300">

                Property Title *
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

                City *
              </label>
              <select ref={(el) => fieldRefs.current.city = el} id="city" value={formData.city} onChange={(e) => setFormData({
              ...formData,
              city: e.target.value
            })} aria-invalid={!!errors.city} aria-describedby={errors.city ? 'city-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white
                  ${errors.city ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`}>

                <option value="">Select City</option>
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

                Location *
              </label>
              <input ref={(el) => fieldRefs.current.location = el} id="location" value={formData.location} onChange={(e) => setFormData({
              ...formData,
              location: e.target.value
            })} aria-invalid={!!errors.location} aria-describedby={errors.location ? 'location-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white
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

                Monthly Rent (₹) *
              </label>
              <input ref={(el) => fieldRefs.current.pricePerMonth = el} id="price" type="number" value={formData.pricePerMonth} onChange={(e) => setFormData({
              ...formData,
              pricePerMonth: e.target.value
            })} aria-invalid={!!errors.pricePerMonth} aria-describedby={errors.pricePerMonth ? 'price-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white
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
          <fieldset ref={(el) => fieldRefs.current.idealFor = el} aria-invalid={!!errors.idealFor} aria-describedby={errors.idealFor ? 'idealFor-error' : undefined}>

            <legend className="block text-sm font-medium mb-3 dark:text-slate-300">
              Ideal For *
            </legend>
            <div className="grid md:grid-cols-3 gap-2">
              {idealForOptions.map((option) => <label key={option} className="flex items-center gap-2 p-3 border dark:border-slate-600 rounded-lg dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">

                  <input type="checkbox" checked={formData.idealFor.includes(option)} onChange={() => toggleIdealFor(option)} />


                  {option}
                </label>)}
            </div>
            {errors.idealFor && <p id="idealFor-error" className="text-red-500 dark:text-red-400 text-xs mt-2">

                {errors.idealFor}
              </p>}
          </fieldset>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-slate-300">

              Description *
            </label>
            <textarea ref={(el) => fieldRefs.current.description = el} id="description" rows={4} value={formData.description} onChange={(e) => setFormData({
            ...formData,
            description: e.target.value
          })} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-white
        ${errors.description ? 'border-red-400 dark:border-red-700 focus:ring-red-300' : 'border-slate-200 dark:border-slate-600 focus:ring-gold'}`} />


            {errors.description && <p id="description-error" className="text-red-500 dark:text-red-400 text-xs mt-1">

                {errors.description}
              </p>}
          </div>
          <fieldset ref={(el) => fieldRefs.current.amenities = el} aria-invalid={!!errors.amenities} aria-describedby={errors.amenities ? 'amenities-error' : undefined} className="mt-2">

            <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Amenities
              <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">
                (Optional)
              </span>
            </legend>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {amenities.map((amenity) => <label key={amenity} className="flex items-center gap-2 cursor-pointer p-3
                   hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors
                   border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-gold">









                  <input type="checkbox" checked={formData.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="w-4 h-4 rounded border-slate-300 dark:border-slate-500
                     text-gold focus:ring-gold dark:bg-slate-700" />






                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {amenity}
                  </span>
                </label>)}
            </div>

            {errors.amenities && <p id="amenities-error" className="text-red-500 dark:text-red-400 text-xs mt-2" role="alert">

                {errors.amenities}
              </p>}
          </fieldset>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 border dark:border-slate-600 py-3 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg">

              Cancel
            </button>
            <button type="submit" disabled={isCreating} className="flex-1 py-3 bg-navy dark:bg-slate-200 text-white dark:text-navy rounded-lg disabled:opacity-50 hover:bg-navy/90 dark:hover:bg-white">

              {isCreating ? 'Adding Property...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>;
}