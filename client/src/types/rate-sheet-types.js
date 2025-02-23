export const RequiredRFColumnRole = {
    NAME: 'name',
    PREFIX: 'prefix',
    RATE: 'rate',
};
export const OptionalRFColumnRole = {
    EFFECTIVE: 'effective',
    MIN_DURATION: 'minDuration',
    INCREMENTS: 'increments',
};
export const RFColumnRole = {
    ...RequiredRFColumnRole,
    ...OptionalRFColumnRole,
    SELECT: '', // For "Select Column Role" option
};
export const RF_COLUMN_ROLE_OPTIONS = [
    { value: RFColumnRole.NAME, label: 'Name', required: true },
    { value: RFColumnRole.PREFIX, label: 'Prefix', required: true },
    { value: RFColumnRole.RATE, label: 'Rate', required: true },
    { value: RFColumnRole.EFFECTIVE, label: 'Effective' },
    { value: RFColumnRole.MIN_DURATION, label: 'Min Duration' },
    { value: RFColumnRole.INCREMENTS, label: 'Increments' },
];
export const RF_COLUMN_ROLE_OPTIONS_NEW = {
    name: { label: 'Destination Name', required: true },
    prefix: { label: 'Prefix', required: true },
    rate: { label: 'Rate', required: true },
    effective: { label: 'Effective Date', required: false },
    minDuration: { label: 'Min Duration', required: false },
    increments: { label: 'Increments', required: false },
};
