# Complaints Tracking System - Quick Reference

## 🚀 Quick Start

### Report a Complaint
1. Open an order in ManagerDashboard
2. Click **Issue** button (⚠️) on OrderCard
3. Select issue type(s) via checkboxes
4. Choose priority (Low/Medium/High)
5. Enter description (min 10 chars)
6. Optional: Add action taken notes
7. Click **Submit Issue Report**

### View Complaints
1. Navigate to **Staff** tab in ManagerDashboard
2. Scroll to **Complaints & Issues** section
3. Complaints grouped by priority:
   - 🔴 High Priority (Red)
   - 🟠 Medium Priority (Amber)
   - 🔵 Low Priority (Blue)

### Update Complaint
1. Click on any complaint card
2. ComplaintDetailsModal opens
3. Update status: Open → In Progress → Resolved → Closed
4. Add/edit action taken notes
5. Click **Update Complaint**

---

## 📊 Dashboard Stats

### Complaints Stat Card (Overview Tab)
- **Location**: Top stats grid, 5th card
- **Shows**: Today's complaint count
- **Color**: Red (text-red-400)
- **Click Action**: Navigate to Staff tab → Complaints section

---

## 🔍 Filtering Complaints

### Search
- Searches: Description, issue types, order number, table number
- Real-time filtering as you type

### Status Filter
- **All**: Show all complaints
- **Open**: Newly reported issues
- **In Progress**: Being addressed
- **Resolved**: Issue fixed
- **Closed**: Archived complaints

### Date Range Filter
- **Today**: Today's complaints only
- **Last 7 Days**: Past week
- **Last 30 Days**: Past month
- **All Time**: All complaints

---

## 📝 Issue Types (Checkboxes)

- **Food Quality** 👎 - Quality/taste issues
- **Wrong Item** 🍽️ - Incorrect dish served
- **Wait Time** ⏰ - Service delays
- **Service** 🙋 - Staff service issues
- **Other** 📝 - Miscellaneous issues

*Multiple selections allowed*

---

## 🎯 Priority Levels

### High Priority 🔴
- **Color**: Red
- **Use**: Urgent issues requiring immediate attention
- **Examples**: Food safety, serious service failures

### Medium Priority 🟠
- **Color**: Amber
- **Use**: Issues needing attention soon
- **Examples**: Wrong item, quality complaints

### Low Priority 🔵
- **Color**: Blue
- **Use**: Minor issues, no rush
- **Examples**: Minor delays, small inconveniences

---

## 🔄 Status Lifecycle

```
Open → In Progress → Resolved → Closed
  ↓         ↓           ↓
Reported  Working   Fixed/Done  Archived
```

### Status Meanings
- **Open**: Newly reported, awaiting action
- **In Progress**: Staff actively addressing
- **Resolved**: Issue fixed, action documented
- **Closed**: Completed and archived

---

## 💾 Database Schema Quick Ref

### Table: `complaints`
```sql
complaints (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  order_id UUID REFERENCES orders,
  table_id UUID REFERENCES tables,
  table_number VARCHAR(10),
  issue_types TEXT[] NOT NULL,      -- Multiple selections
  description TEXT NOT NULL,         -- Min 10 chars
  priority TEXT DEFAULT 'medium',    -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'open',        -- 'open', 'in_progress', 'resolved', 'closed'
  action_taken TEXT,                 -- Optional notes
  reported_by UUID,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,          -- Auto-set when resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Indexes
- `restaurant_id` (fast filtering)
- `order_id` (join optimization)
- `status` (status filtering)
- `priority` (priority filtering)
- `created_at DESC` (recent first)

---

## 🛠️ API Functions

### `createComplaint(data)`
**Create new complaint**
```javascript
await createComplaint({
  orderId: 'uuid',
  issueTypes: ['food_quality', 'wait_time'],
  description: 'Description',
  priority: 'high',
  actionTaken: 'Optional action notes'
});
```

### `updateComplaint(id, updates)`
**Update existing complaint**
```javascript
await updateComplaint(complaintId, {
  status: 'resolved',
  action_taken: 'Action notes'
});
```

### `getComplaints(restaurantId, filters)`
**Fetch complaints with filters**
```javascript
const complaints = await getComplaints(restaurantId, {
  status: 'open',
  priority: 'high',
  startDate: today.toISOString()
});
```

---

## 🎨 Color Coding Reference

### Priority Colors
| Priority | Background | Border | Text | Badge |
|----------|-----------|--------|------|-------|
| High     | bg-red-50 | border-red-300 | text-red-900 | bg-red-500 |
| Medium   | bg-amber-50 | border-amber-300 | text-amber-900 | bg-amber-500 |
| Low      | bg-blue-50 | border-blue-300 | text-blue-900 | bg-blue-500 |

### Status Colors
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Open | bg-amber-100 | text-amber-800 | border-amber-300 |
| In Progress | bg-blue-100 | text-blue-800 | border-blue-300 |
| Resolved | bg-green-100 | text-green-800 | border-green-300 |
| Closed | bg-gray-100 | text-gray-800 | border-gray-300 |

---

## 📁 File Locations

### Components
- **IssueReportModal**: `src/domains/ordering/components/modals/IssueReportModal.jsx`
- **ComplaintsPanel**: `src/domains/complaints/components/ComplaintsPanel.jsx`
- **ComplaintDetailsModal**: `src/domains/complaints/components/modals/ComplaintDetailsModal.jsx`

### Service Layer
- **API Functions**: `src/shared/utils/api/supabaseClient.js`

### Database
- **Schema**: `phase3_migrations/01_core_schema.sql` (lines 114-130, 238, 240-245)

### Dashboard Integration
- **ManagerDashboard**: `src/pages/manager/ManagerDashboard.jsx`

---

## ✅ Validation Rules

### Issue Report Modal
- ✅ At least 1 issue type required
- ✅ Description min 10 chars (max 500)
- ✅ Priority required (defaults to medium)
- ✅ Action taken optional (max 300)

### Database Constraints
- ✅ `issue_types` must be array
- ✅ `description` NOT NULL
- ✅ `priority` IN ('low', 'medium', 'high')
- ✅ `status` IN ('open', 'in_progress', 'resolved', 'closed')

---

## 🧪 Testing Quick Guide

### Test Issue Creation
1. Open any order in ManagerDashboard
2. Click Issue button
3. Try submitting empty (should error)
4. Select 2+ issue types
5. Set priority to High
6. Enter description
7. Submit → Check toast success

### Test Filtering
1. Go to Staff tab
2. Create 3 complaints (different priorities)
3. Test search: Enter order number
4. Test status filter: Select "Open"
5. Test date filter: Select "Today"
6. Verify only matching complaints show

### Test Update
1. Click any complaint card
2. Change status to "In Progress"
3. Add action taken notes
4. Update → Check toast success
5. Verify status changed in panel

---

## 🚨 Common Issues & Solutions

### Complaint Not Appearing
- ✅ Check filter settings (status/date range)
- ✅ Verify restaurant_id matches
- ✅ Refresh panel with Refresh button

### Can't Update Complaint
- ✅ Must change status or action_taken to enable Update button
- ✅ Check network connection
- ✅ Verify complaint exists in database

### Search Not Working
- ✅ Clear filters and try again
- ✅ Search is case-insensitive
- ✅ Try partial matches

---

## 📞 Integration Points

### OrderCard Component
- Issue button (⚠️) opens IssueReportModal
- Callback: `onIssue={(orderId, data) => handleIssue(orderId, data)}`

### ManagerDashboard
- **Overview Tab**: Complaints stat card
- **Staff Tab**: ComplaintsPanel component
- `handleIssue()` calls `createComplaint()`

### Stats Calculation
- Query runs on dashboard load
- Counts today's complaints
- Updates when new complaint created

---

## 🔧 Configuration

### Change Issue Types
Edit `IssueReportModal.jsx`:
```javascript
const issueTypeOptions = [
  { value: 'food_quality', label: 'Food Quality', icon: '👎' },
  // Add new types here
];
```

### Modify Priority Levels
Update in 3 places:
1. Database CHECK: `phase3_migrations/01_core_schema.sql`
2. IssueReportModal: `issueTypeOptions` array
3. ComplaintDetailsModal: `statusOptions` array

---

## 📊 Performance Tips

1. **Use Date Filters**: Narrow results to recent period
2. **Status Filter**: Filter by "Open" for active issues only
3. **Search**: Use specific keywords (order #, table #)
4. **Pagination**: (Not yet implemented, all complaints load at once)

---

## 🎓 Best Practices

### For Staff
1. **Always select accurate issue types** - Helps with analytics
2. **Set appropriate priority** - Ensures proper urgency
3. **Write clear descriptions** - Include what, when, where
4. **Document action taken** - Accountability and learning
5. **Update status promptly** - Keep tracking accurate

### For Managers
1. **Review high-priority daily** - Address urgent issues fast
2. **Monitor trends** - Look for recurring issues
3. **Follow up on resolved** - Ensure customer satisfaction
4. **Close old complaints** - Keep panel clean
5. **Use filters effectively** - Focus on what matters

---

## 📈 Analytics Potential

*Future enhancements could include:*
- Most common issue types per period
- Average time to resolution by priority
- Complaint volume trends over time
- Issue types by order type (dine-in vs takeaway)
- Staff performance (resolution rates)

---

**Last Updated**: 21 November 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
