/**
 * QR Code Generation and Management Utilities
 * Handles QR code generation, customization, and bulk operations
 */

import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getQrTableLink } from './linkHelpers';

/**
 * Generate QR code with custom options
 * @param {object|string} tableOrUrl - Table object with table_number OR a full URL string OR legacy table id
 * @param {string} [restaurantSlug] - Restaurant slug for URL generation (required when passing table object)
 * @param {object} options - Customization options
 * @returns {Promise<string>} Data URL of QR code
 */
export const generateQR = async (tableOrUrl, options = {}, restaurantSlug) => {
  const {
    size = 300,
    color = '#000000',
    bgColor = '#FFFFFF',
    margin = 4,
    errorCorrectionLevel = 'M',
    logo = null,
  } = options;

  try {
    let qrUrl = '';
    // If string and looks like a full URL, use as-is
    if (typeof tableOrUrl === 'string' && /^https?:\/\//i.test(tableOrUrl)) {
      qrUrl = tableOrUrl;
    } else if (typeof tableOrUrl === 'object' && tableOrUrl?.table_number) {
      // Table object provided; require slug
      qrUrl = getQrTableLink(restaurantSlug, tableOrUrl.table_number);
    } else if (typeof tableOrUrl === 'string') {
      // Legacy path: treat as id
      const baseUrl = window.location.origin;
      qrUrl = `${baseUrl}/table/${tableOrUrl}`;
    } else {
      throw new Error('Invalid argument to generateQR');
    }

    const qrOptions = {
      errorCorrectionLevel,
      type: 'image/png',
      quality: 1,
      margin,
      color: {
        dark: color,
        light: bgColor,
      },
      width: size,
    };

    const dataUrl = await QRCode.toDataURL(qrUrl, qrOptions);

    // If logo is provided, overlay it on the QR code
    if (logo) {
      return await addLogoToQR(dataUrl, logo, size);
    }

    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Add logo overlay to QR code
 * @param {string} qrDataUrl - QR code data URL
 * @param {string} logoDataUrl - Logo data URL
 * @param {number} size - QR code size
 * @returns {Promise<string>} QR code with logo
 */
const addLogoToQR = (qrDataUrl, logoDataUrl, size) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    const qrImage = new Image();
    const logoImage = new Image();

    qrImage.onload = () => {
      ctx.drawImage(qrImage, 0, 0, size, size);

      logoImage.onload = () => {
        const logoSize = size * 0.2; // Logo is 20% of QR size
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // Draw white background for logo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

        // Draw logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

        resolve(canvas.toDataURL('image/png'));
      };

      logoImage.onerror = () => {
        // If logo fails to load, return QR without logo
        resolve(qrDataUrl);
      };

      logoImage.src = logoDataUrl;
    };

    qrImage.onerror = () => reject(new Error('Failed to load QR code'));
    qrImage.src = qrDataUrl;
  });
};

/**
 * Download single QR code
 * @param {string} qrDataUrl - QR code data URL
 * @param {string} filename - File name
 */
export const downloadQR = (qrDataUrl, filename = 'qr-code') => {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = qrDataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download all QR codes as ZIP
 * @param {Array} tables - Array of table objects with QR codes
 * @param {string} zipName - Name of ZIP file
 * @returns {Promise<void>}
 */
export const downloadAllAsZip = async (tables, zipName = 'qr-codes', restaurantSlug) => {
  try {
    const zip = new JSZip();
    const qrFolder = zip.folder('qr-codes');

    // Generate info text file
    let infoText = 'Restaurant QR Codes\n';
    infoText += '===================\n\n';
    infoText += `Generated on: ${new Date().toLocaleString()}\n`;
  infoText += `Total tables: ${tables.length}\n\n`;
    infoText += 'Table Information:\n';
    infoText += '-----------------\n\n';

    // Add each QR code to ZIP
    for (const table of tables) {
      try {
        const qrDataUrl = await generateQR(table, {
          size: 500,
          margin: 2,
        }, restaurantSlug);

        // Convert data URL to blob
        const base64Data = qrDataUrl.split(',')[1];
        qrFolder.file(`Table-${table.table_number}.png`, base64Data, { base64: true });

        // Add table info to text file
        infoText += `Table ${table.table_number}:\n`;
        infoText += `  - ID: ${table.id}\n`;
        infoText += `  - Seating: ${table.seating_capacity || 4} people\n`;
        infoText += `  - QR URL: ${getQrTableLink(restaurantSlug, table.table_number)}\n\n`;
      } catch (error) {
        console.error(`Error generating QR for table ${table.table_number}:`, error);
      }
    }

    // Add info file to ZIP
    zip.file('README.txt', infoText);

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${zipName}-${Date.now()}.zip`);

    return { success: true, count: tables.length };
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw error;
  }
};

/**
 * Generate print-friendly HTML for QR codes
 * @param {Array} tables - Array of table objects
 * @param {object} options - Print options
 * @returns {Promise<string>} HTML content
 */
export const generatePrintHTML = async (tables, options = {}, restaurantSlug) => {
  const {
    gridCols = 3,
    showTableNumber = true,
    showURL = true,
    pageSize = 'A4',
  } = options;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Restaurant QR Codes</title>
      <style>
        @page {
          size: ${pageSize};
          margin: 20mm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(${gridCols}, 1fr);
          gap: 20px;
          padding: 20px;
        }
        .qr-card {
          border: 2px solid #333;
          padding: 15px;
          text-align: center;
          page-break-inside: avoid;
          border-radius: 8px;
        }
        .qr-card h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
        }
        .qr-card img {
          width: 100%;
          max-width: 200px;
          height: auto;
          margin: 10px 0;
        }
        .qr-card p {
          margin: 5px 0;
          font-size: 10px;
          color: #666;
          word-break: break-all;
        }
        .header {
          text-align: center;
          padding: 20px;
          border-bottom: 2px solid #333;
          margin-bottom: 20px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Restaurant QR Codes</h1>
        <p>Scan to order from your table</p>
        <button class="no-print" onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
          Print QR Codes
        </button>
      </div>
      <div class="grid">
  `;

  for (const table of tables) {
    const qrDataUrl = await generateQR(table, { size: 400 }, restaurantSlug);
    const qrUrl = getQrTableLink(restaurantSlug, table.table_number);

    html += `
      <div class="qr-card">
        ${showTableNumber ? `<h2>Table ${table.table_number}</h2>` : ''}
        <img src="${qrDataUrl}" alt="QR Code for Table ${table.table_number}" />
        ${showURL ? `<p>${qrUrl}</p>` : ''}
        <p>Seating: ${table.seating_capacity || 4} people</p>
      </div>
    `;
  }

  html += `
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Open print preview with QR codes
 * @param {Array} tables - Array of table objects
 * @param {object} options - Print options
 */
export const printQRCodes = async (tables, options = {}, restaurantSlug) => {
  try {
    const html = await generatePrintHTML(tables, options, restaurantSlug);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Error opening print preview:', error);
    throw error;
  }
};

/**
 * Format table data for export
 * @param {Array} tables - Array of table objects
 * @returns {Array} Formatted data
 */
export const formatDataForExport = (tables, restaurantSlug) => {
  return tables.map((table) => ({
    'Table Number': table.table_number,
    'Table ID': table.id,
    'Seating Capacity': table.seating_capacity || 4,
    'Status': table.is_occupied ? 'Occupied' : 'Available',
    'QR Code URL': getQrTableLink(restaurantSlug, table.table_number),
    'Created At': new Date(table.created_at).toLocaleString(),
  }));
};

export default {
  generateQR,
  downloadQR,
  downloadAllAsZip,
  generatePrintHTML,
  printQRCodes,
  formatDataForExport,
};
