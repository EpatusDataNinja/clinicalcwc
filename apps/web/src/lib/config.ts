/**
 * Global application configuration flags
 */
export const config = {
  // Default production behavior should be false.
  // Can be toggled at runtime via localStorage or build-time via env var.
  enableSeedData:
    typeof window !== 'undefined'
      ? localStorage.getItem('cwc_enable_seed_data') === 'true' ||
        process.env.NEXT_PUBLIC_ENABLE_SEED_DATA === 'true'
      : process.env.NEXT_PUBLIC_ENABLE_SEED_DATA === 'true',
};

/**
 * Update the dynamic seed data configuration flag at runtime
 */
export function setEnableSeedData(value: boolean): void {
  config.enableSeedData = value;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cwc_enable_seed_data', String(value));
  }
}
