import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FormWizard from './FormWizard';
import { LanguageProvider } from '../context/LanguageContext';

describe('FormWizard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock pdf content'], { type: 'application/pdf' }))
    });
  });

  const renderWithProvider = () => {
    return render(
      <LanguageProvider>
        <FormWizard />
      </LanguageProvider>
    );
  };

  it('navigates through all three steps and submits', async () => {
    const renderResult = renderWithProvider();

    // Step 1: Personal Details
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('E.g. Rahul Sharma');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    
    // There isn't a placeholder for date input, so we find it by type
    const dobInput = renderResult.container.querySelector('input[type="date"]');
    if (dobInput) {
        fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
    }

    const nextButtonStep1 = screen.getByText('Next');
    fireEvent.click(nextButtonStep1);

    // Step 2: Address
    expect(screen.getByText('Address')).toBeInTheDocument();
    
    const addressInput = screen.getByPlaceholderText('Enter your full residential address...');
    fireEvent.change(addressInput, { target: { value: '123 Fake Street, Delhi' } });

    const nextButtonStep2 = screen.getByText('Next');
    fireEvent.click(nextButtonStep2);

    // Step 3: Review
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('2000-01-01')).toBeInTheDocument();
    expect(screen.getByText('123 Fake Street, Delhi')).toBeInTheDocument();

    // Test PDF generation
    const downloadBtn = screen.getByText('Download PDF');
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-pdf', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', dob: '2000-01-01', address: '123 Fake Street, Delhi' })
      }));
    });
  });

  it('can navigate backwards', () => {
    renderWithProvider();
    
    // Go to step 2
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Address')).toBeInTheDocument();

    // Go back to step 1
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
  });
});
