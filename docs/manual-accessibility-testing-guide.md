# Manual Accessibility Testing Guide

This guide provides step-by-step instructions for manual accessibility testing of the typography system.

## Prerequisites

- macOS with VoiceOver (built-in) OR Windows with NVDA (free download)
- Modern web browser (Chrome, Safari, or Firefox)
- Test device or browser responsive mode

## Test 1: Screen Reader Testing (Requirement 6.1)

### macOS VoiceOver

1. **Enable VoiceOver**
   ```
   Press: Cmd + F5
   ```

2. **Navigate to the application**
   - Open browser and go to localhost:3000
   - VoiceOver will announce page elements

3. **Test Heading Navigation**
   ```
   Press: VO + Cmd + H (next heading)
   Press: VO + Cmd + Shift + H (previous heading)
   ```
   
   **Expected Results:**
   - Dashboard page should announce: "Heading level 1: Welcome back"
   - Should be able to navigate through h1 → h2 → h3 hierarchy
   - No heading levels should be skipped

4. **Test Rotor Navigation**
   ```
   Press: VO + U (open rotor)
   Use arrow keys to navigate headings list
   ```
   
   **Expected Results:**
   - All headings should be listed in order
   - Heading levels should be correct (h1, h2, h3, etc.)

5. **Test Form Labels**
   - Navigate to login page or invoice form
   - Tab through form fields
   
   **Expected Results:**
   - Each input should announce its label
   - Error messages should be announced
   - Helper text should be associated with inputs

### Windows NVDA

1. **Install and Enable NVDA**
   - Download from https://www.nvaccess.org/download/
   - Install and launch NVDA

2. **Navigate to the application**
   - Open browser and go to localhost:3000

3. **Test Heading Navigation**
   ```
   Press: H (next heading)
   Press: Shift + H (previous heading)
   Press: 1-6 (jump to specific heading level)
   ```
   
   **Expected Results:**
   - Same as VoiceOver testing above

4. **Test Elements List**
   ```
   Press: Insert + F7 (elements list)
   Select "Headings" from tree view
   ```
   
   **Expected Results:**
   - All headings listed with correct levels
   - No skipped levels in hierarchy

### Test Checklist

- [ ] Dashboard page has proper h1
- [ ] Account settings page has proper h1
- [ ] Login/signup pages have proper h1
- [ ] Heading hierarchy doesn't skip levels
- [ ] Form labels are announced correctly
- [ ] Error messages are announced
- [ ] Button text is clear and descriptive

## Test 2: Zoom Testing (Requirement 6.3)

### Browser Zoom Test

1. **Test at 150% Zoom**
   ```
   Press: Cmd/Ctrl + Plus (3 times)
   Or: Cmd/Ctrl + 0, then Cmd/Ctrl + Plus
   ```
   
   **Check:**
   - [ ] All text remains readable
   - [ ] No horizontal scrolling required
   - [ ] Buttons remain clickable
   - [ ] Layout doesn't break
   - [ ] Navigation remains usable

2. **Test at 200% Zoom**
   ```
   Press: Cmd/Ctrl + Plus (until 200%)
   ```
   
   **Check:**
   - [ ] All text remains readable
   - [ ] No horizontal scrolling on main content
   - [ ] Buttons remain clickable
   - [ ] Touch targets remain adequate
   - [ ] Forms remain usable

3. **Test Key Pages**
   - [ ] Dashboard (main page)
   - [ ] Invoice form
   - [ ] Account settings
   - [ ] Login/signup pages
   - [ ] Landing page

4. **Reset Zoom**
   ```
   Press: Cmd/Ctrl + 0
   ```

### Mobile Zoom Test

1. **Test on Mobile Device**
   - Open app on actual mobile device
   - Use pinch-to-zoom gesture
   
   **Check:**
   - [ ] Text scales appropriately
   - [ ] Layout remains usable
   - [ ] Buttons remain tappable

## Test 3: Contrast Testing (Requirement 6.2)

### Using Browser DevTools

1. **Open DevTools**
   ```
   Press: F12 or Cmd/Ctrl + Shift + I
   ```

2. **Inspect Text Elements**
   - Right-click on text → Inspect
   - Look for contrast ratio in Styles panel
   
   **Check these elements:**
   - [ ] Body text (text-base, text-gray-900)
   - [ ] Secondary text (text-sm, text-gray-600)
   - [ ] Metadata (text-xs, text-gray-500)
   - [ ] Button text (text-white on bg-primary)
   - [ ] Error messages (text-red-600)

3. **Verify Ratios**
   - Normal text (< 18px): Must be ≥ 4.5:1
   - Large text (≥ 18px): Must be ≥ 3:1

### Using Online Tools

1. **WebAIM Contrast Checker**
   - Go to https://webaim.org/resources/contrastchecker/
   - Enter foreground and background colors
   - Verify WCAG AA compliance

2. **Common Color Combinations to Test**
   ```
   Foreground: #111827 (text-gray-900)
   Background: #FFFFFF (bg-white)
   Expected: Pass AA (should be ~16:1)

   Foreground: #4B5563 (text-gray-600)
   Background: #FFFFFF (bg-white)
   Expected: Pass AA (should be ~7:1)

   Foreground: #6B7280 (text-gray-500)
   Background: #FFFFFF (bg-white)
   Expected: Pass AA (should be ~4.6:1)
   ```

### Test Checklist

- [ ] All body text meets 4.5:1 ratio
- [ ] All large text meets 3:1 ratio
- [ ] Button text is readable
- [ ] Error messages are readable
- [ ] Links are distinguishable

## Test 4: High Contrast Mode

### macOS High Contrast

1. **Enable Increase Contrast**
   ```
   System Preferences → Accessibility → Display
   Check "Increase contrast"
   ```

2. **Test Application**
   - Navigate through all pages
   - Verify all text is visible
   - Check borders and separators are visible

### Windows High Contrast

1. **Enable High Contrast**
   ```
   Settings → Ease of Access → High contrast
   Turn on "High contrast"
   ```

2. **Test Application**
   - Same checks as macOS

### Test Checklist

- [ ] All text remains visible
- [ ] Borders and separators are visible
- [ ] Focus indicators are visible
- [ ] Buttons are distinguishable
- [ ] Form fields are visible

## Test 5: Keyboard Navigation

### Navigation Test

1. **Tab Through Page**
   ```
   Press: Tab (move forward)
   Press: Shift + Tab (move backward)
   ```
   
   **Check:**
   - [ ] All interactive elements are reachable
   - [ ] Tab order is logical
   - [ ] Focus indicator is visible
   - [ ] No keyboard traps

2. **Test Specific Interactions**
   ```
   Press: Enter (activate buttons/links)
   Press: Space (activate buttons)
   Press: Esc (close modals/dialogs)
   Press: Arrow keys (navigate menus)
   ```

3. **Test Forms**
   - Tab through all form fields
   - Verify labels are associated
   - Check error messages appear
   - Verify submit works with Enter

### Test Checklist

- [ ] Can navigate entire page with keyboard
- [ ] Focus indicator is always visible
- [ ] Tab order is logical
- [ ] Can activate all buttons
- [ ] Can submit forms
- [ ] Can close modals with Esc

## Test 6: Touch Target Testing (Requirement 4.5)

### Mobile Device Test

1. **Test on Actual Device**
   - Use iPhone or Android device
   - Navigate to the application

2. **Test Interactive Elements**
   - [ ] All buttons are easily tappable
   - [ ] Links in text are tappable
   - [ ] Form inputs are tappable
   - [ ] Tab navigation is tappable
   - [ ] Close buttons are tappable

3. **Measure Touch Targets**
   - Minimum size should be 44×44px
   - Use browser DevTools device mode to verify

### Test Checklist

- [ ] All buttons meet 44×44px minimum
- [ ] Links have adequate padding
- [ ] Form inputs are easy to tap
- [ ] No accidental taps on nearby elements

## Recording Results

### Create Test Report

For each test, record:

1. **Test Name:** (e.g., "VoiceOver Heading Navigation")
2. **Date:** 
3. **Tester:**
4. **Result:** Pass/Fail
5. **Notes:** Any issues found
6. **Screenshots:** If applicable

### Example Report Entry

```markdown
## Test: VoiceOver Heading Navigation
- **Date:** 2025-11-21
- **Tester:** John Doe
- **Browser:** Safari 17.0
- **Result:** ✅ PASS
- **Notes:** All headings announced correctly. Hierarchy is proper on all tested pages.
```

## Common Issues and Solutions

### Issue: Heading hierarchy skipped
**Solution:** Check that pages have h1, and sub-components use appropriate levels

### Issue: Text too small at 200% zoom
**Solution:** Verify using rem units, not px

### Issue: Low contrast ratio
**Solution:** Use darker text colors or lighter backgrounds

### Issue: Focus indicator not visible
**Solution:** Add focus styles to interactive elements

### Issue: Touch targets too small
**Solution:** Increase padding on buttons and links

## Next Steps

After completing manual testing:

1. Document all findings in `docs/accessibility-compliance.md`
2. Create issues for any failures
3. Retest after fixes
4. Update this guide with any new findings

## Resources

- [VoiceOver Commands](https://support.apple.com/guide/voiceover/welcome/mac)
- [NVDA Commands](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/resources/)
