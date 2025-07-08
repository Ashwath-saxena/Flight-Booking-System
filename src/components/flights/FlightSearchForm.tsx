// frontend/src/components/flights/FlightSearchForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const CABIN_CLASSES = [
  'Economy',
  'Premium Economy',
  'Business',
  'First',
];

const TRIP_TYPES = [
  { label: 'One-way', value: 'one-way' },
  { label: 'Round-trip', value: 'round-trip' },
];

export type FlightSearchParams = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: 'one-way' | 'round-trip';
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
};

function formatDate(date: Date | undefined) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function FlightSearchForm({ onSearch }: { onSearch: (params: FlightSearchParams) => void }) {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState(CABIN_CLASSES[0]);
  const [cities, setCities] = useState<string[]>([]);
  const [showDepCal, setShowDepCal] = useState(false);
  const [showRetCal, setShowRetCal] = useState(false);

  // For styled dropdowns
  const [showTripDropdown, setShowTripDropdown] = useState(false);
  const [showCabinDropdown, setShowCabinDropdown] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/airports/cities')
      .then(res => res.json())
      .then(data => setCities(data.cities || []))
      .catch(() => setCities([]));
  }, []);

  // For filtering city dropdowns
  const filteredOrigins = origin
    ? cities.filter(city => city.toLowerCase().includes(origin.toLowerCase()))
    : cities;
  const filteredDestinations = destination
    ? cities.filter(city => city.toLowerCase().includes(destination.toLowerCase()))
    : cities;

  // Click outside for dropdowns
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('.dropdown-trip')) setShowTripDropdown(false);
      if (!(e.target as HTMLElement).closest('.dropdown-cabin')) setShowCabinDropdown(false);
      if (!(e.target as HTMLElement).closest('.dropdown-origin')) setShowOriginDropdown(false);
      if (!(e.target as HTMLElement).closest('.dropdown-dest')) setShowDestDropdown(false);
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      origin,
      destination,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      tripType,
      adults,
      children,
      infants,
      cabinClass,
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white/90 shadow-2xl rounded-2xl px-8 py-10 flex flex-col gap-10 max-w-2xl mx-auto my-10 border border-blue-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <motion.div className="flex flex-col md:flex-row gap-8">
        {/* Trip Type Dropdown */}
        <div className="flex-1 relative dropdown-trip">
          <label className="block mb-2 font-semibold text-blue-900">Trip Type</label>
          <button
            type="button"
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 bg-white flex justify-between items-center hover:border-blue-400 transition focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowTripDropdown(v => !v)}
          >
            <span>{TRIP_TYPES.find(t => t.value === tripType)?.label}</span>
            <span className={`transition ${showTripDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>
          <AnimatePresence>
            {showTripDropdown && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-20 mt-2 w-full bg-white border border-blue-200 rounded-xl shadow-xl py-1"
              >
                {TRIP_TYPES.map(t => (
                  <li
                    key={t.value}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition ${tripType === t.value ? 'font-bold text-blue-800 bg-blue-50' : ''}`}
                    onClick={() => { setTripType(t.value as 'one-way' | 'round-trip'); setShowTripDropdown(false); }}
                  >
                    {t.label}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {/* Cabin Class Dropdown */}
        <div className="flex-1 relative dropdown-cabin">
          <label className="block mb-2 font-semibold text-blue-900">Cabin Class</label>
          <button
            type="button"
            className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 bg-white flex justify-between items-center hover:border-blue-400 transition focus:ring-2 focus:ring-blue-400"
            onClick={() => setShowCabinDropdown(v => !v)}
          >
            <span>{cabinClass}</span>
            <span className={`transition ${showCabinDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>
          <AnimatePresence>
            {showCabinDropdown && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-20 mt-2 w-full bg-white border border-blue-200 rounded-xl shadow-xl py-1"
              >
                {CABIN_CLASSES.map(c => (
                  <li
                    key={c}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition ${cabinClass === c ? 'font-bold text-blue-800 bg-blue-50' : ''}`}
                    onClick={() => { setCabinClass(c); setShowCabinDropdown(false); }}
                  >
                    {c}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* Origin & Destination */}
      <motion.div className="flex flex-col md:flex-row gap-8">
        {/* Origin Dropdown */}
        <div className="flex-1 relative dropdown-origin">
          <label className="block mb-2 font-semibold text-blue-900">Origin</label>
          <input
            type="text"
            ref={originInputRef}
            value={origin}
            onChange={e => {
              setOrigin(e.target.value);
              setShowOriginDropdown(true);
            }}
            onFocus={() => setShowOriginDropdown(true)}
            className="border-2 border-blue-200 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Enter origin city"
            required
            autoComplete="off"
          />
          <AnimatePresence>
            {showOriginDropdown && filteredOrigins.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-20 mt-1 w-full bg-white border border-blue-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
              >
                {filteredOrigins.slice(0, 8).map(city => (
                  <li
                    key={city}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition ${origin === city ? 'font-bold text-blue-800 bg-blue-50' : ''}`}
                    onMouseDown={() => { setOrigin(city); setShowOriginDropdown(false); }}
                  >
                    {city}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {/* Destination Dropdown */}
        <div className="flex-1 relative dropdown-dest">
          <label className="block mb-2 font-semibold text-blue-900">Destination</label>
          <input
            type="text"
            ref={destInputRef}
            value={destination}
            onChange={e => {
              setDestination(e.target.value);
              setShowDestDropdown(true);
            }}
            onFocus={() => setShowDestDropdown(true)}
            className="border-2 border-blue-200 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Enter destination city"
            required
            autoComplete="off"
          />
          <AnimatePresence>
            {showDestDropdown && filteredDestinations.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-20 mt-1 w-full bg-white border border-blue-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
              >
                {filteredDestinations.slice(0, 8).map(city => (
                  <li
                    key={city}
                    className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition ${destination === city ? 'font-bold text-blue-800 bg-blue-50' : ''}`}
                    onMouseDown={() => { setDestination(city); setShowDestDropdown(false); }}
                  >
                    {city}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* Dates */}
      <motion.div className="flex flex-col md:flex-row gap-8 relative">
        {/* Departure Date calendar */}
        <div className="flex-1 relative">
          <label className="block mb-2 font-semibold text-blue-900">Departure Date</label>
          <button
            type="button"
            className={`border-2 rounded-lg px-4 py-3 w-full text-left bg-white transition focus:ring-2 ${showDepCal ? "border-blue-400 ring-2 ring-blue-200" : "border-blue-200"}`}
            onClick={() => setShowDepCal(val => !val)}
          >
            {departureDate ? new Date(departureDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select date'}
            <span className="float-right text-blue-400 text-xl pointer-events-none ml-2">📅</span>
          </button>
          <AnimatePresence>
            {showDepCal && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="absolute z-50 left-0 mt-2 bg-white rounded-xl shadow-2xl border border-blue-200 p-2"
              >
                <DayPicker
                  mode="single"
                  selected={departureDate ? new Date(departureDate) : undefined}
                  onSelect={(date) => {
                    if (date) setDepartureDate(formatDate(date));
                    setShowDepCal(false);
                  }}
                  fromDate={new Date()}
                  styles={{
                    day: { fontWeight: 500, borderRadius: '8px', width: 36, height: 36 },
                    caption_label: { fontWeight: 600, color: '#2563eb' },
                    nav: { display: 'flex', justifyContent: 'space-between' },
                  }}
                  showOutsideDays
                  weekStartsOn={1}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Return Date calendar */}
        <AnimatePresence>
          {tripType === 'round-trip' && (
            <motion.div
              className="flex-1 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
            >
              <label className="block mb-2 font-semibold text-blue-900">Return Date</label>
              <button
                type="button"
                className={`border-2 rounded-lg px-4 py-3 w-full text-left bg-white transition focus:ring-2 ${showRetCal ? "border-blue-400 ring-2 ring-blue-200" : "border-blue-200"}`}
                onClick={() => setShowRetCal(val => !val)}
              >
                {returnDate ? new Date(returnDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select date'}
                <span className="float-right text-blue-400 text-xl pointer-events-none ml-2">📅</span>
              </button>
              <AnimatePresence>
                {showRetCal && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute z-50 left-0 mt-2 bg-white rounded-xl shadow-2xl border border-blue-200 p-2"
                  >
                    <DayPicker
                      mode="single"
                      selected={returnDate ? new Date(returnDate) : undefined}
                      onSelect={(date) => {
                        if (date) setReturnDate(formatDate(date));
                        setShowRetCal(false);
                      }}
                      fromDate={departureDate ? new Date(departureDate) : new Date()}
                      styles={{
                        day: { fontWeight: 500, borderRadius: '8px', width: 36, height: 36 },
                        caption_label: { fontWeight: 600, color: '#2563eb' },
                        nav: { display: 'flex', justifyContent: 'space-between' },
                      }}
                      showOutsideDays
                      weekStartsOn={1}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-blue-900">Adults</label>
          <motion.input
            type="number"
            min={1}
            max={9}
            value={adults}
            onChange={e => setAdults(Number(e.target.value))}
            className="border-2 border-blue-200 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-400 transition"
            required
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-blue-900">Children</label>
          <motion.input
            type="number"
            min={0}
            max={9}
            value={children}
            onChange={e => setChildren(Number(e.target.value))}
            className="border-2 border-blue-200 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-400 transition"
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-2 font-semibold text-blue-900">Infants</label>
          <motion.input
            type="number"
            min={0}
            max={9}
            value={infants}
            onChange={e => setInfants(Number(e.target.value))}
            className="border-2 border-blue-200 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-blue-400 transition"
            whileFocus={{ scale: 1.03, borderColor: "#2563eb" }}
          />
        </div>
      </motion.div>
      <motion.button
        type="submit"
        className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-green-500 hover:to-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg mt-2 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        Search Flights
      </motion.button>
    </motion.form>
  );
}