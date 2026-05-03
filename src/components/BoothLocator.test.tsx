import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoothLocator from './BoothLocator';
import { LanguageProvider } from '../context/LanguageContext';

vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: () => ({ isLoaded: true }),
  GoogleMap: ({ children }: { children?: React.ReactNode }) => <div data-testid="google-map">{children}</div>,
  Marker: ({ onClick }: { onClick?: () => void }) => <button data-testid="marker" onClick={onClick}>Marker</button>,
  InfoWindow: ({ children }: { children?: React.ReactNode }) => <div data-testid="info-window">{children}</div>
}));

describe('BoothLocator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        booths: [
          { id: 1, name: 'Test Booth', lat: 28.1, lng: 77.1, address: 'Test Address', distance: '1 km' }
        ]
      })
    });
  });

  const renderWithProvider = () => {
    return render(
      <LanguageProvider>
        <BoothLocator />
      </LanguageProvider>
    );
  };

  it('allows searching for booths and displays them on the map', async () => {
    renderWithProvider();

    expect(screen.getByText('Find Your Polling Booth')).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Enter Pincode or Address/i);
    fireEvent.change(input, { target: { value: '110001' } });

    const searchButton = screen.getByRole('button', { name: /Search Booth/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/booth-locator', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ address: '110001' })
      }));
    });

    const marker = await screen.findByTestId('marker');
    expect(marker).toBeInTheDocument();

    // Click marker to show InfoWindow
    fireEvent.click(marker);
    expect(screen.getByTestId('info-window')).toBeInTheDocument();
    expect(screen.getByText('Test Booth')).toBeInTheDocument();
    expect(screen.getByText('Test Address')).toBeInTheDocument();
  });
});
