import { describe, it, expect } from 'vitest'
import {
  generateReports,
  calculatePercentageDifference,
  consolidateEntries,
  consolidateNonMatchingEntries
} from '../src/workers/az/generate-reports'
import { AZReportsInput, ConsolidatedData, NonMatchingCode } from '../types/app-types'

describe('az-comparison.worker', () => {
  describe('generateReports', () => {
    it('should generate both pricing and code reports', () => {
      const input: AZReportsInput = {
        fileName1: 'AZtest1.csv',
        fileName2: 'AZtest2.csv',
        file1Data: [
          { dialCode: 93, destName: 'Afghanistan Fixed - Other', rate: 0.18 },
          { dialCode: 9375, destName: 'Afghanistan Mobile - AT', rate: 0.1585 },
          { dialCode: 9370, destName: 'Afghanistan Mobile - AWCC', rate: 0.1255 },
          { dialCode: 9373, destName: 'Afghanistan Mobile - Etisalat', rate: 0.1425 },
        ],
        file2Data: [
          { dialCode: 93, destName: 'Afghanistan Fixed - Other', rate: 0.198 },
          { dialCode: 9375, destName: 'Afghanistan Mobile - AT', rate: 0.17435 },
          { dialCode: 9370, destName: 'Afghanistan Mobile - AWCC', rate: 0.13805 },
          { dialCode: 9373, destName: 'Afghanistan Mobile - Etisalat', rate: 0.15675 },
        ],
      }

      const { pricingReport, codeReport } = generateReports(input)

      expect(pricingReport).toBeDefined()
      expect(codeReport).toBeDefined()
      expect(pricingReport.higherRatesForFile2).toHaveLength(4)
      expect(pricingReport.nonMatchingCodes).toHaveLength(0)
      expect(codeReport.matchedCodes).toBe(4)
      expect(codeReport.nonMatchedCodes).toBe(0)
    })

    it('should throw an error if input is incomplete', () => {
      const incompleteInput = {
        fileName1: 'file1.csv',
        // Missing other required fields
      }

      expect(() => generateReports(incompleteInput as AZReportsInput)).toThrow('Missing a file name or fileData in worker !!')
    })
  })

  describe('calculatePercentageDifference', () => {
    it('should calculate percentage difference correctly', () => {
      expect(calculatePercentageDifference(0.18, 0.198)).toBeCloseTo(10, 2)
      expect(calculatePercentageDifference(0.1585, 0.17435)).toBeCloseTo(10, 2)
    })
  })

  describe('consolidateEntries', () => {
    it('should consolidate entries with the same destination and rates', () => {
      const entries: ConsolidatedData[] = [
        { dialCode: '9370', destName: 'Afghanistan Mobile - AWCC', rateFile1: 0.1255, rateFile2: 0.13805, percentageDifference: 10 },
        { dialCode: '9371', destName: 'Afghanistan Mobile - AWCC', rateFile1: 0.1255, rateFile2: 0.13805, percentageDifference: 10 },
      ]

      const result = consolidateEntries(entries)

      expect(result).toHaveLength(1)
      expect(result[0].dialCode).toBe('9370, 9371')
    })
  })

  describe('consolidateNonMatchingEntries', () => {
    it('should consolidate non-matching entries with the same destination, rate, and file', () => {
      const entries: NonMatchingCode[] = [
        { dialCode: '9376', destName: 'Afghanistan Mobile - MTN', rate: 0.125, file: 'AZtest1.csv' },
        { dialCode: '9377', destName: 'Afghanistan Mobile - MTN', rate: 0.125, file: 'AZtest1.csv' },
      ]

      const result = consolidateNonMatchingEntries(entries)

      expect(result).toHaveLength(1)
      expect(result[0].dialCode).toBe('9376, 9377')
    })
  })
})