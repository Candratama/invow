/**
 * Bundle Size Analyzer Script
 * Analyzes and compares client-side JavaScript bundle sizes
 * 
 * Requirements: 9.5
 * - Client-side JavaScript Bundle SHALL be reduced by at least 10%
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';

interface BundleInfo {
  name: string;
  size: number;
  gzipSize: number;
}

interface BundleAnalysis {
  timestamp: string;
  totalSize: number;
  totalGzipSize: number;
  bundles: BundleInfo[];
  breakdown: {
    framework: number;
    firstLoad: number;
    pages: number;
    shared: number;
  };
}

interface ComparisonResult {
  before: BundleAnalysis | null;
  after: BundleAnalysis;
  improvement: {
    totalSizeChange: number;
    totalSizeChangePercent: number;
    meetsTarget: boolean;
  } | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const sign = bytes < 0 ? '-' : '';
  return sign + (Math.abs(bytes) / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function getGzipSize(filePath: string): number {
  try {
    const result = execSync(`gzip -c "${filePath}" | wc -c`, { stdio: 'pipe' });
    return parseInt(result.toString().trim(), 10);
  } catch {
    // Fallback: estimate gzip as ~30% of original
    const stats = statSync(filePath);
    return Math.round(stats.size * 0.3);
  }
}

function findJSFiles(dir: string, files: BundleInfo[] = []): BundleInfo[] {
  if (!existsSync(dir)) return files;
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stats = statSync(fullPath);
    
    if (stats.isDirectory()) {
      findJSFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push({
        name: fullPath.replace(process.cwd() + '/', ''),
        size: stats.size,
        gzipSize: getGzipSize(fullPath),
      });
    }
  }
  
  return files;
}

function analyzeBuild(): BundleAnalysis {
  console.log('\n📦 Analyzing bundle sizes...\n');
  
  const buildDir = join(process.cwd(), '.next');
  const staticDir = join(buildDir, 'static');
  
  if (!existsSync(buildDir)) {
    console.log('⚠️  No build found. Running production build...\n');
    execSync('npm run build', { stdio: 'inherit' });
  }
  
  // Find all JS files in static directory
  const bundles = findJSFiles(staticDir);
  
  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  
  // Categorize bundles
  let framework = 0;
  let firstLoad = 0;
  let pages = 0;
  let shared = 0;
  
  for (const bundle of bundles) {
    if (bundle.name.includes('framework') || bundle.name.includes('react')) {
      framework += bundle.size;
    } else if (bundle.name.includes('main') || bundle.name.includes('webpack')) {
      firstLoad += bundle.size;
    } else if (bundle.name.includes('pages') || bundle.name.includes('app')) {
      pages += bundle.size;
    } else {
      shared += bundle.size;
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    totalSize,
    totalGzipSize,
    bundles: bundles.sort((a, b) => b.size - a.size),
    breakdown: { framework, firstLoad, pages, shared },
  };
}

function loadBaseline(): BundleAnalysis | null {
  const baselinePath = join(process.cwd(), 'docs', 'performance-reports', 'bundle-baseline.json');
  
  if (existsSync(baselinePath)) {
    try {
      return JSON.parse(readFileSync(baselinePath, 'utf-8'));
    } catch {
      return null;
    }
  }
  
  return null;
}

function saveBaseline(analysis: BundleAnalysis): void {
  const reportsDir = join(process.cwd(), 'docs', 'performance-reports');
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const baselinePath = join(reportsDir, 'bundle-baseline.json');
  writeFileSync(baselinePath, JSON.stringify(analysis, null, 2));
  console.log(`📁 Baseline saved to: ${baselinePath}`);
}

function saveReport(result: ComparisonResult): void {
  const reportsDir = join(process.cwd(), 'docs', 'performance-reports');
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }
  
  const filename = `bundle-analysis-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = join(reportsDir, filename);
  
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  console.log(`📁 Report saved to: ${filepath}`);
}

function printReport(result: ComparisonResult): void {
  const { after, before, improvement } = result;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 BUNDLE SIZE ANALYSIS REPORT');
  console.log('='.repeat(70));
  console.log(`\nTimestamp: ${after.timestamp}`);
  
  console.log('\n📦 Current Bundle Sizes:\n');
  console.log(`  Total Size: ${formatBytes(after.totalSize)}`);
  console.log(`  Gzip Size:  ${formatBytes(after.totalGzipSize)}`);
  
  console.log('\n📊 Breakdown by Category:\n');
  console.log(`  • Framework (React):  ${formatBytes(after.breakdown.framework)}`);
  console.log(`  • First Load JS:      ${formatBytes(after.breakdown.firstLoad)}`);
  console.log(`  • Pages/Routes:       ${formatBytes(after.breakdown.pages)}`);
  console.log(`  • Shared Chunks:      ${formatBytes(after.breakdown.shared)}`);
  
  console.log('\n📄 Top 10 Largest Bundles:\n');
  after.bundles.slice(0, 10).forEach((bundle, i) => {
    console.log(`  ${i + 1}. ${bundle.name.split('/').pop()}`);
    console.log(`     Size: ${formatBytes(bundle.size)} (gzip: ${formatBytes(bundle.gzipSize)})`);
  });
  
  if (before && improvement) {
    console.log('\n' + '-'.repeat(70));
    console.log('📈 COMPARISON WITH BASELINE');
    console.log('-'.repeat(70));
    
    console.log(`\n  Baseline Date: ${before.timestamp.split('T')[0]}`);
    console.log(`  Baseline Size: ${formatBytes(before.totalSize)}`);
    console.log(`  Current Size:  ${formatBytes(after.totalSize)}`);
    
    const changeIcon = improvement.totalSizeChange < 0 ? '📉' : '📈';
    const changeSign = improvement.totalSizeChange < 0 ? '' : '+';
    
    console.log(`\n  ${changeIcon} Size Change: ${changeSign}${formatBytes(improvement.totalSizeChange)} (${changeSign}${improvement.totalSizeChangePercent.toFixed(1)}%)`);
    
    const targetIcon = improvement.meetsTarget ? '✅' : '❌';
    console.log(`\n  ${targetIcon} Target: 10% reduction`);
    
    if (improvement.meetsTarget) {
      console.log('  ✅ PASSED - Bundle size reduced by at least 10%!');
    } else if (improvement.totalSizeChange < 0) {
      console.log(`  ⚠️  Bundle reduced but not by 10% (only ${Math.abs(improvement.totalSizeChangePercent).toFixed(1)}%)`);
    } else {
      console.log('  ❌ FAILED - Bundle size increased');
    }
  } else {
    console.log('\n⚠️  No baseline found for comparison.');
    console.log('   Run with --save-baseline to create one.');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Bundle analysis complete!');
  console.log('='.repeat(70) + '\n');
}

async function main(): Promise<void> {
  console.log('🚀 Starting Bundle Size Analysis\n');
  console.log('This analysis measures client-side JavaScript bundle sizes');
  console.log('Target: 10% reduction from baseline (Requirement 9.5)\n');
  
  const saveBaselineFlag = process.argv.includes('--save-baseline');
  
  // Analyze current build
  const currentAnalysis = analyzeBuild();
  
  // Load baseline for comparison
  const baseline = loadBaseline();
  
  // Calculate improvement
  let improvement: ComparisonResult['improvement'] = null;
  
  if (baseline) {
    const sizeChange = currentAnalysis.totalSize - baseline.totalSize;
    const changePercent = (sizeChange / baseline.totalSize) * 100;
    
    improvement = {
      totalSizeChange: sizeChange,
      totalSizeChangePercent: changePercent,
      meetsTarget: changePercent <= -10, // 10% reduction
    };
  }
  
  const result: ComparisonResult = {
    before: baseline,
    after: currentAnalysis,
    improvement,
  };
  
  printReport(result);
  saveReport(result);
  
  if (saveBaselineFlag) {
    saveBaseline(currentAnalysis);
  }
  
  // Exit with appropriate code
  if (improvement && !improvement.meetsTarget && improvement.totalSizeChange > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
