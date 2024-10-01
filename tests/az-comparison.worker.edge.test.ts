import { describe, it, expect } from 'vitest'
import { generateReports } from '../src/workers/az/generate-reports'
import { AZReportsInput } from '../types/app-types'

describe('az-comparison.worker edge cases', () => {
  it('should handle empty input files', () => {
    const input: AZReportsInput = {
      fileName1: 'empty1.csv',
      fileName2: 'empty2.csv',
      file1Data: [],
      file2Data: [],
    }

    const { pricingReport, codeReport } = generateReports(input)

    expect(pricingReport.higherRatesForFile1).toHaveLength(0)
    expect(pricingReport.higherRatesForFile2).toHaveLength(0)
    expect(pricingReport.sameRates).toHaveLength(0)
    expect(pricingReport.nonMatchingCodes).toHaveLength(0)
    expect(codeReport.matchedCodes).toBe(0)
    expect(codeReport.nonMatchedCodes).toBe(0)
  })

  it('should handle files with no matching codes', () => {
    const input: AZReportsInput = {
      fileName1: 'AZtest1.csv',
      fileName2: 'AZtest2.csv',
      file1Data: [
        { dialCode: 93, destName: 'Afghanistan Fixed - Other', rate: 0.18 },
      ],
      file2Data: [
        { dialCode: 9374, destName: 'Afghanistan Mobile - Salam', rate: 0.17435 },
      ],
    }

    const { pricingReport, codeReport } = generateReports(input)

    expect(pricingReport.nonMatchingCodes).toHaveLength(2)
    expect(codeReport.matchedCodes).toBe(0)
    expect(codeReport.nonMatchedCodes).toBe(2)
  })

  it('should handle rate differences', () => {
    const input: AZReportsInput = {
      fileName1: 'AZtest1.csv',
      fileName2: 'AZtest2.csv',
      file1Data: [
        { dialCode: 93, destName: 'Afghanistan Fixed - Other', rate: 0.18 },
      ],
      file2Data: [
        { dialCode: 93, destName: 'Afghanistan Fixed - Other', rate: 0.198 },
      ],
    }

    const { pricingReport } = generateReports(input)

    expect(pricingReport.higherRatesForFile2[0].percentageDifference).toBeCloseTo(10, 2)
  })
})