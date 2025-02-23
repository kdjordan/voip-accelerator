export const AZ_DB_CONFIG = {
    version: 1,
    schema: '++id, destName, dialCode, rate',
};
export const AZColumnRole = {
    DESTINATION: 'destName',
    DIALCODE: 'dialCode',
    RATE: 'rate',
    SELECT: '', // For "Select Column Role" option
};
export const AZ_COLUMN_ROLE_OPTIONS = [
    { value: AZColumnRole.DESTINATION, label: 'Destination Name' },
    { value: AZColumnRole.DIALCODE, label: 'Dial Code' },
    { value: AZColumnRole.RATE, label: 'Rate' },
];
