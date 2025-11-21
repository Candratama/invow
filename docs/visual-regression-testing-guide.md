# Visual Regression Testing Guide

## Overview

This guide explains how to use the visual regression testing system to detect unintended typography changes and maintain consistency across the application.

## Baseline Report

The baseline report (`visual-regression-report.md`) was generated on **2025-11-21** after completing the typography system migration. This serves as the reference point for all future comparisons.

### Baseline Summary

- **Total Files Analyzed**: 24
- **Typography Usages**: 281
- **Issues Found**: 0
- **Status**: ✅ All typography uses the approved system

## Running Visual Regression Tests

### Automated Testing

Run the visual regression test script:

```bash
npx tsx scripts/visual-regression-test.ts
```

This will:
1. Analyze all page and component files
2. Extract typography class usage
3. Detect hardcoded font sizes
4. Generate a new report
5. Compare against the baseline

### What Gets Checked

The script validates:

1. **No Hardcoded Font Sizes**
   - Detects `fontSize: "14px"` or similar inline styles
   - Detects arbitrary Tailwind values like `text-[14px]`
   - Ensures all sizing uses approved classes

2. **Typography Class Usage**
   - Tracks which typography classes are used where
   - Identifies patterns and frequency
   - Helps spot inconsistencies

3. **System Compliance**
   - Verifies only approved classes are used
   - Checks for deprecated patterns
   - Ensures responsive sizing is applied

## Interpreting Results

### Clean Report (No Issues)

```
✅ No hardcoded font sizes detected! All typography uses the approved system.
```

This means:
- All typography follows the design system
- No regressions detected
- Safe to proceed

### Issues Detected

```
⚠️ Found 3 issue(s). Check the report for details.
```

Review the report to see:
- Which files have issues
- Line numbers with problems
- Context of the problematic code

Example issue:

```
Line 42: Hardcoded font size detected - fontSize: "14px"
```

## Intentional Changes Documentation

When making intentional typography changes:

1. **Update the Design Document**
   - Document the change in `.kiro/specs/typography-system/design.md`
   - Explain the rationale
   - Update the type scale if needed

2. **Update the Baseline**
   - Run the visual regression test
   - Review the new report
   - If changes are intentional, update the baseline:
     ```bash
     cp docs/visual-regression-report.md docs/visual-regression-baseline.md
     ```

3. **Document in the Report**
   - Add the change to the "Intentional Changes" section
   - Include date and reason
   - Reference the requirement or design decision

## Common Scenarios

### Scenario 1: Adding a New Component

When creating a new component:

1. Use typography utilities from `lib/utils/typography.ts`
2. Follow the component typography mapping in the design doc
3. Run visual regression test to verify compliance
4. Check that no hardcoded sizes were introduced

### Scenario 2: Fixing a Bug

If a bug fix requires typography changes:

1. Identify the root cause
2. Check if it's a design system issue or implementation bug
3. Fix using approved classes
4. Run visual regression test
5. Document if it's an intentional change to the system

### Scenario 3: Responsive Adjustments

When adjusting responsive typography:

1. Follow the responsive strategy (1.125-1.25× scaling)
2. Use `lg:` and `md:` prefixes consistently
3. Test at all breakpoints
4. Run visual regression test
5. Verify smooth transitions

## Integration with CI/CD

### Recommended Workflow

1. **Pre-commit Hook**
   ```bash
   # Run visual regression test before commit
   npx tsx scripts/visual-regression-test.ts
   ```

2. **Pull Request Checks**
   - Run visual regression test in CI
   - Fail if hardcoded sizes detected
   - Require manual review for typography changes

3. **Periodic Audits**
   - Run full visual regression test weekly
   - Review typography usage patterns
   - Identify opportunities for consolidation

## Troubleshooting

### False Positives

If the script detects a false positive:

1. Check if it's a legitimate edge case
2. Update the script's forbidden patterns if needed
3. Document the exception in the design doc

### Missing Issues

If visual issues aren't caught:

1. The script only checks code patterns, not visual output
2. Supplement with manual testing
3. Use browser DevTools to inspect computed styles
4. Consider adding screenshot comparison tools

## Manual Testing Checklist

Automated tests don't catch everything. Also perform:

- [ ] Visual inspection on real devices
- [ ] Screenshot comparison at key breakpoints
- [ ] Accessibility testing with screen readers
- [ ] Contrast ratio verification
- [ ] Touch target size validation
- [ ] Zoom testing (up to 200%)

## Maintenance

### Updating the Script

The script is located at `scripts/visual-regression-test.ts`. Update it when:

- Adding new files to analyze
- Changing approved typography classes
- Adding new validation rules
- Improving detection patterns

### Keeping Documentation Current

Update this guide when:

- Changing the testing workflow
- Adding new scenarios
- Discovering new patterns
- Updating the baseline

## Related Documentation

- [Typography System Design](../.kiro/specs/typography-system/design.md)
- [Typography Utilities](../lib/utils/typography.ts)
- [Typography Documentation](./typography.md)
- [Accessibility Compliance](./accessibility-compliance.md)
- [Responsive Typography Test Results](./responsive-typography-test-results.md)

## Questions?

If you encounter issues or have questions about visual regression testing:

1. Review the design document for typography guidelines
2. Check the baseline report for reference
3. Run the script with verbose output
4. Consult the team for design decisions
