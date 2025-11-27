/**
 * ViewAllQRCodesModal - Display all table QR codes
 * Allows printing individual or all QR codes, downloading as PNG or ZIP
 */

import React, { useState, useEffect } from 'react';
import { X, Download, Printer, QrCode as QrCodeIcon, Link as LinkIcon, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '@shared/utils/api/supabaseClient';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ViewAllQRCodesModal = ({ isOpen, onClose, restaurantId }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    if (isOpen && restaurantId) {
      loadTablesAndGenerateQR();
    } else if (isOpen && !restaurantId) {
      console.warn('ViewAllQRCodesModal: Open but no restaurantId');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, restaurantId]);

  const loadTablesAndGenerateQR = async () => {
    if (!restaurantId) {
      console.warn('Restaurant ID missing for QR codes');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all tables
      const { data: tablesData, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });

      if (error) throw error;

      setTables(tablesData || []);

      // Generate QR codes for all tables
      const codes = {};
      for (const table of tablesData || []) {
        const menuUrl = `${window.location.origin}/menu/${restaurantId}?table=${table.table_number}`;
        const qrDataUrl = await QRCode.toDataURL(menuUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        codes[table.id] = qrDataUrl;
      }
      setQrCodes(codes);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSingle = (table) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - Table ${table.table_number}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
            }
            h1 {
              font-size: 32px;
              margin-bottom: 20px;
            }
            img {
              max-width: 300px;
              height: auto;
            }
            p {
              margin-top: 20px;
              font-size: 18px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Table ${table.table_number}</h1>
            <img src="${qrCodes[table.id]}" alt="QR Code for Table ${table.table_number}" />
            <p>Scan to view menu</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    const qrCodesHtml = tables.map(table => `
      <div class="qr-item">
        <h2>Table ${table.table_number}</h2>
        <img src="${qrCodes[table.id]}" alt="QR Code for Table ${table.table_number}" />
        <p>Scan to view menu</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Table QR Codes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 40px;
            }
            .qr-item {
              text-align: center;
              page-break-inside: avoid;
              border: 2px solid #ddd;
              padding: 20px;
              border-radius: 8px;
            }
            .qr-item h2 {
              font-size: 24px;
              margin-bottom: 15px;
            }
            .qr-item img {
              max-width: 250px;
              height: auto;
            }
            .qr-item p {
              margin-top: 10px;
              font-size: 14px;
              color: #666;
            }
            @media print {
              .qr-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; margin-bottom: 30px;">Restaurant QR Codes</h1>
          <div class="qr-grid">
            ${qrCodesHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadSingle = (table) => {
    const link = document.createElement('a');
    link.href = qrCodes[table.id];
    link.download = `table-${table.table_number}-qr.png`;
    link.click();
    toast.success(`Downloaded QR code for Table ${table.table_number}`);
  };

  const handleDownloadAll = async () => {
    toast.loading('Preparing download...');
    
    // For simplicity, download individual files
    // In a production app, you'd want to create a ZIP file
    for (const table of tables) {
      const link = document.createElement('a');
      link.href = qrCodes[table.id];
      link.download = `table-${table.table_number}-qr.png`;
      link.click();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between downloads
    }
    
    toast.dismiss();
    toast.success(`Downloaded ${tables.length} QR codes`);
  };

  const handleCopyLink = (table) => {
    const menuUrl = `${window.location.origin}/menu/${restaurantId}?table=${table.table_number}`;
    navigator.clipboard.writeText(menuUrl).then(() => {
      toast.success(`Link copied for Table ${table.table_number}!`);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <QrCodeIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">All QR Codes</h2>
              <p className="text-sm text-zinc-400">
                {tables.length} table{tables.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="h-6 w-6 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12">
              <QrCodeIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Tables Found</h3>
              <p className="text-zinc-400">Set up tables to generate QR codes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="glass-panel rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all"
                >
                  {/* Table Number */}
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-white">
                      Table {table.table_number}
                    </h3>
                  </div>

                  {/* QR Code Image */}
                  {qrCodes[table.id] && (
                    <div className="bg-white p-3 rounded-lg mb-3">
                      <img
                        src={qrCodes[table.id]}
                        alt={`QR Code for Table ${table.table_number}`}
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleCopyLink(table)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 rounded-lg text-xs font-semibold text-green-400 transition-all"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Link
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handlePrintSingle(table)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs font-semibold text-white transition-all"
                      >
                        <Printer className="h-3 w-3" />
                        Print
                      </button>
                      <button
                        onClick={() => handleDownloadSingle(table)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded-lg text-xs font-semibold text-primary transition-all"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && tables.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <p className="text-sm text-zinc-400">
              {tables.length} QR code{tables.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl font-semibold text-white transition-all"
              >
                <Download className="h-4 w-4" />
                Download All
              </button>
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover rounded-xl font-semibold text-white transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print All QR Codes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAllQRCodesModal;
