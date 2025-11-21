/**
 * Typography Validation Script for Cross-Browser Testing
 * 
 * This script validates typography properties across different pages
 * and can be used with Chrome DevTools MCP for automated testing.
 */

interface TypographyValidation {
  element: string;
  selector: string;
  expectedFontSize: string;
  expectedFontWeight: string;
  expectedMinHeight?: string;
  page: string;
}

const validations: TypographyValidation[] = [
  // Home Page
  {
    element: 'H1 (Home)',
    selector: 'h1',
    expectedFontSize: '36px',
    expectedFontWeight: '700',
    page: '/'
  },
  {
    element: 'H2 (Home)',
    selector: 'h2',
    expectedFontSize: '36px',
    expectedFontWeight: '700',
    page: '/'
  },
  {
    element: 'H3 (Home)',
    selector: 'h3',
    expectedFontSize: '20px', // mobile
    expectedFontWeight: '600',
    page: '/'
  },
  {
    element: 'Button (Home)',
    selector: 'button',
    expectedFontSize: '14px', // mobile
    expectedFontWeight: '500',
    expectedMinHeight: '44px',
    page: '/'
  },
  
  // Login Page
  {
    element: 'H1 (Login)',
    selector: 'h1',
    expectedFontSize: '24px',
    expectedFontWeight: '700',
    page: '/dashboard/login'
  },
  {
    element: 'Form Label (Login)',
    selector: 'label',
    expectedFontSize: '14px',
    expectedFontWeight: '500',
    page: '/dashboard/login'
  },
  {
    element: 'Input (Login)',
    selector: 'input[type="email"]',
    expectedFontSize: '16px',
    expectedFontWeight: '400',
    expectedMinHeight: '44px',
    page: '/dashboard/login'
  }
];

/**
 * Validation function to be run in browser context
 */
function validateTypography() {
  const results: any[] = [];
  
  // Get all headings
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  headings.forEach(tag => {
    const elements = document.querySelectorAll(tag);
    elements.forEach((el, index) => {
      const styles = window.getComputedStyle(el);
      results.push({
        element: `${tag.toUpperCase()}${index > 0 ? ` (${index})` : ''}`,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        text: el.textContent?.substring(0, 50)
      });
    });
  });
  
  // Get all buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach((el, index) => {
    const styles = window.getComputedStyle(el);
    results.push({
      element: `Button${index > 0 ? ` (${index})` : ''}`,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      minHeight: styles.minHeight,
      padding: styles.padding,
      text: el.textContent?.substring(0, 30)
    });
  });
  
  // Get all form labels
  const labels = document.querySelectorAll('label');
  labels.forEach((el, index) => {
    const styles = window.getComputedStyle(el);
    results.push({
      element: `Label${index > 0 ? ` (${index})` : ''}`,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      text: el.textContent?.substring(0, 30)
    });
  });
  
  // Get all inputs
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
  inputs.forEach((el, index) => {
    const styles = window.getComputedStyle(el);
    results.push({
      element: `Input${index > 0 ? ` (${index})` : ''}`,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      minHeight: styles.minHeight,
      type: el.getAttribute('type')
    });
  });
  
  // Get all paragraphs
  const paragraphs = document.querySelectorAll('p');
  if (paragraphs.length > 0) {
    const styles = window.getComputedStyle(paragraphs[0]);
    results.push({
      element: 'Paragraph',
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight
    });
  }
  
  return results;
}

/**
 * Check if a value matches expected (with tolerance for computed values)
 */
function valuesMatch(actual: string, expected: string): boolean {
  // Remove 'px' and compare numerically with small tolerance
  const actualNum = parseFloat(actual);
  const expectedNum = parseFloat(expected);
  
  // Allow 1px tolerance for rounding differences
  return Math.abs(actualNum - expectedNum) <= 1;
}

/**
 * Generate test report
 */
function generateReport(results: any[], viewport: string, browser: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Typography Validation Report`);
  console.log(`Browser: ${browser}`);
  console.log(`Viewport: ${viewport}`);
  console.log(`${'='.repeat(60)}\n`);
  
  results.forEach(result => {
    console.log(`${result.element}:`);
    console.log(`  Font Size: ${result.fontSize}`);
    console.log(`  Font Weight: ${result.fontWeight}`);
    if (result.lineHeight) {
      console.log(`  Line Height: ${result.lineHeight}`);
    }
    if (result.minHeight) {
      console.log(`  Min Height: ${result.minHeight}`);
    }
    if (result.text) {
      console.log(`  Text: "${result.text}"`);
    }
    console.log('');
  });
}

// Export for use in tests
export { validateTypography, validations, generateReport, valuesMatch };

// If run directly, show usage
if (require.main === module) {
  console.log('Typography Cross-Browser Validation Script');
  console.log('==========================================\n');
  console.log('This script should be used with Chrome DevTools MCP.\n');
  console.log('Usage:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Use Chrome DevTools MCP to navigate to pages');
  console.log('3. Run validateTypography() function in browser context');
  console.log('4. Compare results across browsers\n');
  console.log('Pages to test:');
  console.log('  - http://localhost:3001/');
  console.log('  - http://localhost:3001/dashboard/login');
  console.log('  - http://localhost:3001/dashboard/signup');
  console.log('  - http://localhost:3001/dashboard/account\n');
  console.log('Viewports to test:');
  console.log('  - Mobile: 375×667');
  console.log('  - Tablet: 768×1024');
  console.log('  - Desktop: 1440×900\n');
}
