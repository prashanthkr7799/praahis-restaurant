/**
 * PHASE 10 — QR CHECKIN MODAL
 * 
 * QR code display and scanning for check-in
 */

import { X, QrCode, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { generateReservationQRData } from '../utils/reservationUtils';

export default function QRCheckinModal({ reservation, onClose, onSuccess }) {
  const [qrDataURL, setQrDataURL] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    generateQRCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateQRCode() {
    const qrData = generateReservationQRData(reservation);
    
    // In a real implementation, use a QR library like qrcode.react or qr-code-styling
    // For now, we'll use a simple data URL approach
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    setQrDataURL(qrUrl);
  }

  async function handleCheckIn() {
    setChecking(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'arrived',
          checked_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-400" />
            QR Check-in
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-white font-medium text-lg">{reservation.customer_name}</p>
            <p className="text-white/60 text-sm mt-1">Party of {reservation.party_size}</p>
            <p className="text-white/60 text-sm">Table {reservation.table_number || 'TBD'}</p>
          </div>

          <div className="bg-white p-4 rounded-xl">
            {qrDataURL ? (
              <img src={qrDataURL} alt="QR Code" className="w-full h-auto" />
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <p className="text-white/60 text-sm text-center">
            Customer can scan this QR code on arrival for quick check-in
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all font-medium"
            >
              Close
            </button>
            <button
              onClick={handleCheckIn}
              disabled={checking || reservation.status === 'arrived'}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checking ? (
                'Checking in...'
              ) : reservation.status === 'arrived' ? (
                <>
                  <Check className="w-4 h-4" />
                  Already Checked In
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Mark as Arrived
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
