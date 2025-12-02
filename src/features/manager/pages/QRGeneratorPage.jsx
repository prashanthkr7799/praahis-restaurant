import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Download, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { getTables, getRestaurant } from '@config/supabase';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import { getQrTableLink } from '@shared/utils/linkHelpers';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import ErrorMessage from '@shared/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';

const QRGenerator = () => {
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [qrCodes, setQrCodes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingTable, setGeneratingTable] = useState(null);

  // Get slug from context and origin
  const { restaurantSlug } = useRestaurant();
  const origin = window.location.origin;

  // Generate QR code for a single table
  const generateQRCode = useCallback(async (tableId) => {
    try {
      // Here tableId is actually table.table_number in our usage below
      const url = restaurantSlug ? getQrTableLink(restaurantSlug, tableId) : `${origin}/table/${tableId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw err;
    }
  }, [origin, restaurantSlug]);

  // Generate QR codes for all tables
  const generateAllQRCodes = useCallback(async (tablesData) => {
    const qrCodeMap = {};
    for (const table of tablesData) {
      try {
        const qrCode = await generateQRCode(table.table_number);
        qrCodeMap[table.id] = qrCode;
      } catch (err) {
        console.error(`Error generating QR code for table ${table.table_number}:`, err);
      }
    }
    setQrCodes(qrCodeMap);
  }, [generateQRCode]);

  // Fetch restaurant and tables
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch restaurant data
      const restaurantData = await getRestaurant();
      if (!restaurantData) {
        throw new Error('Restaurant not found');
      }
      setRestaurant(restaurantData);

      // Fetch all tables
      const tablesData = await getTables(restaurantData.id);
      if (!tablesData || tablesData.length === 0) {
        throw new Error('No tables found');
      }
      setTables(tablesData);

      // Generate QR codes for all tables
      await generateAllQRCodes(tablesData);

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      setIsLoading(false);
    }
  }, [generateAllQRCodes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Download QR code
  const downloadQRCode = async (table) => {
    try {
      setGeneratingTable(table.id);

      const qrCodeDataUrl = qrCodes[table.id];
      if (!qrCodeDataUrl) {
        throw new Error('QR code not found');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${restaurant.name}-Table-${table.table_number}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`QR code downloaded for Table ${table.table_number}`);
      setGeneratingTable(null);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      toast.error('Failed to download QR code');
      setGeneratingTable(null);
    }
  };

  // Download all QR codes as a zip (simplified version - downloads one by one)
  const downloadAllQRCodes = async () => {
    try {
      toast.success('Downloading all QR codes...');
      for (const table of tables) {
        await downloadQRCode(table);
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast.success('All QR codes downloaded!');
    } catch (err) {
      console.error('Error downloading all QR codes:', err);
      toast.error('Failed to download all QR codes');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading QR Generator..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <ErrorMessage error={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <QrCode className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-2">QR Code Generator</h1>
          <p className="text-xl text-gray-400 mb-4">
            {restaurant?.name || 'Restaurant'}
          </p>
          <p className="text-gray-500">
            Generate and download QR codes for all your tables
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <button
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg shadow-md font-semibold transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Regenerate All
          </button>
          <button
            onClick={downloadAllQRCodes}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md font-semibold transition-colors"
          >
            <Download className="w-5 h-5" />
            Download All QR Codes
          </button>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-gray-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {/* Table Info */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Table {table.table_number}</h3>
                <p className="text-sm text-gray-500">Capacity: {table.capacity} guests</p>
                {table.location && (
                  <p className="text-sm text-gray-500">{table.location}</p>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-center">
                {qrCodes[table.id] ? (
                  <img
                    src={qrCodes[table.id]}
                    alt={`QR Code for Table ${table.table_number}`}
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                )}
              </div>

              {/* URL */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 text-center break-all">
                  {restaurantSlug ? getQrTableLink(restaurantSlug, table.table_number) : `${origin}/table/${table.table_number}`}
                </p>
              </div>

              {/* Download Button */}
              <button
                onClick={() => downloadQRCode(table)}
                disabled={generatingTable === table.id || !qrCodes[table.id]}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generatingTable === table.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download QR Code
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-gray-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">How to Use</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </span>
              <span>Download the QR code for each table using the "Download QR Code" button</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </span>
              <span>Print the QR codes or display them on table stands</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </span>
              <span>Customers can scan the QR code with their phone camera to view the menu and place orders</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                4
              </span>
              <span>Orders will appear in real-time on the Chef Dashboard</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
