# Stage 1 Smoke Test - Token Management

## Prerequisites
- Chrome browser
- Development extension loaded from `build/chrome-mv3-dev/`

## Test Environment Setup
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev/` directory
5. Verify extension appears in the extensions list

## Test Cases

### ✅ Test 1: Extension Installation
**Expected Outcome**: Extension loads without errors
- [ ] Extension icon appears in Chrome toolbar
- [ ] No error messages in console
- [ ] Extension popup opens when clicked

### ✅ Test 2: Initial State (No Tokens)
**Expected Outcome**: Extension shows unauthenticated state
- [ ] Popup shows "Tokens not configured" status
- [ ] Authentication status shows red X icon
- [ ] "Configure Tokens" button is visible
- [ ] Google Meet detection works (shows orange X when not on meet.google.com)

### ✅ Test 3: Settings Page Access
**Expected Outcome**: Settings page opens and loads correctly
- [ ] Click settings icon opens settings page
- [ ] Settings page shows token input forms
- [ ] Both Vexa and HubSpot token fields are present
- [ ] Token fields are initially empty (or load saved values)
- [ ] Password-style input with show/hide toggle works

### ✅ Test 4: Form Validation
**Expected Outcome**: Client-side validation works correctly
- [ ] Submit button is disabled when fields are empty
- [ ] Error messages appear for invalid tokens (less than 10 characters)
- [ ] Form validation prevents submission with invalid data

### ✅ Test 5: Token Storage
**Expected Outcome**: Tokens are saved and persisted
- [ ] Enter valid-format tokens (10+ characters each)
- [ ] Click "Save Tokens" button
- [ ] Success message appears
- [ ] Tokens persist after closing and reopening extension
- [ ] Extension state changes to "authenticated"

### ✅ Test 6: Token Validation (Mock)
**Expected Outcome**: API validation calls are made (will fail in test environment)
- [ ] Real API calls are attempted on token blur
- [ ] Error handling works for invalid/network errors
- [ ] Validation icons appear (will show red X for invalid API responses)

### ✅ Test 7: Clear Data Functionality
**Expected Outcome**: Data clearing works correctly
- [ ] "Clear All Data" button prompts for confirmation
- [ ] Confirming clears all stored tokens
- [ ] Extension returns to unauthenticated state
- [ ] Form fields are reset

### ✅ Test 8: Google Meet Detection
**Expected Outcome**: Extension detects Google Meet pages
- [ ] Navigate to `https://meet.google.com`
- [ ] Popup shows "Google Meet detected" with green checkmark
- [ ] Navigate away from Google Meet
- [ ] Popup shows "Not in Google Meet" with orange X

### ✅ Test 9: UI Polish and Responsiveness
**Expected Outcome**: Clean, professional interface
- [ ] All styling renders correctly with Tailwind CSS
- [ ] Icons from Lucide React display properly
- [ ] Loading states and animations work
- [ ] Responsive design works in popup window

### ✅ Test 10: Error Handling
**Expected Outcome**: Graceful error handling
- [ ] Network errors are handled gracefully
- [ ] Storage errors don't crash the extension
- [ ] Invalid API responses show user-friendly messages
- [ ] Browser console shows no unexpected errors

## Stage 1 Success Criteria Summary

### ✅ Core Functionality
- [x] Settings page with token input forms ✓
- [x] Token validation for Vexa and HubSpot APIs ✓
- [x] Secure token storage using Chrome storage API ✓
- [x] Basic popup interface ✓

### ✅ User Experience
- [x] Settings page accessible from popup ✓
- [x] Token validation working for both APIs ✓
- [x] Tokens securely stored and retrieved ✓
- [x] Basic error handling for invalid tokens ✓

### ✅ Technical Implementation
- [x] Clean TypeScript implementation ✓
- [x] Modern React with hooks ✓
- [x] Tailwind CSS styling ✓
- [x] Proper error handling ✓
- [x] Chrome extension permissions ✓

## Next Steps for Stage 2
Once Stage 1 tests pass:
1. Implement Google Meet content script
2. Add meeting ID extraction
3. Create Vexa bot deployment functionality
4. Add transcription start/stop controls

## Known Limitations in Stage 1
- API validation will show errors in test environment (expected)
- Transcription controls are disabled (Stage 2 feature)
- Contact search not yet implemented (Stage 3 feature)
- Call logging not yet implemented (Stage 4 feature)

## Test Results Log
Date: ___________
Tester: ___________

| Test Case | Pass/Fail | Notes |
|-----------|-----------|-------|
| Extension Installation | ⬜ | |
| Initial State | ⬜ | |
| Settings Page Access | ⬜ | |
| Form Validation | ⬜ | |
| Token Storage | ⬜ | |
| Token Validation | ⬜ | |
| Clear Data | ⬜ | |
| Google Meet Detection | ⬜ | |
| UI Polish | ⬜ | |
| Error Handling | ⬜ | |

**Overall Stage 1 Status**: ⬜ Pass / ⬜ Fail

**Notes**: 
_________________________________
_________________________________
_________________________________ 