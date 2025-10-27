/**
 * Quick test file for +1 detection - run this in console to verify logic
 */

import { detectPlusOneDestinations, testPlusOneDetection } from './plus-one-detector';

// Test data samples
const mixedRateSheet = [
  ['Destination', 'Dial Code', 'Rate'],
  ['New York', '1212', '0.005'],
  ['California', '1213', '0.005'],
  ['Dominican Republic', '1809', '0.12'],
  ['Jamaica', '1876', '0.15'],
  ['Germany', '49', '0.03'],
  ['United Kingdom', '44', '0.02'],
  ['Canada Toronto', '1416', '0.01']
];

const pureInternational = [
  ['Destination', 'Code', 'Rate'],
  ['Germany', '49', '0.03'],
  ['United Kingdom', '44', '0.02'],
  ['France', '33', '0.025']
];

const pureUS = [
  ['Destination', 'NPA', 'Rate'],
  ['New York', '212', '0.005'],
  ['California', '213', '0.005'],
  ['Texas', '214', '0.005']
];

export function runTests() {
  console.group('Plus One Detection Tests');
  
  console.log('1. Testing mixed rate sheet:');
  const mixedResult = detectPlusOneDestinations(mixedRateSheet);
  console.log(mixedResult);
  
  console.log('2. Testing pure international:');
  const intlResult = detectPlusOneDestinations(pureInternational);
  console.log(intlResult);
  
  console.log('3. Testing pure US:');
  const usResult = detectPlusOneDestinations(pureUS);
  console.log(usResult);
  
  console.groupEnd();
  
  return {
    mixed: mixedResult,
    international: intlResult,
    us: usResult
  };
}

// Auto-run when imported (for quick console testing)
if (typeof window !== 'undefined') {
  console.log('Plus-one detector test file loaded. Run runTests() to test detection.');
}