export const UPDATE_POLICIES = ['optional', 'recommended', 'mandatory'] as const;

export type UpdatePolicy = (typeof UPDATE_POLICIES)[number];

export function isUpdatePolicy(value: unknown): value is UpdatePolicy {
  return typeof value === 'string' && (UPDATE_POLICIES as readonly string[]).includes(value);
}
