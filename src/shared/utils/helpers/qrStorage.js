/**
 * QR Code Storage Management with Supabase
 * Handles uploading QR codes to Supabase Storage and updating database
 */

import QRCode from 'qrcode';
import { supabase } from '../api/supabaseClient';

/**
 * Generate QR code and upload to Supabase Storage
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} tableId - Table UUID
 * @param {number} tableNumber - Table number for URL
 * @param {object} options - QR generation options
 * @returns {Promise<{publicUrl: string, dataUrl: string}>}
 */
export const generateAndUploadQR = async (restaurantId, tableId, tableNumber, options = {}) => {
  const {
    size = 512,
    color = '#000000',
    bgColor = '#FFFFFF',
    margin = 4,
    errorCorrectionLevel = 'H', // High error correction for better scanning
  } = options;

  try {
    // Build the QR code URL that customers will scan
    const baseUrl = window.location.origin;
    const qrUrl = `${baseUrl}/table?restaurant=${restaurantId}&table=${tableId}&t=${tableNumber}`;

    // Generate QR code as data URL
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
      height: size,
    };

    const dataUrl = await QRCode.toDataURL(qrUrl, qrOptions);

    // Convert data URL to blob for upload
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Upload to Supabase Storage
    // Path format: {restaurant_id}/{table_id}.png
    const filePath = `${restaurantId}/${tableId}.png`;

    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update tables record with QR code URL
    const { error: updateError } = await supabase
      .from('tables')
      .update({ qr_code_url: publicUrl })
      .eq('id', tableId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return {
      publicUrl,
      dataUrl,
    };
  } catch (error) {
    console.error('Error in generateAndUploadQR:', error);
    throw error;
  }
};

/**
 * Delete QR code from storage and database
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} tableId - Table UUID
 * @returns {Promise<void>}
 */
export const deleteQRCode = async (restaurantId, tableId) => {
  try {
    const filePath = `${restaurantId}/${tableId}.png`;

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('qr-codes')
      .remove([filePath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // Continue even if delete fails (file might not exist)
    }

    // Update database to remove URL
    const { error: updateError } = await supabase
      .from('tables')
      .update({ qr_code_url: null })
      .eq('id', tableId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error in deleteQRCode:', error);
    throw error;
  }
};

/**
 * Generate QR codes for all tables without QR codes
 * @param {Array} tables - Array of table objects
 * @param {string} restaurantId - Restaurant UUID
 * @param {function} onProgress - Progress callback (current, total)
 * @returns {Promise<{success: number, failed: number, errors: Array}>}
 */
export const generateBulkQRCodes = async (tables, restaurantId, onProgress) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  const tablesToGenerate = tables.filter(t => !t.qr_code_url);

  for (let i = 0; i < tablesToGenerate.length; i++) {
    const table = tablesToGenerate[i];

    try {
      await generateAndUploadQR(restaurantId, table.id, table.table_number);
      results.success++;

      if (onProgress) {
        onProgress(i + 1, tablesToGenerate.length);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        tableId: table.id,
        tableNumber: table.table_number,
        error: error.message,
      });
      console.error(`Failed to generate QR for table ${table.table_number}:`, error);
    }
  }

  return results;
};

/**
 * Regenerate a single QR code (delete old and create new)
 * @param {string} restaurantId - Restaurant UUID
 * @param {string} tableId - Table UUID
 * @param {number} tableNumber - Table number
 * @returns {Promise<{publicUrl: string, dataUrl: string}>}
 */
export const regenerateQRCode = async (restaurantId, tableId, tableNumber) => {
  // Delete old QR code (if exists)
  await deleteQRCode(restaurantId, tableId);

  // Generate new one
  return await generateAndUploadQR(restaurantId, tableId, tableNumber);
};

/**
 * Download QR code as PNG file
 * @param {string} qrCodeUrl - Public URL of QR code OR data URL
 * @param {string} filename - Filename without extension
 * @returns {Promise<void>}
 */
export const downloadQRCodeFile = async (qrCodeUrl, filename = 'qr-code') => {
  try {
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};
