/**
 * Lighthouse Performance Audit Script
 * Measures Core Web Vitals and performance metrics for the landing page
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 * - Lighthouse Performance Score >= 90
 * - LCP < 2.5s
 * - FID < 100ms (measured as TBT in lab)
 * - CLS < 0.1
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LighthouseMetrics {
  performanceScore: number;
  lcp: number; // Largest Contentful Paint in ms
  fid: number; // First Input Delay (TBT as proxy) in ms
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint in ms
  ttfb: number; // Time to First Byte in ms
  tbt: number; // Total Blocking Time in ms
  si: number; // Speed Index in ms
}

interface AuditResult {
  url: string;
  timestamp: string;
  metrics: LighthouseMetrics;
  passed: boolean;
  details: {
    performancePass: boolean;
    lcpPass: boolean;
    fidPass: boolean;
    clsPass: boolean;
    ttfbPass: boolean;
  };
}

const THRESHOLDS = {
  performanceScore: 90,
  lcp: 2500, // 2.5 seconds
  fid: 100, // 100ms (using TBT as proxy)
  cls: 0.1,
  ttfb: 200, // 200ms for cached content
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function runLighthouseAudit(url: string): Promise<LighthouseMetrics | null> {
  console.log(`\n🔍 Running Lighthouse audit for: ${url}\n`);
  
  try {
    // Check if lighthouse is installed
    try {
      execSync('npx lighthouse --version', { stdio: 'pipe' });
    } catch {
      console.log('📦 Installing Lighthouse...');
      execSync('npm install -g lighthouse', { stdio: 'inherit' });
    }
    
    // Run Lighthouse with JSON output
    const outputPath = join(process.cwd(), '.lighthouse-report.json');
    
    console.log('⏳ Running Lighthouse (this may take 30-60 seconds)...\n');
    
    execSync(
      `npx lighthouse ${url} --output=json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance --quiet`,
      { stdio: 'pipe', timeout: 120000 }
    );
    
    // Parse results
    const report = JSON.parse(readFileSync(outputPath, 'utf-8'));
    
    const metrics: LighthouseMetrics = {
      performanceScore: Math.round((report.categories?.performance?.score || 0) * 100),
      lcp: report.audits?.['largest-contentful-paint']?.numericValue || 0,
      fid: report.audits?.['max-potential-fid']?.numericValue || 0,
      cls: report.audits?.['cumulative-layout-shift']?.numericValue || 0,
      fcp: report.audits?.['first-contentful-paint']?.numericValue || 0,
      ttfb: report.audits?.['server-response-time']?.numericValue || 0,
      tbt: report.audits?.['total-blocking-time']?.numericValue || 0,
      si: report.audits?.['speed-index']?.numericValue || 0,
    };
    
    // Clean up temp file
    try {
      unlinkSync(outputPath);
    } catch {}
    
    return metrics;
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error);
    return null;
  }
}

function evaluateMetrics(metrics: LighthouseMetrics): AuditResult['details'] {
  return {
    performancePass: metrics.performanceScore >= THRESHOLDS.performanceScore,
    lcpPass: metrics.lcp <= THRESHOLDS.lcp,
    fidPass: metrics.tbt <= THRESHOLDS.fid, // Using TBT as FID proxy
    clsPass: metrics.cls <= THRESHOLDS.cls,
    ttfbPass: metrics.ttfb <= THRESHOLDS.ttfb,
  };
}

function printReport(result: AuditResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 LIGHTHOUSE PERFORMANCE AUDIT REPORT');
  console.log('='.repeat(70));
  console.log(`\nURL: ${result.url}`);
  console.log(`Timestamp: ${result.timestamp}`);
  
  console.log('\n📈 Core Web Vitals:\n');
  
  const { metrics, details } = result;
  
  // Performance Score
  const perfIcon = details.performancePass ? '✅' : '❌';
  console.log(`  ${perfIcon} Performance Score: ${metrics.performanceScore}/100 (target: ≥${THRESHOLDS.performanceScore})`);
  
  // LCP
  const lcpIcon = details.lcpPass ? '✅' : '❌';
  console.log(`  ${lcpIcon} LCP (Largest Contentful Paint): ${formatMs(metrics.lcp)} (target: <${formatMs(THRESHOLDS.lcp)})`);
  
  // FID/TBT
  const fidIcon = details.fidPass ? '✅' : '❌';
  console.log(`  ${fidIcon} TBT (Total Blocking Time): ${formatMs(metrics.tbt)} (target: <${formatMs(THRESHOLDS.fid)})`);
  
  // CLS
  const clsIcon = details.clsPass ? '✅' : '❌';
  console.log(`  ${clsIcon} CLS (Cumulative Layout Shift): ${metrics.cls.toFixed(3)} (target: <${THRESHOLDS.cls})`);
  
  console.log('\n📊 Additional Metrics:\n');
  console.log(`  • FCP (First Contentful Paint): ${formatMs(metrics.fcp)}`);
  console.log(`  • Speed Index: ${formatMs(metrics.si)}`);
  
  // TTFB
  const ttfbIcon = details.ttfbPass ? '✅' : '⚠️';
  console.log(`  ${ttfbIcon} TTFB (Time to First Byte): ${formatMs(metrics.ttfb)} (target: <${formatMs(THRESHOLDS.ttfb)})`);
  
  console.log('\n' + '='.repeat(70));
  
  if (result.passed) {
    console.log('✅ AUDIT PASSED - All Core Web Vitals meet targets!');
  } else {
    console.log('❌ AUDIT FAILED - Some metrics need improvement');
    console.log('\nRecommendations:');
    if (!details.performancePass) {
      console.log('  • Optimize JavaScript bundle size');
      console.log('  • Reduce render-blocking resources');
    }
    if (!details.lcpPass) {
      console.log('  • Optimize largest content element loading');
      console.log('  • Use image optimization and lazy loading');
    }
    if (!details.fidPass) {
      console.log('  • Reduce JavaScript execution time');
      console.log('  • Break up long tasks');
    }
    if (!details.clsPass) {
      console.log('  • Add explicit dimensions to images/embeds');
      console.log('  • Reserve space for dynamic content');
    }
  }
  
  console.log('='.repeat(70) + '\n');
}

function saveReport(result: AuditResult): void {
  const reportsDir = join(process.cwd(), 'docs', 'performance-reports');
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const filename = `lighthouse-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = join(reportsDir, filename);
  
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  console.log(`📁 Report saved to: ${filepath}`);
}

async function main(): Promise<void> {
  console.log('🚀 Starting Lighthouse Performance Audit\n');
  console.log('This audit measures Core Web Vitals for the landing page:');
  console.log('  • Performance Score (target: ≥90)');
  console.log('  • LCP - Largest Contentful Paint (target: <2.5s)');
  console.log('  • FID - First Input Delay via TBT (target: <100ms)');
  console.log('  • CLS - Cumulative Layout Shift (target: <0.1)');
  console.log('  • TTFB - Time to First Byte (target: <200ms)');
  
  const url = process.argv[2] || 'http://localhost:3000';
  
  console.log(`\n🌐 Target URL: ${url}`);
  
  // Check if server is running
  try {
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { stdio: 'pipe' });
  } catch {
    console.error('\n❌ Error: Server is not running at', url);
    console.log('Please start the development server first: npm run dev');
    process.exit(1);
  }
  
  const metrics = await runLighthouseAudit(url);
  
  if (!metrics) {
    console.error('\n❌ Failed to collect metrics');
    process.exit(1);
  }
  
  const details = evaluateMetrics(metrics);
  const passed = Object.values(details).every(v => v);
  
  const result: AuditResult = {
    url,
    timestamp: new Date().toISOString(),
    metrics,
    passed,
    details,
  };
  
  printReport(result);
  saveReport(result);
  
  // Exit with appropriate code
  process.exit(passed ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
