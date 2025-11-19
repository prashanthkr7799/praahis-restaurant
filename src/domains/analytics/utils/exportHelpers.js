/**
 * Export Helpers
 * Functions to export data to CSV, PDF, Excel formats
 */

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
    return { success: true };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, error };
  }
};

/**
 * Export data to Excel
 */
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
    return { success: true };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error };
  }
};

/**
 * Export data to PDF
 */
export const exportToPDF = (data, columns, filename = 'export.pdf', title = 'Report') => {
  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Add table
    doc.autoTable({
      head: [columns.map((col) => col.header)],
      body: data.map((row) =>
        columns.map((col) => {
          const value = col.accessor ? col.accessor(row) : row[col.field];
          return value !== undefined && value !== null ? value.toString() : '';
        })
      ),
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(filename);
    return { success: true };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error };
  }
};

/**
 * Export orders to CSV
 */
export const exportOrders = (orders, format = 'csv') => {
  const data = orders.map((order) => ({
    'Order Number': order.order_number,
    'Table': `Table ${order.table_id}`,
    'Status': order.status || order.order_status,
    'Payment Status': order.payment_status,
    'Total': `₹${order.total || order.total_amount}`,
    'Items': order.items?.length || 0,
    'Created At': new Date(order.created_at).toLocaleString(),
  }));

  if (format === 'csv') {
    return exportToCSV(data, `orders_${Date.now()}.csv`);
  } else if (format === 'excel') {
    return exportToExcel(data, `orders_${Date.now()}.xlsx`, 'Orders');
  } else if (format === 'pdf') {
    const columns = [
      { header: 'Order #', field: 'Order Number' },
      { header: 'Table', field: 'Table' },
      { header: 'Status', field: 'Status' },
      { header: 'Payment', field: 'Payment Status' },
      { header: 'Total', field: 'Total' },
      { header: 'Created At', field: 'Created At' },
    ];
    return exportToPDF(data, columns, `orders_${Date.now()}.pdf`, 'Orders Report');
  }
};

/**
 * Export menu items to CSV
 */
export const exportMenuItems = (items, format = 'csv') => {
  const data = items.map((item) => ({
    'Name': item.name,
    'Category': item.category,
    'Price': `₹${item.price}`,
    'Type': item.is_veg ? 'Vegetarian' : 'Non-Vegetarian',
    'Available': item.is_available ? 'Yes' : 'No',
    'Description': item.description,
  }));

  if (format === 'csv') {
    return exportToCSV(data, `menu_items_${Date.now()}.csv`);
  } else if (format === 'excel') {
    return exportToExcel(data, `menu_items_${Date.now()}.xlsx`, 'Menu Items');
  } else if (format === 'pdf') {
    const columns = [
      { header: 'Name', field: 'Name' },
      { header: 'Category', field: 'Category' },
      { header: 'Price', field: 'Price' },
      { header: 'Type', field: 'Type' },
      { header: 'Available', field: 'Available' },
    ];
    return exportToPDF(data, columns, `menu_items_${Date.now()}.pdf`, 'Menu Items Report');
  }
};

/**
 * Export revenue data to PDF with charts
 */
export const exportRevenueReport = (revenueData, startDate, endDate) => {
  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Revenue Report', 14, 22);

    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 32);

    // Summary stats
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const totalOrders = revenueData.reduce((sum, item) => sum + (item.order_count || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    doc.setFontSize(10);
    doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, 14, 42);
    doc.text(`Total Orders: ${totalOrders}`, 14, 48);
    doc.text(`Average Order Value: ₹${avgOrderValue.toFixed(2)}`, 14, 54);

    // Table data
    const tableData = revenueData.map((item) => [
      item.date,
      item.order_count || 0,
      `₹${(item.total_revenue || 0).toFixed(2)}`,
      `₹${(item.avg_order_value || 0).toFixed(2)}`,
    ]);

    doc.autoTable({
      head: [['Date', 'Orders', 'Revenue', 'Avg Value']],
      body: tableData,
      startY: 60,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`revenue_report_${Date.now()}.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Revenue report export error:', error);
    return { success: false, error };
  }
};

/**
 * Export staff list
 */
export const exportStaff = (staff, format = 'csv') => {
  const data = staff.map((member) => ({
    'Name': member.full_name,
    'Email': member.email,
    'Role': member.role,
    'Phone': member.phone || 'N/A',
    'Status': member.is_active ? 'Active' : 'Inactive',
    'Last Login': member.last_login ? new Date(member.last_login).toLocaleString() : 'Never',
  }));

  if (format === 'csv') {
    return exportToCSV(data, `staff_${Date.now()}.csv`);
  } else if (format === 'excel') {
    return exportToExcel(data, `staff_${Date.now()}.xlsx`, 'Staff');
  } else if (format === 'pdf') {
    const columns = [
      { header: 'Name', field: 'Name' },
      { header: 'Email', field: 'Email' },
      { header: 'Role', field: 'Role' },
      { header: 'Phone', field: 'Phone' },
      { header: 'Status', field: 'Status' },
    ];
    return exportToPDF(data, columns, `staff_${Date.now()}.pdf`, 'Staff List');
  }
};

/**
 * Export payments to CSV/Excel/PDF
 */
export const exportPayments = (payments, format = 'csv') => {
  const data = payments.map((payment) => ({
    'Transaction ID': payment.razorpay_payment_id || payment.transaction_id || 'N/A',
    'Order Number': payment.order_number || payment.order_id,
    'Amount': `₹${payment.amount}`,
    'Status': payment.status,
    'Method': payment.payment_method || 'Online',
    'Date': new Date(payment.created_at).toLocaleString(),
  }));

  if (format === 'csv') {
    return exportToCSV(data, `payments_${Date.now()}.csv`);
  } else if (format === 'excel') {
    return exportToExcel(data, `payments_${Date.now()}.xlsx`, 'Payments');
  } else if (format === 'pdf') {
    const columns = [
      { header: 'Transaction ID', field: 'Transaction ID' },
      { header: 'Order #', field: 'Order Number' },
      { header: 'Amount', field: 'Amount' },
      { header: 'Status', field: 'Status' },
      { header: 'Method', field: 'Method' },
      { header: 'Date', field: 'Date' },
    ];
    return exportToPDF(data, columns, `payments_${Date.now()}.pdf`, 'Payments Report');
  }
};
