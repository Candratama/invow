#!/usr/bin/env ts-node
/**
 * Test script to verify responsive typography implementation
 * This script checks that components have proper responsive classes
 */

import * as fs from 'fs';
import * as path from 'path';

interface TypographyCheck {
  file: string;
  hasResponsive: boolean;
  textClasses: string[];
  responsiveClasses: string[];
}

const COMPONENT_DIRS = [
  'components/features',
  'components/landing-page',
  'components/ui',
  'app'
];

const TEXT_SIZE_REGEX = /text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/g;
const RESPONSIVE_TEXT_REGEX = /(sm|md|lg|xl|2xl):text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/g;

function findTsxFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeFile(filePath: string): TypographyCheck {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const textClasses = Array.from(content.matchAll(TEXT_SIZE_REGEX))
    .map(match => match[0]);
  
  const responsiveClasses = Array.from(content.matchAll(RESPONSIVE_TEXT_REGEX))
    .map(match => match[0]);
  
  return {
    file: filePath,
    hasResponsive: responsiveClasses.length > 0,
    textClasses: [...new Set(textClasses)],
    responsiveClasses: [...new Set(responsiveClasses)]
  };
}

function main() {
  console.log('🔍 Analyzing responsive typography implementation...\n');
  
  const allFiles: string[] = [];
  for (const dir of COMPONENT_DIRS) {
    allFiles.push(...findTsxFiles(dir));
  }
  
  const results = allFiles.map(analyzeFile);
  
  // Filter files that have text classes
  const filesWithText = results.filter(r => r.textClasses.length > 0);
  
  // Files with responsive typography
  const responsiveFiles = filesWithText.filter(r => r.hasResponsive);
  
  // Files without responsive typography
  const nonResponsiveFiles = filesWithText.filter(r => !r.hasResponsive);
  
  console.log(`📊 Summary:`);
  console.log(`   Total files analyzed: ${allFiles.length}`);
  console.log(`   Files with text classes: ${filesWithText.length}`);
  console.log(`   Files with responsive typography: ${responsiveFiles.length}`);
  console.log(`   Files needing responsive typography: ${nonResponsiveFiles.length}\n`);
  
  if (responsiveFiles.length > 0) {
    console.log('✅ Files with responsive typography:');
    responsiveFiles.forEach(r => {
      console.log(`   ${r.file}`);
      console.log(`      Responsive classes: ${r.responsiveClasses.join(', ')}`);
    });
    console.log('');
  }
  
  if (nonResponsiveFiles.length > 0) {
    console.log('⚠️  Files that may need responsive typography:');
    nonResponsiveFiles.forEach(r => {
      console.log(`   ${r.file}`);
      console.log(`      Text classes: ${r.textClasses.join(', ')}`);
    });
    console.log('');
  }
  
  // Calculate coverage
  const coverage = filesWithText.length > 0 
    ? (responsiveFiles.length / filesWithText.length * 100).toFixed(1)
    : 0;
  
  console.log(`📈 Responsive Typography Coverage: ${coverage}%`);
  
  if (parseFloat(coverage.toString()) >= 80) {
    console.log('✅ Good coverage! Most components have responsive typography.');
  } else if (parseFloat(coverage.toString()) >= 50) {
    console.log('⚠️  Moderate coverage. Consider adding responsive classes to more components.');
  } else {
    console.log('❌ Low coverage. Many components need responsive typography.');
  }
}

main();
