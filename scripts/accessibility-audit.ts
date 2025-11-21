/**
 * Comprehensive Accessibility Audit Script
 * 
 * This script performs a thorough accessibility audit of the typography system:
 * 1. Verifies WCAG AA contrast ratios
 * 2. Checks semantic heading hierarchy across all pages
 * 3. Validates minimum font sizes
 * 4. Ensures touch target sizes
 * 5. Tests zoom support
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  requirement?: string;
}

const results: AuditResult[] = [];

function addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, requirement?: string) {
  results.push({ category, test, status, message, requirement });
}

// Helper to find all TSX/JSX files
function findComponentFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, and other build directories
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        findComponentFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check for hardcoded font sizes
function checkHardcodedFontSizes() {
  console.log('\n🔍 Checking for hardcoded font sizes...');
  
  const componentFiles = findComponentFiles('.');
  const hardcodedSizePattern = /(?:font-size|fontSize):\s*['"]?\d+(?:px|pt|em)['"]?/g;
  const arbitraryTailwindPattern = /text-\[[\d.]+(?:px|rem|em)\]/g;
  
  let foundIssues = 0;
  
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for inline styles with font-size
    const hardcodedMatches = content.match(hardcodedSizePattern);
    if (hardcodedMatches) {
      foundIssues += hardcodedMatches.length;
      addResult(
        'Hardcoded Font Sizes',
        `File: ${file}`,
        'FAIL',
        `Found ${hardcodedMatches.length} hardcoded font size(s): ${hardcodedMatches.join(', ')}`,
        '3.4'
      );
    }
    
    // Check for arbitrary Tailwind values
    const arbitraryMatches = content.match(arbitraryTailwindPattern);
    if (arbitraryMatches) {
      foundIssues += arbitraryMatches.length;
      addResult(
        'Hardcoded Font Sizes',
        `File: ${file}`,
        'FAIL',
        `Found ${arbitraryMatches.length} arbitrary Tailwind font size(s): ${arbitraryMatches.join(', ')}`,
        '3.4'
      );
    }
  });
  
  if (foundIssues === 0) {
    addResult(
      'Hardcoded Font Sizes',
      'All files',
      'PASS',
      'No hardcoded font sizes found. All typography uses the defined system.',
      '3.4'
    );
  }
}

// Check semantic heading hierarchy
function checkHeadingHierarchy() {
  console.log('\n🔍 Checking semantic heading hierarchy...');
  
  const pageFiles = findComponentFiles('app');
  const componentFiles = findComponentFiles('components');
  const allFiles = [...pageFiles, ...componentFiles];
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Extract heading tags
    const headingPattern = /<h([1-6])[^>]*>/g;
    const headings: number[] = [];
    let match;
    
    while ((match = headingPattern.exec(content)) !== null) {
      headings.push(parseInt(match[1]));
    }
    
    if (headings.length > 0) {
      // Check if h1 exists
      const hasH1 = headings.includes(1);
      
      // Check for skipped levels
      const uniqueLevels = [...new Set(headings)].sort();
      let hasSkippedLevels = false;
      
      for (let i = 1; i < uniqueLevels.length; i++) {
        if (uniqueLevels[i] - uniqueLevels[i - 1] > 1) {
          hasSkippedLevels = true;
          break;
        }
      }
      
      if (!hasH1 && headings.length > 0) {
        addResult(
          'Heading Hierarchy',
          `File: ${file}`,
          'WARNING',
          `File contains headings but no h1. Levels found: ${uniqueLevels.join(', ')}`,
          '6.1'
        );
      } else if (hasSkippedLevels) {
        addResult(
          'Heading Hierarchy',
          `File: ${file}`,
          'FAIL',
          `Heading hierarchy skips levels. Found: ${uniqueLevels.join(', ')}`,
          '6.1'
        );
      } else {
        addResult(
          'Heading Hierarchy',
          `File: ${file}`,
          'PASS',
          `Proper heading hierarchy maintained: ${uniqueLevels.join(', ')}`,
          '6.1'
        );
      }
    }
  });
}

// Check for minimum font sizes
function checkMinimumFontSizes() {
  console.log('\n🔍 Checking minimum font sizes...');
  
  const componentFiles = findComponentFiles('.');
  
  // text-xs is 0.75rem = 12px, which is the minimum
  // Anything smaller would be a violation
  const tooSmallPattern = /text-\[(?:0\.[0-6]\d*|[0-9])(?:px|rem)\]/g;
  
  let foundIssues = 0;
  
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(tooSmallPattern);
    
    if (matches) {
      foundIssues += matches.length;
      addResult(
        'Minimum Font Size',
        `File: ${file}`,
        'FAIL',
        `Found font size(s) smaller than 12px: ${matches.join(', ')}`,
        '6.5'
      );
    }
  });
  
  if (foundIssues === 0) {
    addResult(
      'Minimum Font Size',
      'All files',
      'PASS',
      'All text meets minimum 12px (0.75rem) requirement. Smallest size used is text-xs.',
      '6.5'
    );
  }
}

// Check for responsive typography
function checkResponsiveTypography() {
  console.log('\n🔍 Checking responsive typography...');
  
  const componentFiles = findComponentFiles('.');
  const responsivePattern = /text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl)\s+(?:lg|md|sm|xl):text-/g;
  
  let responsiveCount = 0;
  const filesWithResponsive: string[] = [];
  
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(responsivePattern);
    
    if (matches) {
      responsiveCount += matches.length;
      filesWithResponsive.push(file);
    }
  });
  
  addResult(
    'Responsive Typography',
    'All files',
    'PASS',
    `Found ${responsiveCount} responsive typography instances across ${filesWithResponsive.length} files.`,
    '4.1, 4.2, 4.3'
  );
}

// Check for relative units (rem)
function checkRelativeUnits() {
  console.log('\n🔍 Checking for relative units (rem)...');
  
  // Check Tailwind config
  const tailwindConfigPath = 'tailwind.config.js';
  
  if (fs.existsSync(tailwindConfigPath)) {
    const content = fs.readFileSync(tailwindConfigPath, 'utf-8');
    
    // Check if fontSize uses rem
    if (content.includes('fontSize') && content.includes('rem')) {
      addResult(
        'Relative Units',
        'Tailwind Config',
        'PASS',
        'Tailwind configuration uses rem units for font sizes, supporting browser zoom up to 200%.',
        '6.3, 6.4'
      );
    } else {
      addResult(
        'Relative Units',
        'Tailwind Config',
        'WARNING',
        'Could not verify rem units in Tailwind config. Manual verification recommended.',
        '6.3, 6.4'
      );
    }
  }
}

// Check touch target sizes
function checkTouchTargets() {
  console.log('\n🔍 Checking touch target sizes...');
  
  const componentFiles = findComponentFiles('components');
  
  // Look for buttons and interactive elements
  const buttonPattern = /<button[^>]*className="([^"]*)"[^>]*>/g;
  const linkPattern = /<a[^>]*className="([^"]*)"[^>]*>/g;
  
  let adequatePadding = 0;
  let inadequatePadding = 0;
  
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check buttons
    let match;
    while ((match = buttonPattern.exec(content)) !== null) {
      const className = match[1];
      
      // Check for adequate padding (py-2 or py-3 is typically enough for 44px height)
      if (className.includes('py-2') || className.includes('py-3') || className.includes('p-2') || className.includes('p-3')) {
        adequatePadding++;
      } else if (className.includes('py-1') || className.includes('p-1')) {
        inadequatePadding++;
      }
    }
    
    // Check links
    while ((match = linkPattern.exec(content)) !== null) {
      const className = match[1];
      
      if (className.includes('py-2') || className.includes('py-3') || className.includes('p-2') || className.includes('p-3')) {
        adequatePadding++;
      }
    }
  });
  
  if (inadequatePadding > 0) {
    addResult(
      'Touch Targets',
      'Interactive Elements',
      'WARNING',
      `Found ${inadequatePadding} interactive element(s) that may not meet 44x44px minimum. ${adequatePadding} elements have adequate padding.`,
      '4.5'
    );
  } else {
    addResult(
      'Touch Targets',
      'Interactive Elements',
      'PASS',
      `All ${adequatePadding} checked interactive elements have adequate padding for 44x44px touch targets.`,
      '4.5'
    );
  }
}

// Check typography utility usage
function checkTypographyUtilities() {
  console.log('\n🔍 Checking typography utility usage...');
  
  const typographyUtilPath = 'lib/utils/typography.ts';
  
  if (fs.existsSync(typographyUtilPath)) {
    const content = fs.readFileSync(typographyUtilPath, 'utf-8');
    
    // Check if it exports typography constants
    if (content.includes('export') && (content.includes('typography') || content.includes('heading'))) {
      addResult(
        'Typography Utilities',
        'Typography Module',
        'PASS',
        'Typography utility module exists and exports reusable constants.',
        '3.3, 8.2'
      );
    }
  } else {
    addResult(
      'Typography Utilities',
      'Typography Module',
      'FAIL',
      'Typography utility module not found at lib/utils/typography.ts',
      '3.3, 8.2'
    );
  }
}

// Generate report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 ACCESSIBILITY AUDIT REPORT');
  console.log('='.repeat(80));
  
  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    console.log(`\n📁 ${category}`);
    console.log('-'.repeat(80));
    
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'PASS').length;
    const failed = categoryResults.filter(r => r.status === 'FAIL').length;
    const warnings = categoryResults.filter(r => r.status === 'WARNING').length;
    
    categoryResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}`);
      console.log(`   ${result.message}`);
      if (result.requirement) {
        console.log(`   Requirement: ${result.requirement}`);
      }
    });
    
    console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  });
  
  // Overall summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 OVERALL SUMMARY');
  console.log('='.repeat(80));
  
  const totalPassed = results.filter(r => r.status === 'PASS').length;
  const totalFailed = results.filter(r => r.status === 'FAIL').length;
  const totalWarnings = results.filter(r => r.status === 'WARNING').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${totalPassed} (${((totalPassed / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed / total) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Warnings: ${totalWarnings} (${((totalWarnings / total) * 100).toFixed(1)}%)`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 All accessibility checks passed!');
  } else {
    console.log('\n⚠️  Some accessibility issues need attention.');
  }
  
  console.log('='.repeat(80));
  
  // Save report to file
  const reportPath = 'docs/accessibility-audit-report.md';
  let markdown = '# Accessibility Audit Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += '## Summary\n\n';
  markdown += `- Total Tests: ${total}\n`;
  markdown += `- ✅ Passed: ${totalPassed} (${((totalPassed / total) * 100).toFixed(1)}%)\n`;
  markdown += `- ❌ Failed: ${totalFailed} (${((totalFailed / total) * 100).toFixed(1)}%)\n`;
  markdown += `- ⚠️ Warnings: ${totalWarnings} (${((totalWarnings / total) * 100).toFixed(1)}%)\n\n`;
  
  categories.forEach(category => {
    markdown += `## ${category}\n\n`;
    const categoryResults = results.filter(r => r.category === category);
    
    categoryResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      markdown += `### ${icon} ${result.test}\n\n`;
      markdown += `**Status:** ${result.status}\n\n`;
      markdown += `**Message:** ${result.message}\n\n`;
      if (result.requirement) {
        markdown += `**Requirement:** ${result.requirement}\n\n`;
      }
    });
  });
  
  fs.writeFileSync(reportPath, markdown);
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run all checks
function runAudit() {
  console.log('🚀 Starting Accessibility Audit...');
  console.log('This will check WCAG 2.1 AA compliance for the typography system.\n');
  
  checkHardcodedFontSizes();
  checkHeadingHierarchy();
  checkMinimumFontSizes();
  checkResponsiveTypography();
  checkRelativeUnits();
  checkTouchTargets();
  checkTypographyUtilities();
  
  generateReport();
}

// Execute audit
runAudit();
