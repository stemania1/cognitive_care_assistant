# Refactoring Opportunities

This document outlines key refactoring opportunities to improve code maintainability, readability, and performance.

## 🔴 High Priority - Large Files

### 1. `src/app/emg/page.tsx` (3,042 lines)
**Issues:**
- 20+ useState hooks making state management complex
- Multiple responsibilities: data fetching, recording, charting, workout management
- Large constants (WORKOUT_ROUTINES, EMG_METRICS) embedded in component
- Complex data processing logic mixed with UI

**Refactoring Plan:**
- **Extract custom hooks:**
  - `useEMGRecording()` - Handle recording state and data collection
  - `useEMGDataStream()` - Handle SSE/polling data fetching
  - `useWorkoutManagement()` - Handle workout selection and timing
  - `useMoveMarkers()` - Handle move marker detection and management
  - `useEMGCalibration()` - Handle calibration logic

- **Extract components:**
  - `EMGWorkoutSelector` - Workout list and selection UI
  - `EMGRecordingControls` - Start/stop recording, move markers
  - `EMGMetricsPanel` - Metrics display modal
  - `EMGWorkoutTimer` - Workout countdown and progress

- **Extract constants:**
  - `src/constants/workouts.ts` - WORKOUT_ROUTINES
  - `src/constants/emg-metrics.ts` - EMG_METRICS

- **Extract types:**
  - `src/types/emg.ts` - EMGData, MoveMarker, WorkoutExercise, EMGMetric interfaces

- **Extract utilities:**
  - `src/utils/emg-processing.ts` - processMyoWareData, move detection logic
  - `src/utils/emg-export.ts` - CSV export functionality

### 2. `src/app/sleepbehaviors/page.tsx` (1,560 lines)
**Issues:**
- Large component with multiple responsibilities
- Chart.js registration duplicated
- Complex thermal data processing mixed with UI

**Refactoring Plan:**
- **Extract components:**
  - `ThermalSessionControls` - Start/stop session controls
  - `ThermalMetricsPanel` - Metrics display
  - `ThermalHistoryView` - History table and charts

- **Extract constants:**
  - `src/constants/thermal-metrics.ts` - THERMAL_METRICS

- **Extract utilities:**
  - `src/utils/chart-registration.ts` - Centralize Chart.js registration
  - `src/utils/thermal-processing.ts` - Thermal data calculations

### 3. `src/app/daily-questions/page.tsx` (834 lines)
**Issues:**
- 15+ useState hooks
- Complex state management for questions, answers, photos, sessions
- Mixed concerns: authentication, data persistence, UI state

**Refactoring Plan:**
- **Extract custom hooks:**
  - `useQuestionnaireState()` - Manage all questionnaire state
  - `useQuestionnairePersistence()` - Handle saving/loading answers
  - `usePhotoUpload()` - Handle photo upload logic

- **Extract components:**
  - `QuestionnaireProgress` - Progress indicator
  - `QuestionnaireCompletionModal` - Completion summary modal
  - `QuestionnaireHistoryView` - History display

### 4. `src/app/components/MyoWareClient.tsx` (645 lines)
**Issues:**
- Multiple responsibilities: device discovery, connection, calibration, data streaming
- Complex state management

**Refactoring Plan:**
- **Extract custom hooks:**
  - `useMyoWareConnection()` - Handle connection state and socket management
  - `useMyoWareDiscovery()` - Handle device discovery
  - `useMyoWareCalibration()` - Handle calibration logic

- **Extract components:**
  - `MyoWareDeviceSelector` - Device selection UI
  - `MyoWareConnectionStatus` - Connection status indicator
  - `MyoWareCalibrationPanel` - Calibration UI

## 🟡 Medium Priority - Code Duplication

### 5. User Authentication Pattern
**Issue:** Guest session handling duplicated across multiple pages

**Current Pattern:**
```typescript
useEffect(() => {
  const getUser = async () => {
    const { user, error } = await safeGetUser();
    if (error) {
      const guestSession = localStorage.getItem('cognitive_care_guest_session');
      // ... duplicate logic
    }
  };
  getUser();
}, []);
```

**Refactoring:**
- Create `useAuth()` hook in `src/hooks/useAuth.ts`
- Consolidate all auth logic including guest session handling
- Use across all pages that need user authentication

### 6. Chart.js Registration
**Issue:** Chart.js components registered in multiple files

**Refactoring:**
- Create `src/utils/chart-registration.ts`
- Export `registerChartJS()` function
- Call once in a shared location or create a ChartProvider component

### 7. Supabase Query Patterns
**Issue:** Similar query patterns repeated across files

**Refactoring:**
- Create query helper functions in `src/lib/supabase-queries.ts`
- Examples: `fetchUserSessions()`, `fetchDailyChecks()`, `fetchEMGSessions()`

## 🟢 Low Priority - Code Organization

### 8. Type Definitions
**Issue:** Interfaces defined in page/component files

**Refactoring:**
- Move all interfaces to `src/types/` directory
- Organize by domain: `emg.ts`, `thermal.ts`, `daily-questions.ts`, etc.

### 9. Constants Organization
**Issue:** Constants scattered across files

**Refactoring:**
- Consolidate to `src/constants/` directory
- Group by feature: `workouts.ts`, `metrics.ts`, `questions.ts`

### 10. Utility Functions
**Issue:** Utility functions mixed with component logic

**Refactoring:**
- Extract to `src/utils/` directory
- Group by domain: `emg-processing.ts`, `thermal-processing.ts`, `date.ts`, etc.

## 📊 State Management Improvements

### 11. Replace Multiple useState with useReducer
**Files to refactor:**
- `src/app/emg/page.tsx` - 20+ useState hooks
- `src/app/daily-questions/page.tsx` - 15+ useState hooks

**Benefits:**
- Centralized state logic
- Easier to test
- Better for complex state transitions

### 12. Create Context Providers
**Opportunities:**
- `EMGContext` - Share EMG state across components
- `ThermalContext` - Share thermal data state
- `QuestionnaireContext` - Share questionnaire state

## 🎯 Recommended Refactoring Order

1. **Phase 1: Extract Constants & Types** (Low risk, high value)
   - Move constants to `src/constants/`
   - Move types to `src/types/`
   - Update imports

2. **Phase 2: Extract Utilities** (Low risk, high value)
   - Extract data processing functions
   - Extract helper functions
   - Create shared utilities

3. **Phase 3: Create Custom Hooks** (Medium risk, high value)
   - Extract `useAuth()` hook
   - Extract domain-specific hooks (EMG, Thermal, Questionnaire)
   - Test thoroughly

4. **Phase 4: Extract Components** (Medium risk, high value)
   - Break down large components
   - Create reusable sub-components
   - Improve component composition

5. **Phase 5: State Management Refactoring** (Higher risk, high value)
   - Convert useState to useReducer where appropriate
   - Create context providers
   - Refactor state management patterns

## 🔍 Additional Opportunities

### 13. Error Handling
- Create consistent error handling patterns
- Add error boundaries for better UX
- Centralize error logging

### 14. Loading States
- Create reusable loading components
- Standardize loading state patterns
- Add skeleton loaders

### 15. API Route Organization
- Group related API routes
- Extract shared middleware
- Standardize response formats

### 16. Testing
- Add unit tests for extracted utilities
- Add integration tests for hooks
- Add component tests for UI components

## 📝 Notes

- Start with low-risk, high-value refactorings first
- Test thoroughly after each refactoring phase
- Keep commits small and focused
- Document breaking changes
- Consider creating feature branches for larger refactorings

