/**
 * Console test for +1 detection with real file data
 * Open browser console and run: testWithRealFile()
 */

import { detectPlusOneDestinations } from './plus-one-detector';

// Sample data that mimics your real file structure
const mixedRateSheet = [
  ['Destination', 'Code', 'Rate', 'Quality'],
  ['United States - New York', '1212', '0.005', 'Premium'],
  ['United States - California', '1213', '0.005', 'Premium'], 
  ['Dominican Republic', '1809', '0.12', 'Standard'],
  ['Jamaica', '1876', '0.15', 'Standard'],
  ['Germany Mobile', '49151', '0.25', 'Premium'],
  ['United Kingdom', '44', '0.02', 'Premium'],
  ['Canada - Toronto', '1416', '0.01', 'Premium'],
  ['Bahamas', '1242', '0.18', 'Standard'],
  ['France', '33', '0.025', 'Premium']
];

export function testWithRealFile() {
  console.group('🔍 Plus-One Detection Test');
  
  console.log('Testing with mixed rate sheet containing:');
  console.log('- US destinations (212, 213)');
  console.log('- Canadian destinations (416)'); 
  console.log('- Caribbean destinations (809, 876, 242)');
  console.log('- True international (49, 44, 33)');
  console.log('');
  
  const result = detectPlusOneDestinations(mixedRateSheet);
  
  console.log('📊 Detection Results:');
  console.log(`Has +1 destinations: ${result.hasPlusOne}`);
  console.log(`Total destinations analyzed: ${result.totalDestinations}`);
  console.log(`Suggested action: ${result.suggestedAction}`);
  console.log('');
  
  console.log('📋 Breakdown:');
  console.log(`🇺🇸 US NPAs (${result.plusOneBreakdown.usNPAs.length}):`, result.plusOneBreakdown.usNPAs);
  console.log(`🇨🇦 Canadian NPAs (${result.plusOneBreakdown.canadianNPAs.length}):`, result.plusOneBreakdown.canadianNPAs);
  console.log(`🏝️ Caribbean NPAs (${result.plusOneBreakdown.caribbeanNPAs.length}):`, result.plusOneBreakdown.caribbeanNPAs);
  console.log(`❓ Unknown NPAs (${result.plusOneBreakdown.unknownNPAs.length}):`, result.plusOneBreakdown.unknownNPAs);
  console.log('');
  
  if (result.suggestedAction === 'show-modal') {
    console.log('✅ This file WOULD trigger the +1 handling modal (when we build it)');
  } else {
    console.log('ℹ️ This file would proceed normally (no modal needed)');
  }
  
  console.groupEnd();
  
  return result;
}

// Test with pure international (should NOT trigger modal)
export function testPureInternational() {
  const pureIntl = [
    ['Destination', 'Code', 'Rate'],
    ['Germany', '49', '0.03'],
    ['United Kingdom', '44', '0.02'],
    ['France', '33', '0.025']
  ];
  
  console.group('🌍 Pure International Test');
  const result = detectPlusOneDestinations(pureIntl);
  console.log('Should show "proceed-normal":', result.suggestedAction);
  console.log('Has +1:', result.hasPlusOne);
  console.groupEnd();
  
  return result;
}

// Auto-expose to window for console testing
if (typeof window !== 'undefined') {
  (window as any).testWithRealFile = testWithRealFile;
  (window as any).testPureInternational = testPureInternational;
  console.log('🧪 Test functions loaded! Run in console:');
  console.log('- testWithRealFile()');
  console.log('- testPureInternational()');
}