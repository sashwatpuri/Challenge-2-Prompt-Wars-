import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, ExternalLink, Search, Navigation } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
};

const center = {
  lat: 28.6139,
  lng: 77.2090
};

export default function BoothLocator() {
  const { language } = useLanguage();
  const [address, setAddress] = useState('');
  const [booths, setBooths] = useState<any[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const translations = {
    en: { title: 'Find Your Polling Booth', desc: 'Enter your pincode or address to locate your nearest polling booth on the map.', btn: 'Search on ECI Portal', search: 'Search Booth', placeholder: 'Enter Pincode or Address', mapUnavailable: 'Map loading...' },
    hi: { title: 'अपना मतदान केंद्र खोजें', desc: 'मानचित्र पर अपना निकटतम मतदान केंद्र खोजने के लिए अपना पिनकोड या पता दर्ज करें।', btn: 'ECI पोर्टल पर खोजें', search: 'बूथ खोजें', placeholder: 'पिनकोड या पता दर्ज करें', mapUnavailable: 'मानचित्र लोड हो रहा है...' },
    ta: { title: 'உங்கள் வாக்குச் சாவடியைக் கண்டறியவும்', desc: 'வரைபடத்தில் உங்களுக்கு அருகிலுள்ள வாக்குச் சாவடியைக் கண்டறிய உங்கள் பின்கோடு அல்லது முகவரியை உள்ளிடவும்.', btn: 'ECI போர்ட்டலில் தேடுக', search: 'சாவடியைத் தேடுக', placeholder: 'பின்கோடு அல்லது முகவரியை உள்ளிடவும்', mapUnavailable: 'வரைபடம் ஏற்றப்படுகிறது...' },
    mr: { title: 'तुमचे मतदान केंद्र शोधा', desc: 'नकाशावर तुमचे जवळचे मतदान केंद्र शोधण्यासाठी तुमचा पिनकोड किंवा पत्ता प्रविष्ट करा.', btn: 'ECI पोर्टलवर शोधा', search: 'बूथ शोधा', placeholder: 'पिनकोड किंवा पत्ता प्रविष्ट करा', mapUnavailable: 'नकाशा लोड होत आहे...' },
  };

  const strings = translations[language as keyof typeof translations] || translations.en;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/booth-locator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await res.json();
      if (data.booths) {
        setBooths(data.booths);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-4 bg-white border-b sticky top-0 z-10 shadow-sm flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">{strings.title}</h2>
      </div>
      
      <div className="p-6 flex-1 flex flex-col items-center text-center max-w-4xl mx-auto w-full">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <MapPin size={32} className="text-[var(--color-india-blue)]" />
        </div>
        
        <p className="text-gray-600 mb-6 max-w-md text-md">
          {strings.desc}
        </p>

        <form onSubmit={handleSearch} className="w-full max-w-md mb-8 flex gap-2">
          <input
            type="text"
            placeholder={strings.placeholder}
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
            {loading ? '...' : strings.search}
          </button>
        </form>

        <div className="w-full bg-white p-2 rounded-2xl shadow-lg border border-gray-100 mb-8">
          {!isLoaded ? (
            <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
              {strings.mapUnavailable}
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={booths.length > 0 ? { lat: booths[0].lat, lng: booths[0].lng } : center}
              zoom={13}
            >
              {booths.map((booth) => (
                <Marker
                  key={booth.id}
                  position={{ lat: booth.lat, lng: booth.lng }}
                  onClick={() => setSelectedBooth(booth)}
                />
              ))}
              
              {selectedBooth && (
                <InfoWindow
                  position={{ lat: selectedBooth.lat, lng: selectedBooth.lng }}
                  onCloseClick={() => setSelectedBooth(null)}
                >
                  <div className="p-2 text-left">
                    <h3 className="font-bold text-gray-900">{selectedBooth.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedBooth.address}</p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">{selectedBooth.distance} away</p>
                    <button className="mt-2 text-xs flex items-center gap-1 text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                      <Navigation size={12} /> Directions
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
        
        <div className="mt-auto pt-6 w-full max-w-md border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Official voter slip is required for accurate booth information.</p>
          <a 
            href="https://electoralsearch.eci.gov.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-95 border border-gray-300"
          >
            <span className="text-base">{strings.btn}</span>
            <ExternalLink size={16} className="opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
