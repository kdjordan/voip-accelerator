export const LERG_COLUMN_ROLES = {
    NPA: 'NPA',
    NXX: 'NXX',
    STATE: 'State',
    COUNTRY: 'Country',
};
export const LERG_COLUMN_ROLE_OPTIONS = Object.entries(LERG_COLUMN_ROLES).map(([key, label]) => ({
    value: key,
    label,
}));
