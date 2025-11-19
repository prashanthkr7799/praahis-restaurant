# QR Code Schema Fixes

**Date:** November 16, 2025  
**Issue:** Schema mismatch between database and frontend components

## Problems Found

The `tables` table schema in `database/01_schema.sql` uses different column names than the QRCodesManagementPage was expecting:

### Schema Columns (Correct)
```sql
- table_number (VARCHAR, not INTEGER)
- capacity (INTEGER, not seating_capacity)
- status (VARCHAR: 'available', 'occupied', 'reserved', 'cleaning')
```

### Frontend Was Using (Incorrect)
```javascript
- table_number as INTEGER
- seating_capacity
- is_occupied (boolean)
```

## Fixes Applied

### 1. QRCodesManagementPage.jsx
**Fixed insert statement:**
```javascript
// Before:
table_number: parseInt(newTableNumber),
seating_capacity: parseInt(newTableCapacity),
is_occupied: false,

// After:
table_number: newTableNumber,  // Keep as string
capacity: parseInt(newTableCapacity),
status: 'available',
```

**Fixed filter logic:**
```javascript
// Before:
table.is_occupied

// After:
table.status === 'occupied'
table.status === 'available'
```

**Fixed stats display:**
```javascript
// Before:
tables.filter((t) => !t.is_occupied).length
tables.filter((t) => t.is_occupied).length

// After:
tables.filter((t) => t.status === 'available').length
tables.filter((t) => t.status === 'occupied').length
```

### 2. TableQRCard.jsx
**Fixed status display:**
```javascript
// Before:
table.is_occupied ? 'Occupied' : 'Available'
table.seating_capacity

// After:
table.status === 'occupied' ? 'Occupied' : 'Available'
table.capacity
```

## Testing

After these fixes, you should be able to:
- ✅ Add new tables without schema errors
- ✅ Filter tables by status (Available/Occupied)
- ✅ Display correct capacity
- ✅ Show accurate stats

## Next Steps

1. Refresh the page and try adding a table again
2. Verify the table appears in the list
3. Test filtering by Available/Occupied status
4. Try generating QR codes for the tables

All schema mismatches have been resolved!
