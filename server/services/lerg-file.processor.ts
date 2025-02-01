private parseLergLine(line: string): LERGRecord | null {
  try {
    if (!line.trim()) {
      return null;
    }

    const parts = line.split(',').map(part => part.replace(/^"|"$/g, '').trim());

    // Skip header line
    if (parts[0].toUpperCase() === 'NPA') {
      return null;
    }

    const npa = parts[0];
    const nxx = parts[1];
    const state = parts[3];

    // Validate NPA and NXX
    if (!/^\d{3}$/.test(npa) || !/^\d{3}$/.test(nxx)) {
      console.log('Invalid NPA/NXX:', { npa, nxx });
      return null;
    }

    // Validate state is 2 characters
    if (!state || state.length !== 2) {
      console.log('Invalid state:', { state });
      return null;
    }

    return {
      npa,
      nxx,
      npanxx: `${npa}${nxx}`,
      state,
      last_updated: new Date()
    };
  } catch (error) {
    console.error('Error parsing LERG line:', error);
    return null;
  }
} 