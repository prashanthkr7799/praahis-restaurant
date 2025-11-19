import React, { useState } from 'react';
import { Download, Calendar, FileText, Database, Users, ShoppingCart, Activity } from 'lucide-react';
import Card from '@/shared/components/superadmin/Card';
import Button from '@/shared/components/superadmin/Button';
import { useToast } from '@/shared/components/superadmin/useToast';

/**
 * Professional Data Export Page - Example Implementation
 * Demonstrates the pattern for building remaining SuperAdmin pages
 */
const ProfessionalDataExportPage = () => {
  const { toast } = useToast();
  const [selectedData, setSelectedData] = useState({
    restaurants: true,
    managers: true,
    billing: false,
    payments: false,
    users: false,
    orders: false,
    logs: false,
  });

  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
    allHistorical: false,
  });

  const [exportFormat, setExportFormat] = useState('csv');
  const [advancedOptions, setAdvancedOptions] = useState({
    includeDeleted: false,
    anonymize: false,
    compress: false,
  });

  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const dataTypes = [
    { id: 'restaurants', label: 'Restaurants', count: '247 records', icon: Database },
    { id: 'managers', label: 'Managers', count: '247 records', icon: Users },
    { id: 'billing', label: 'Billing Records', count: '2,847 invoices', icon: FileText },
    { id: 'payments', label: 'Payments', count: '2,456 transactions', icon: Download },
    { id: 'users', label: 'All Users', count: '1,483 staff members', icon: Users },
    { id: 'orders', label: 'All Orders', count: '78,456 orders', icon: ShoppingCart },
    { id: 'logs', label: 'Activity Logs', count: '1.2M entries', icon: Activity },
  ];

  const formatOptions = [
    { id: 'csv', label: 'CSV', description: 'Excel-compatible, recommended', recommended: true },
    { id: 'json', label: 'JSON', description: 'Developer-friendly' },
    { id: 'excel', label: 'Excel (.xlsx)', description: 'Formatted spreadsheet' },
    { id: 'sql', label: 'SQL Dump', description: 'For backup purposes' },
  ];

  const toggleDataType = (id) => {
    setSelectedData((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateExport = async () => {
    // Validation
    const hasSelection = Object.values(selectedData).some((v) => v);
    if (!hasSelection) {
      toast.error('Please select at least one data type to export');
      return;
    }

    if (!dateRange.allHistorical && (!dateRange.from || !dateRange.to)) {
      toast.error('Please select a date range or enable "Include all historical data"');
      return;
    }

    try {
      setExporting(true);
      toast.info('Generating export... This may take a few moments');

      // Simulate export generation (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock download URL (replace with actual download URL from API)
      setDownloadUrl('https://example.com/export-2025-11-09.csv');
      setExportComplete(true);
      toast.success('Export ready! Download link valid for 24 hours');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    toast.success('Download started!');
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Data Export</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Export platform data in various formats for backup, analysis, or migration
        </p>
      </div>

      {/* Select Data */}
      <Card>
        <Card.Header>
          <Card.Title>Select Data</Card.Title>
          <Card.Description>Choose which data types to include in your export</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            {dataTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedData[type.id]}
                    onChange={() => toggleDataType(type.id)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{type.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{type.count}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Date Range */}
      <Card>
        <Card.Header>
          <Card.Title>Date Range</Card.Title>
          <Card.Description>Specify the time period for your export</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    disabled={dateRange.allHistorical}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                             disabled:opacity-50 disabled:cursor-not-allowed
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    disabled={dateRange.allHistorical}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                             disabled:opacity-50 disabled:cursor-not-allowed
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dateRange.allHistorical}
                onChange={(e) =>
                  setDateRange({ ...dateRange, allHistorical: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include all historical data
              </span>
            </label>
          </div>
        </Card.Body>
      </Card>

      {/* Export Format */}
      <Card>
        <Card.Header>
          <Card.Title>Export Format</Card.Title>
          <Card.Description>Choose your preferred file format</Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            {formatOptions.map((format) => (
              <label
                key={format.id}
                className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="format"
                  value={format.id}
                  checked={exportFormat === format.id}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {format.label}
                    </p>
                    {format.recommended && (
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {format.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Advanced Options */}
      <Card>
        <Card.Header>
          <Card.Title>Advanced Options</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedOptions.includeDeleted}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, includeDeleted: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Include deleted records
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Export soft-deleted items that are not normally visible
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedOptions.anonymize}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, anonymize: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Anonymize personal data (GDPR)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Replace sensitive information with random values
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedOptions.compress}
                onChange={(e) =>
                  setAdvancedOptions({ ...advancedOptions, compress: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Compress output (ZIP)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reduce file size for faster downloads
                </p>
              </div>
            </label>
          </div>
        </Card.Body>
      </Card>

      {/* Generate Export */}
      <Card>
        <Card.Body>
          <div className="text-center py-8">
            {!exportComplete ? (
              <>
                <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Ready to Export
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Click the button below to generate your export file
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  icon={Download}
                  onClick={handleGenerateExport}
                  loading={exporting}
                  disabled={exporting}
                >
                  {exporting ? 'Generating Export...' : 'Generate Export'}
                </Button>
                {exporting && (
                  <div className="mt-6">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Processing... This may take a few moments
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Export Ready!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Your export file is ready. Download link valid for 24 hours.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="primary" size="lg" icon={Download} onClick={handleDownload}>
                    Download File
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setExportComplete(false);
                      setDownloadUrl('');
                    }}
                  >
                    Generate New Export
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProfessionalDataExportPage;
