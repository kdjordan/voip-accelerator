export interface BaseEntity {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CacheEntity extends BaseEntity {
  key: string;
  value: unknown;
  expiresAt: Date;
}
