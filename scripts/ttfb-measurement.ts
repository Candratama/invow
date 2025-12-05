/**
 * TTFB (Time to First Byte) Measurement Script
 * Measures server response times for cached components
 * 
 * Requirements: 3.6
 * - TTFB SHALL be under 200ms for static content
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TTFBMeasurement {
  url: string;
  ttfb: number;
  totalTime: number;
  statusCode: number;
  contentType: string;
}

interface TTFBReport {
  timestamp: string;
  baseUrl: string;
  measurements: TTFBMeasurement[];
  summary: {
    averageTTFB: number;
    minTTFB: number;
    maxTTFB: number;
    allUnderThreshold: boolean;
    threshold: number;
  };
}

const TTFB_THRESHOLD = 200; // 200ms target

const ROUTES_TO_TEST = [
  { path: '/', name: 'Landing Page (cached)' },
  { path: '/dashboard/login', name: 'Login Page' },
  { path: '/templates', name: 'Templates Page' },
];

function formatMs(ms: number): string {
  return `${Math.round(ms)}ms`;
}

async function measureTTFB(url: string): Promise<TTFBMeasurement | null> {
  try {
    // Use curl to measure timing
    const curlFormat = '%{time_starttransfer},%{time_total},%{http_code},%{content_type}';
    const result = execSync(
      `curl -s -o /dev/null -w "${curlFormat}" "${url}"`,
      { stdio: 'pipe', timeout: 30000 }
    ).toString().trim();
    
    const [ttfbStr, totalStr, statusStr, contentType] = result.split(',');
    
    return {
      url,
      ttfb: parseFloat(ttfbStr) * 1000, // Convert to ms
      totalTime: parseFloat(totalStr) * 1000,
      statusCode: parseInt(statusStr, 10),
      contentType: contentType || 'unknown',
    };
  } catch (error) {
    console.error(`❌ Failed to measure ${url}:`, error);
    return null;
  }
}

async function runMultipleMeasurements(url: string, runs: number = 5): Promise<number[]> {
  const ttfbs: number[] = [];
  
  for (let i = 0; i < runs; i++) {
    const measurement = await measureTTFB(url);
    if (measurement) {
      ttfbs.push(measurement.ttfb);
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return ttfbs;
}

function calculateStats(values: number[]): { avg: number; min: number; max: number } {
  if (values.length === 0) return { avg: 0, min: 0, max: 0 };
  
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function printReport(report: TTFBReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TTFB (Time to First Byte) MEASUREMENT REPORT');
  console.log('='.repeat(70));
  console.log(`\nTimestamp: ${report.timestamp}`);
  console.log(`Base URL: ${report.baseUrl}`);
  console.log(`Threshold: ${report.summary.threshold}ms`);
  
  console.log('\n📈 Route Measurements:\n');
  
  for (const measurement of report.measurements) {
    const passIcon = measurement.ttfb <= TTFB_THRESHOLD ? '✅' : '❌';
    const routeName = ROUTES_TO_TEST.find(r => measurement.url.endsWith(r.path))?.name || measurement.url;
    
    console.log(`  ${passIcon} ${routeName}`);
    console.log(`     URL: ${measurement.url}`);
    console.log(`     TTFB: ${formatMs(measurement.ttfb)} (target: <${formatMs(TTFB_THRESHOLD)})`);
    console.log(`     Total: ${formatMs(measurement.totalTime)}`);
    console.log(`     Status: ${measurement.statusCode}`);
    console.log('');
  }
  
  console.log('-'.repeat(70));
  console.log('📊 Summary:\n');
  console.log(`  Average TTFB: ${formatMs(report.summary.averageTTFB)}`);
  console.log(`  Min TTFB:     ${formatMs(report.summary.minTTFB)}`);
  console.log(`  Max TTFB:     ${formatMs(report.summary.maxTTFB)}`);
  
  console.log('\n' + '='.repeat(70));
  
  if (report.summary.allUnderThreshold) {
    console.log('✅ PASSED - All routes have TTFB under 200ms!');
  } else {
    console.log('❌ FAILED - Some routes exceed 200ms TTFB threshold');
    console.log('\nRecommendations:');
    console.log('  • Ensure cache components are properly configured');
    console.log('  • Check server-side data fetching performance');
    console.log('  • Consider edge caching for static content');
  }
  
  console.log('='.repeat(70) + '\n');
}

function saveReport(report: TTFBReport): void {
  const reportsDir = join(process.cwd(), 'docs', 'performance-reports');
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const filename = `ttfb-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = join(reportsDir, filename);
  
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📁 Report saved to: ${filepath}`);
}

async function main(): Promise<void> {
  console.log('🚀 Starting TTFB Measurement\n');
  console.log('This measures Time to First Byte for cached components');
  console.log(`Target: TTFB < ${TTFB_THRESHOLD}ms for static content (Requirement 3.6)\n`);
  
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  console.log(`🌐 Base URL: ${baseUrl}`);
  
  // Check if server is running
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${baseUrl}`, { stdio: 'pipe' });
  } catch {
    console.error('\n❌ Error: Server is not running at', baseUrl);
    console.log('Please start the development server first: npm run dev');
    process.exit(1);
  }
  
  console.log('\n⏳ Running measurements (5 runs per route for accuracy)...\n');
  
  const measurements: TTFBMeasurement[] = [];
  
  for (const route of ROUTES_TO_TEST) {
    const url = `${baseUrl}${route.path}`;
    console.log(`  Testing: ${route.name}...`);
    
    // Run multiple measurements and take the median
    const ttfbs = await runMultipleMeasurements(url, 5);
    
    if (ttfbs.length > 0) {
      // Sort and take median
      ttfbs.sort((a, b) => a - b);
      const medianTTFB = ttfbs[Math.floor(ttfbs.length / 2)];
      
      const measurement = await measureTTFB(url);
      if (measurement) {
        measurement.ttfb = medianTTFB; // Use median for more stable results
        measurements.push(measurement);
        console.log(`    → Median TTFB: ${formatMs(medianTTFB)}`);
      }
    }
  }
  
  // Calculate summary
  const ttfbValues = measurements.map(m => m.ttfb);
  const stats = calculateStats(ttfbValues);
  
  const report: TTFBReport = {
    timestamp: new Date().toISOString(),
    baseUrl,
    measurements,
    summary: {
      averageTTFB: stats.avg,
      minTTFB: stats.min,
      maxTTFB: stats.max,
      allUnderThreshold: ttfbValues.every(t => t <= TTFB_THRESHOLD),
      threshold: TTFB_THRESHOLD,
    },
  };
  
  printReport(report);
  saveReport(report);
  
  // Exit with appropriate code
  process.exit(report.summary.allUnderThreshold ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
