// type DialCodeMap = Map<number, { destName: string; rate: number }>;
// Respond to messages from main thread
self.addEventListener('message', event => {
    // Process comparison and generate reports
    const { pricingReport, codeReport } = generateReports(event.data);
    // Send the generated reports back to the main thread
    self.postMessage({ pricingReport, codeReport });
});
function generateReports(input) {
    const { fileName1, fileName2, file1Data, file2Data } = input;
    if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
        throw new Error('Missing a file name or fileData in worker !!');
    }
    const pricingReport = {
        fileName1,
        fileName2,
        higherRatesForFile1: [],
        higherRatesForFile2: [],
        sameRates: [],
        nonMatchingCodes: [],
    };
    const codeReport = {
        file1: {
            fileName: fileName1,
            totalCodes: file1Data.length,
            totalDestinations: new Set(file1Data.map(d => d.destName)).size,
            uniqueDestinationsPercentage: 0,
        },
        file2: {
            fileName: fileName2,
            totalCodes: file2Data.length,
            totalDestinations: new Set(file2Data.map(d => d.destName)).size,
            uniqueDestinationsPercentage: 0,
        },
        matchedCodes: 0,
        nonMatchedCodes: 0,
        matchedCodesPercentage: 0,
        nonMatchedCodesPercentage: 0,
    };
    const dialCodeMapFile1 = new Map();
    const dialCodeMapFile2 = new Map();
    file1Data.forEach(entry => {
        dialCodeMapFile1.set(entry.dialCode, { destName: entry.destName, rate: Number(entry.rate) });
    });
    file2Data.forEach(entry => {
        dialCodeMapFile2.set(entry.dialCode, { destName: entry.destName, rate: Number(entry.rate) });
    });
    // Calculate matched and non-matched codes
    const file1Codes = new Set(file1Data.map(entry => entry.dialCode));
    const file2Codes = new Set(file2Data.map(entry => entry.dialCode));
    for (const code of file1Codes) {
        if (file2Codes.has(code)) {
            codeReport.matchedCodes++;
        }
        else {
            codeReport.nonMatchedCodes++;
        }
    }
    // Check for codes in file2 that are not in file1
    for (const code of file2Codes) {
        if (!file1Codes.has(code)) {
            codeReport.nonMatchedCodes++;
        }
    }
    dialCodeMapFile1.forEach((value1, key1) => {
        if (dialCodeMapFile2.has(key1)) {
            const value2 = dialCodeMapFile2.get(key1);
            const percentageDifference = calculatePercentageDifference(value1.rate, value2.rate);
            if (value1.rate > value2.rate) {
                pricingReport.higherRatesForFile1.push({
                    dialCode: `${key1}`,
                    destName: value1.destName,
                    rateFile1: value1.rate,
                    rateFile2: value2.rate,
                    percentageDifference: percentageDifference,
                });
            }
            else if (value1.rate < value2.rate) {
                pricingReport.higherRatesForFile2.push({
                    dialCode: `${key1}`,
                    destName: value1.destName,
                    rateFile1: value1.rate,
                    rateFile2: value2.rate,
                    percentageDifference: percentageDifference,
                });
            }
            else if (value1.rate === value2.rate) {
                pricingReport.sameRates.push({
                    dialCode: `${key1}`,
                    destName: value1.destName,
                    rateFile1: value1.rate,
                    rateFile2: value2.rate,
                    percentageDifference: 0,
                });
            }
        }
        else {
            pricingReport.nonMatchingCodes.push({
                dialCode: `${key1}`,
                destName: value1.destName,
                rate: value1.rate,
                file: fileName1,
            });
        }
    });
    dialCodeMapFile2.forEach((value, key) => {
        if (!dialCodeMapFile1.has(key)) {
            pricingReport.nonMatchingCodes.push({
                dialCode: `${key}`,
                destName: value.destName,
                rate: value.rate,
                file: fileName2,
            });
        }
    });
    // Update the calculation of matched and non-matched codes percentages
    const totalCodes = codeReport.matchedCodes + codeReport.nonMatchedCodes;
    if (totalCodes > 0) {
        codeReport.matchedCodesPercentage = (codeReport.matchedCodes / totalCodes) * 100;
        codeReport.nonMatchedCodesPercentage = (codeReport.nonMatchedCodes / totalCodes) * 100;
    }
    // Calculate percentages
    codeReport.file1.uniqueDestinationsPercentage =
        (codeReport.file1.totalDestinations / codeReport.file1.totalCodes) * 100;
    codeReport.file2.uniqueDestinationsPercentage =
        (codeReport.file2.totalDestinations / codeReport.file2.totalCodes) * 100;
    const totalUniqueCodes = Math.max(file1Codes.size, file2Codes.size);
    codeReport.matchedCodesPercentage = (codeReport.matchedCodes / totalUniqueCodes) * 100;
    codeReport.nonMatchedCodesPercentage = (codeReport.nonMatchedCodes / totalUniqueCodes) * 100;
    pricingReport.higherRatesForFile1 = consolidateEntries(pricingReport.higherRatesForFile1);
    pricingReport.higherRatesForFile2 = consolidateEntries(pricingReport.higherRatesForFile2);
    pricingReport.sameRates = consolidateEntries(pricingReport.sameRates);
    pricingReport.nonMatchingCodes = consolidateNonMatchingEntries(pricingReport.nonMatchingCodes);
    //sort report descending
    pricingReport.higherRatesForFile1.sort((a, b) => b.percentageDifference - a.percentageDifference);
    pricingReport.higherRatesForFile2.sort((a, b) => b.percentageDifference - a.percentageDifference);
    return { pricingReport, codeReport };
}
function consolidateDialCodesForNonMatching(group) {
    const consolidatedDialCode = group.map(entry => entry.dialCode).join(', ');
    const { destName, rate, file } = group[0]; // Assuming all entries in the group have the same destName, rate, and file.
    return { dialCode: consolidatedDialCode, destName, rate, file };
}
function consolidateNonMatchingEntries(entries) {
    const groups = new Map();
    entries.forEach(entry => {
        const key = `${entry.destName}:${entry.rate}:${entry.file}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(entry);
    });
    const consolidatedEntries = [];
    groups.forEach(group => {
        consolidatedEntries.push(consolidateDialCodesForNonMatching(group));
    });
    return consolidatedEntries;
}
function consolidateDialCodes(group) {
    const { destName, rateFile1, rateFile2, percentageDifference } = group[0];
    const dialCodes = new Set(group.map(row => row.dialCode));
    return {
        destName,
        rateFile1,
        rateFile2,
        dialCode: Array.from(dialCodes).join(', '),
        percentageDifference,
    };
}
function calculatePercentageDifference(rate1, rate2) {
    if (rate1 > rate2) {
        return ((rate1 - rate2) / rate2) * 100;
    }
    else {
        return ((rate2 - rate1) / rate1) * 100;
    }
}
function consolidateEntries(entries) {
    const groups = new Map();
    entries.forEach(entry => {
        const key = `${entry.destName}:${entry.rateFile1}:${entry.rateFile2}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(entry);
    });
    const consolidatedEntries = [];
    groups.forEach(group => {
        consolidatedEntries.push(consolidateDialCodes(group));
    });
    return consolidatedEntries;
}
export {};
