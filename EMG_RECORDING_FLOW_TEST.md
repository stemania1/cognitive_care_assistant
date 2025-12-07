# EMG Recording Flow Test Checklist

## Complete Flow: Record → Save → View History

### ✅ Implementation Verified

All components are in place and properly connected:

1. **Recording Functions** (`src/app/emg/page.tsx`)
   - ✅ `startRecording()` - Initializes recording session
   - ✅ `stopRecording()` - Stops recording session
   - ✅ `saveRecordingToSupabase()` - Saves to database via API
   - ✅ `exportToCSV()` - Exports data to CSV file

2. **Data Collection**
   - ✅ `recordedSessionDataRef` - Stores EMG data during recording
   - ✅ `handleMyoWareData()` - Captures data when `isRecordingSession` is true
   - ✅ Voltage calculation included in each reading

3. **API Routes** (`src/app/api/emg-sessions/route.ts`)
   - ✅ `POST /api/emg-sessions` - Saves session to Supabase
   - ✅ `GET /api/emg-sessions` - Retrieves sessions for user
   - ✅ `PATCH /api/emg-sessions` - Renames sessions
   - ✅ `DELETE /api/emg-sessions` - Deletes sessions

4. **History Page** (`src/app/emg-history/page.tsx`)
   - ✅ Loads sessions on mount
   - ✅ Displays session list with details
   - ✅ Shows voltage chart for each session
   - ✅ Supports renaming and deletion
   - ✅ CSV export functionality

5. **Navigation**
   - ✅ "View History" button on EMG page
   - ✅ Back link from history page to EMG page

### 📋 Manual Test Steps

To test the complete flow:

1. **Start Recording**
   - Navigate to `/emg` page
   - Ensure MyoWare device is connected
   - Enter a recording name (e.g., "Test Session 1")
   - Click "● Record" button
   - Verify recording starts (button changes to "■ Stop")
   - Verify data is being collected (check console for data)

2. **Stop Recording**
   - Click "■ Stop" button
   - Verify recording stops
   - Verify "Save to Cloud" and "Export CSV" buttons appear

3. **Save to Supabase**
   - Click "Save to Cloud" button
   - Verify button shows "Saving..." then "Saved ✓"
   - Check browser console for success message
   - Verify alert shows "Recording saved successfully!"

4. **View History**
   - Click "View History" button (or navigate to `/emg-history`)
   - Verify your session appears in the list
   - Verify session details are correct (name, date, duration, voltage stats)
   - Click on the session to view details
   - Verify chart displays voltage data correctly

5. **Additional Tests**
   - Test renaming a session
   - Test deleting a session
   - Test CSV export
   - Test with multiple recordings
   - Test with guest user vs authenticated user

### 🔍 Verification Points

- [ ] Recording name is saved correctly
- [ ] Session start/end times are accurate
- [ ] Duration is calculated correctly
- [ ] Voltage readings are stored in `readings` array
- [ ] Average and max voltage are calculated correctly
- [ ] Session appears in history page immediately after saving
- [ ] Chart displays all voltage data points
- [ ] User ID matches between save and load (guest vs authenticated)

### 🐛 Known Issues / Notes

- Recording requires MyoWare device to be connected
- Data is only saved when "Save to Cloud" is clicked (not auto-saved)
- History page may need refresh button click if session doesn't appear immediately

### ✅ Status

**Implementation Complete** - All code is in place and properly connected. Ready for manual testing.



