export function generateReports(input) {
    const { fileName1, fileName2, file1Data, file2Data } = input;
    console.log('generateReports input', input);
    if (!fileName1 || !fileName2 || !file1Data || !file2Data) {
        throw new Error('Missing a file name or fileData in worker !!');
    }
    console.log(`File 1 entries: ${file1Data.length}`);
    console.log(`File 2 entries: ${file2Data.length}`);
    console.log(`Sample entry from file 1: ${JSON.stringify(file1Data[0])}`);
    console.log(`Sample entry from file 2: ${JSON.stringify(file2Data[0])}`);
    const groups = new Map();
    file1Data.forEach(entry => {
        if (entry && entry.dialCode) {
            const key = entry.dialCode.toString();
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(entry);
        }
        else {
            console.warn('Invalid entry in file1Data:', entry);
        }
    });
    file2Data.forEach(entry => {
        if (entry && entry.dialCode) {
            const key = entry.dialCode.toString();
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(entry);
        }
        else {
            console.warn('Invalid entry in file2Data:', entry);
        }
    });
    const consolidatedEntries = [];
    groups.forEach(group => {
        consolidatedEntries.push(consolidateDialCodes(group));
    });
    const pricingReport = {
        fileName1,
        fileName2,
        higherRatesForFile1: [],
        higherRatesForFile2: [],
        sameRates: [],
        nonMatchingCodes: []
    };
    const codeReport = {
        file1: {
            fileName: fileName1,
            totalCodes: file1Data.length,
            totalDestinations: new Set(file1Data.map(entry => entry.destName)).size,
            uniqueDestinationsPercentage: (new Set(file1Data.map(entry => entry.destName)).size / file1Data.length) * 100
        },
        file2: {
            fileName: fileName2,
            totalCodes: file2Data.length,
            totalDestinations: new Set(file2Data.map(entry => entry.destName)).size,
            uniqueDestinationsPercentage: (new Set(file2Data.map(entry => entry.destName)).size / file2Data.length) * 100
        },
        matchedCodes: 0,
        nonMatchedCodes: 0,
        matchedCodesPercentage: 0,
        nonMatchedCodesPercentage: 0
    };
    consolidatedEntries.forEach(entry => {
        const entry1 = file1Data.find(e => e.dialCode.toString() === entry.dialCode.toString());
        const entry2 = file2Data.find(e => e.dialCode.toString() === entry.dialCode.toString());
        if (entry1 && entry2) {
            const rateDiff = entry2.rate - entry1.rate;
            const percentageDifference = (rateDiff / entry1.rate) * 100;
            if (rateDiff > 0) {
                pricingReport.higherRatesForFile2.push({
                    dialCode: entry1.dialCode.toString(),
                    destName: entry1.destName,
                    rateFile1: entry1.rate,
                    rateFile2: entry2.rate,
                    percentageDifference
                });
            }
            else if (rateDiff < 0) {
                pricingReport.higherRatesForFile1.push({
                    dialCode: entry1.dialCode.toString(),
                    destName: entry1.destName,
                    rateFile1: entry1.rate,
                    rateFile2: entry2.rate,
                    percentageDifference
                });
            }
            else {
                pricingReport.sameRates.push({
                    dialCode: entry1.dialCode.toString(),
                    destName: entry1.destName,
                    rateFile1: entry1.rate,
                    rateFile2: entry2.rate,
                    percentageDifference: 0 // Add this line
                });
            }
            codeReport.matchedCodes++;
        }
        else {
            if (entry1) {
                pricingReport.nonMatchingCodes.push({
                    dialCode: entry1.dialCode.toString(),
                    destName: entry1.destName,
                    rate: entry1.rate,
                    file: 'file1'
                });
            }
            if (entry2) {
                pricingReport.nonMatchingCodes.push({
                    dialCode: entry2.dialCode.toString(),
                    destName: entry2.destName,
                    rate: entry2.rate,
                    file: 'file2'
                });
            }
            codeReport.nonMatchedCodes++;
        }
    });
    // Calculate percentages
    const totalCodes = codeReport.matchedCodes + codeReport.nonMatchedCodes;
    if (totalCodes > 0) {
        codeReport.matchedCodesPercentage = (codeReport.matchedCodes / totalCodes) * 100;
        codeReport.nonMatchedCodesPercentage = (codeReport.nonMatchedCodes / totalCodes) * 100;
    }
    return { pricingReport, codeReport };
}
export function consolidateDialCodesForNonMatching(group) {
    const consolidatedDialCode = group.map(entry => entry.dialCode).join(", ");
    const { destName, rate, file } = group[0]; // Assuming all entries in the group have the same destName, rate, and file.
    return { dialCode: consolidatedDialCode, destName, rate, file };
}
export function consolidateNonMatchingEntries(entries) {
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
export function consolidateDialCodes(group) {
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
export function calculatePercentageDifference(rate1, rate2) {
    if (rate1 > rate2) {
        return ((rate1 - rate2) / rate2) * 100;
    }
    else {
        return ((rate2 - rate1) / rate1) * 100;
    }
}
export function consolidateEntries(entries) {
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
