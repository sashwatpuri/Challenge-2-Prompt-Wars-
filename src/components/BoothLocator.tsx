/**
 * BoothLocator.tsx — Polling Booth Finder
 *
 * Renders an interactive Google Map that shows mock nearby polling booth locations.
 * Users can:
 *  - Enter a pincode or address and press Search to fetch booths from the backend
 *  - Click any Marker to see an InfoWindow with the booth name, address, and distance
 *  - Click the link at the bottom to look up their official voter information on eci.gov.in
 *
 * Map API key is loaded from VITE_GOOGLE_MAPS_API_KEY (front-end env variable).
 * Booth data currently comes from a mock backend endpoint (/api/booth-locator).
 */

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, ExternalLink, Search, Navigation } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booth {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address: string;
  distance: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fixed pixel dimensions passed to the GoogleMap component. */
const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
} as const;

/** Default map centre — New Delhi coordinates. Overridden by first booth result. */
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

/** Localised UI strings keyed by language code. */
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    title:        'Find Your Polling Booth',
    desc:         'Enter your pincode or address to locate your nearest polling booth on the map.',
    placeholder:  'Enter Pincode or Address',
    search:       'Search Booth',
    btn:          'Search on ECI Portal',
    mapLoading:   'Map loading...',
    officialNote: 'Official voter slip is required for accurate booth information.',
    away:         'away',
    directions:   'Directions',
  },
  hi: {
    title:        'अपना मतदान केंद्र खोजें',
    desc:         'मानचित्र पर अपना निकटतम मतदान केंद्र खोजने के लिए अपना पिनकोड या पता दर्ज करें।',
    placeholder:  'पिनकोड या पता दर्ज करें',
    search:       'बूथ खोजें',
    btn:          'ECI पोर्टल पर खोजें',
    mapLoading:   'मानचित्र लोड हो रहा है...',
    officialNote: 'सटीक जानकारी के लिए आधिकारिक मतदाता पर्ची आवश्यक है।',
    away:         'दूर',
    directions:   'दिशाएँ',
  },
  ta: {
    title:        'உங்கள் வாக்குச் சாவடியைக் கண்டறியவும்',
    desc:         'வரைபடத்தில் உங்களுக்கு அருகிலுள்ள வாக்குச் சாவடியைக் கண்டறிய உங்கள் பின்கோடு அல்லது முகவரியை உள்ளிடவும்.',
    placeholder:  'பின்கோடு அல்லது முகவரியை உள்ளிடவும்',
    search:       'சாவடியைத் தேடுக',
    btn:          'ECI போர்ட்டலில் தேடுக',
    mapLoading:   'வரைபடம் ஏற்றப்படுகிறது...',
    officialNote: 'துல்லியமான தகவலுக்கு அதிகாரப்பூர்வ வாக்காளர் ரசீது தேவை.',
    away:         'தொலைவு',
    directions:   'திசைகள்',
  },
  mr: {
    title:        'तुमचे मतदान केंद्र शोधा',
    desc:         'नकाशावर तुमचे जवळचे मतदान केंद्र शोधण्यासाठी तुमचा पिनकोड किंवा पत्ता प्रविष्ट करा.',
    placeholder:  'पिनकोड किंवा पत्ता प्रविष्ट करा',
    search:       'बूथ शोधा',
    btn:          'ECI पोर्टलवर शोधा',
    mapLoading:   'नकाशा लोड होत आहे...',
    officialNote: 'अचूक माहितीसाठी अधिकृत मतदार चिठ्ठी आवश्यक आहे.',
    away:         'दूर',
    directions:   'दिशा',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BoothLocator() {
  const { language } = useLanguage();
  const str = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [address, setAddress]           = useState('');
  const [booths, setBooths]             = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [loading, setLoading]           = useState(false);

  // Load the Google Maps JS SDK — key must be set in .env as VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // ─── Handlers ────────────────────────────────────────────────────────────

  /**
   * Calls the mock /api/booth-locator endpoint with the user's entered address.
   * Updates the booths list, which re-centres the map on the first result.
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    try {
      const res  = await fetch('/api/booth-locator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.booths) setBooths(data.booths);
    } catch (err) {
      console.error('[BoothLocator] Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Sticky header */}
      <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">{str.title}</h2>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center text-center max-w-4xl mx-auto w-full">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <MapPin size={32} className="text-[var(--color-india-blue)]" />
        </div>

        <p className="text-gray-600 mb-6 max-w-md text-md">{str.desc}</p>

        {/* Search form */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-8 flex gap-2">
          <input
            type="text"
            placeholder={str.placeholder}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[var(--color-india-blue)] text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            <Search size={20} />
            {loading ? '...' : str.search}
          </button>
        </form>

        {/* Map area */}
        <div className="w-full bg-white p-2 rounded-2xl shadow-lg border border-gray-100 mb-8">
          {!isLoaded ? (
            // Maps SDK hasn't loaded yet (or key is missing)
            <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
              {str.mapLoading}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              // Re-centre on the first result whenever booths are fetched
              center={booths.length > 0 ? { lat: booths[0].lat, lng: booths[0].lng } : DEFAULT_CENTER}
              zoom={13}
            >
              {/* Render one Marker per booth result */}
              {booths.map((booth) => (
                <Marker
                  key={booth.id}
                  position={{ lat: booth.lat, lng: booth.lng }}
                  onClick={() => setSelectedBooth(booth)}
                />
              ))}

              {/* InfoWindow shown when a marker is selected */}
              {selectedBooth && (
                <InfoWindow
                  position={{ lat: selectedBooth.lat, lng: selectedBooth.lng }}
                  onCloseClick={() => setSelectedBooth(null)}
                >
                  <div className="p-2 text-left">
                    <h3 className="font-bold text-gray-900">{selectedBooth.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedBooth.address}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      {selectedBooth.distance} {str.away}
                    </p>
                    <button className="mt-2 text-xs flex items-center gap-1 text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                      <Navigation size={12} /> {str.directions}
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Footer — link to official ECI portal */}
        <div className="mt-auto pt-6 w-full max-w-md border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">{str.officialNote}</p>
          <a
            href="https://electoralsearch.eci.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-95 border border-gray-300"
          >
            <span className="text-base">{str.btn}</span>
            <ExternalLink size={16} className="opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
