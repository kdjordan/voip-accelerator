import type { BaseEntity, DatabaseTables, TableNames } from '../types';

describe('Database Types', () => {
  it('should have all required table names', () => {
    const tableNames: TableNames[] = ['az', 'us', 'lerg', 'cache'];
    expect(Object.keys(SCHEMA_DEFINITION)).toEqual(tableNames);
  });
});
