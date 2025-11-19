import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer, Eye, RefreshCw } from 'lucide-react';
import { generateQR, downloadQR } from '@shared/utils/helpers/qrGenerator';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import { getQrTableLink } from '@shared/utils/helpers/linkHelpers';
import toast from 'react-hot-toast';

/**
 * TableQRCard Component
 * Displays individual table QR code with actions
 */
const TableQRCard = ({ table, onRegenerate: _onRegenerate }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const { restaurantSlug } = useRestaurant();

  const loadQRCode = useCallback(async () => {
    try {
      setLoading(true);
      const dataUrl = await generateQR(table, {
        size: 300,
        margin: 2,
      }, restaurantSlug);
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error loading QR code:', error);
      toast.error('Failed to load QR code');
    } finally {
      setLoading(false);
    }
  }, [table, restaurantSlug]);

  useEffect(() => {
    loadQRCode();
  }, [loadQRCode]);

  const handleDownload = () => {
    try {
      downloadQR(qrDataUrl, `Table-${table.table_number}`);
      toast.success(`QR code for Table ${table.table_number} downloaded`);
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Table ${table.table_number} QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              h1 { margin: 20px 0; }
              img { max-width: 400px; border: 2px solid #000; padding: 10px; }
              p { margin: 10px 0; color: #666; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>Table ${table.table_number}</h1>
            <img src="${qrDataUrl}" alt="QR Code" />
            <p>Scan to order from your table</p>
            <p>Seating Capacity: ${table.capacity || 4} people</p>
            <script>
              window.onload = () => {
                setTimeout(() => window.print(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing QR:', error);
      toast.error('Failed to print QR code');
    }
  };

  const qrUrl = restaurantSlug ? getQrTableLink(restaurantSlug, table.table_number) : `${window.location.origin}/table/${table.table_number}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Table {table.table_number}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              table.status === 'occupied'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {table.status === 'occupied' ? 'Occupied' : 'Available'}
          </span>
        </div>

        {/* QR Code Preview */}
        <div className="flex justify-center mb-4 bg-gray-50 rounded-lg p-4">
          {loading ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <img
              src={qrDataUrl}
              alt={`QR Code for Table ${table.table_number}`}
              className="w-48 h-48 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowPreview(true)}
            />
          )}
        </div>

        {/* Table Info */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Seating:</span>
            <span className="font-medium text-gray-900">{table.capacity || 4} people</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-600">URL:</span>
            <span className="font-mono text-xs text-gray-900 break-all text-right ml-2">
              {qrUrl}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download QR Code"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Print QR Code"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => setShowPreview(true)}
            disabled={loading}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Preview QR Code"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Table {table.table_number} QR Code
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <img src={qrDataUrl} alt="QR Code Preview" className="w-full max-w-sm" />
            </div>
            <div className="text-sm text-gray-600 text-center">
              <p className="mb-2">Scan this code to access Table {table.table_number}</p>
              <p className="font-mono text-xs break-all">{qrUrl}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableQRCard;
