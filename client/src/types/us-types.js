// Rate type constants
export const USRateType = {
    INTERSTATE: 'interstate',
    INTRASTATE: 'intrastate',
    INDETERMINATE: 'indeterminate',
};
// Column roles for CSV mapping
export const USColumnRole = {
    NPA: 'npa',
    NXX: 'nxx',
    NPANXX: 'npanxx',
    INTERSTATE: 'interRate',
    INTRASTATE: 'intraRate',
    INDETERMINATE: 'ijRate',
    SELECT: '',
};
export const US_COLUMN_ROLE_OPTIONS = [
    { value: USColumnRole.NPANXX, label: 'NPANXX' },
    { value: USColumnRole.NPA, label: 'NPA' },
    { value: USColumnRole.NXX, label: 'NXX' },
    { value: USColumnRole.INTERSTATE, label: 'Interstate Rate' },
    { value: USColumnRole.INTRASTATE, label: 'Intrastate Rate' },
    { value: USColumnRole.INDETERMINATE, label: 'Indeterminate Rate' },
];
