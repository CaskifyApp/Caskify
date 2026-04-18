export interface PostgresColumnTypeOption {
  value: string;
  label: string;
}

export interface PostgresColumnTypeGroup {
  label: string;
  options: PostgresColumnTypeOption[];
}

export const CUSTOM_COLUMN_TYPE_VALUE = '__custom__';

export const POSTGRES_COLUMN_TYPE_GROUPS: PostgresColumnTypeGroup[] = [
  {
    label: 'Numeric',
    options: [
      { value: 'smallint', label: 'smallint' },
      { value: 'integer', label: 'integer' },
      { value: 'bigint', label: 'bigint' },
      { value: 'numeric', label: 'numeric' },
      { value: 'real', label: 'real' },
      { value: 'double precision', label: 'double precision' },
      { value: 'serial', label: 'serial' },
      { value: 'bigserial', label: 'bigserial' },
    ],
  },
  {
    label: 'Text',
    options: [
      { value: 'char', label: 'char' },
      { value: 'varchar', label: 'varchar' },
      { value: 'text', label: 'text' },
    ],
  },
  {
    label: 'Date and time',
    options: [
      { value: 'date', label: 'date' },
      { value: 'time', label: 'time' },
      { value: 'timestamp', label: 'timestamp' },
      { value: 'timestamptz', label: 'timestamptz' },
      { value: 'interval', label: 'interval' },
    ],
  },
  {
    label: 'Boolean and binary',
    options: [
      { value: 'boolean', label: 'boolean' },
      { value: 'bytea', label: 'bytea' },
    ],
  },
  {
    label: 'Document and identity',
    options: [
      { value: 'json', label: 'json' },
      { value: 'jsonb', label: 'jsonb' },
      { value: 'uuid', label: 'uuid' },
      { value: 'xml', label: 'xml' },
    ],
  },
  {
    label: 'Network and search',
    options: [
      { value: 'inet', label: 'inet' },
      { value: 'cidr', label: 'cidr' },
      { value: 'macaddr', label: 'macaddr' },
      { value: 'tsvector', label: 'tsvector' },
      { value: 'tsquery', label: 'tsquery' },
    ],
  },
];

const PRESET_VALUES = new Set(
  POSTGRES_COLUMN_TYPE_GROUPS.flatMap((group) => group.options.map((option) => option.value)),
);

export function isPresetPostgresColumnType(value: string) {
  return PRESET_VALUES.has(value.trim().toLowerCase());
}

export function normalizePostgresColumnType(value: string) {
  return value.trim().toLowerCase();
}
