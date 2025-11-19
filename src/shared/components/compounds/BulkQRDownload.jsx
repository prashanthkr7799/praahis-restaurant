import React, { useState } from 'react';
import { Download, Printer, Package } from 'lucide-react';
import { downloadAllAsZip, printQRCodes } from '@shared/utils/helpers/qrGenerator';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import toast from 'react-hot-toast';

/**
 * BulkQRDownload Component
 * Handle bulk QR code operations (download as ZIP, print all)
 */
const BulkQRDownload = ({ tables, selectedTables = [] }) => {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { restaurantSlug } = useRestaurant();

  const tablesToProcess = selectedTables.length > 0 ? selectedTables : tables;

  const handleDownloadZip = async () => {
    if (tablesToProcess.length === 0) {
      toast.error('No tables selected');
      return;
    }

    try {
      setDownloading(true);
      toast.loading('Generating QR codes...', { id: 'zip-download' });

  const result = await downloadAllAsZip(tablesToProcess, 'restaurant-qr-codes', restaurantSlug);

      toast.success(`Downloaded ${result.count} QR codes successfully!`, {
        id: 'zip-download',
      });
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      toast.error('Failed to download QR codes', { id: 'zip-download' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintAll = async () => {
    if (tablesToProcess.length === 0) {
      toast.error('No tables selected');
      return;
    }

    try {
      setPrinting(true);
      toast.loading('Preparing print view...', { id: 'print-all' });

      await printQRCodes(tablesToProcess, {
        gridCols: 3,
        showTableNumber: true,
        showURL: true,
        pageSize: 'A4',
      }, restaurantSlug);

      toast.success('Print preview opened', { id: 'print-all' });
    } catch (error) {
      console.error('Error printing QR codes:', error);
      toast.error('Failed to open print preview', { id: 'print-all' });
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintGrid = async () => {
    if (tablesToProcess.length === 0) {
      toast.error('No tables selected');
      return;
    }

    try {
      setPrinting(true);
      toast.loading('Preparing compact print...', { id: 'print-grid' });

      await printQRCodes(tablesToProcess, {
        gridCols: 4,
        showTableNumber: true,
        showURL: false,
        pageSize: 'A4',
      }, restaurantSlug);

      toast.success('Compact print preview opened', { id: 'print-grid' });
    } catch (error) {
      console.error('Error printing grid:', error);
      toast.error('Failed to open print preview', { id: 'print-grid' });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-600 rounded-lg">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Bulk QR Code Operations
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {selectedTables.length > 0
              ? `${selectedTables.length} table(s) selected`
              : `Process all ${tables.length} tables`}
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Download ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={downloading || tablesToProcess.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Download ZIP</div>
                <div className="text-xs opacity-90">All QR codes + info</div>
              </div>
            </button>

            {/* Print Detailed */}
            <button
              onClick={handlePrintAll}
              disabled={printing || tablesToProcess.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Print Detailed</div>
                <div className="text-xs opacity-90">3 per page with URLs</div>
              </div>
            </button>

            {/* Print Compact */}
            <button
              onClick={handlePrintGrid}
              disabled={printing || tablesToProcess.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Print Compact</div>
                <div className="text-xs opacity-90">4 per page, no URLs</div>
              </div>
            </button>
          </div>

          {/* Info Text */}
          <div className="mt-4 p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>💡 Tip:</strong> Download as ZIP to get all QR codes plus a README file with
              table information. Perfect for backup or batch printing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkQRDownload;
