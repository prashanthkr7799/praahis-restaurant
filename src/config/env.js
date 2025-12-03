/**
 * Environment Validation with Zod
 * Ensures all required environment variables are present and valid at runtime
 */

import { z } from 'zod';

/**
 * Define the schema for environment variables
 */
const envSchema = z.object({
  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .min(1, 'VITE_SUPABASE_URL is required'),

  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),

  // Manager Supabase Client (Optional - falls back to main client)
  VITE_SUPABASE_MANAGER_URL: z.string().url().optional().or(z.literal('')),

  VITE_SUPABASE_MANAGER_KEY: z.string().optional().or(z.literal('')),

  // Owner Supabase Client (Optional - falls back to main client)
  VITE_SUPABASE_OWNER_URL: z.string().url().optional().or(z.literal('')),

  VITE_SUPABASE_OWNER_KEY: z.string().optional().or(z.literal('')),

  // Application Settings
  VITE_APP_URL: z.string().url().optional().default('http://localhost:5173'),

  VITE_APP_NAME: z.string().optional().default('Praahis'),

  // Feature Flags
  VITE_ENABLE_REALTIME: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('true'),

  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('false'),

  // Development Settings
  VITE_DEBUG_MODE: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('false'),

  // API Rate Limiting
  VITE_API_RATE_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .optional()
    .default('100'),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  // Collect all VITE_ prefixed environment variables
  const envVars = Object.fromEntries(
    Object.entries(import.meta.env).filter(([key]) => key.startsWith('VITE_'))
  );

  try {
    const parsed = envSchema.parse(envVars);
    return { success: true, data: parsed, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));

      console.error('❌ Environment validation failed:');
      errors.forEach((err) => {
        console.error(`  - ${err.path}: ${err.message}`);
      });

      return { success: false, data: null, errors };
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Throws if validation fails in development
 */
function getEnv() {
  const result = validateEnv();

  if (!result.success) {
    // In development, throw to alert developers immediately
    if (import.meta.env.DEV) {
      throw new Error(
        `Missing or invalid environment variables:\n${result.errors
          .map((e) => `  - ${e.path}: ${e.message}`)
          .join('\n')}\n\nPlease check your .env file.`
      );
    }

    // In production, log error and return defaults
    console.error('Environment validation failed. Using defaults where possible.');
    return getDefaultEnv();
  }

  return result.data;
}

/**
 * Get default environment values (for production fallback)
 */
function getDefaultEnv() {
  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_SUPABASE_MANAGER_URL: import.meta.env.VITE_SUPABASE_MANAGER_URL || '',
    VITE_SUPABASE_MANAGER_KEY: import.meta.env.VITE_SUPABASE_MANAGER_KEY || '',
    VITE_SUPABASE_OWNER_URL: import.meta.env.VITE_SUPABASE_OWNER_URL || '',
    VITE_SUPABASE_OWNER_KEY: import.meta.env.VITE_SUPABASE_OWNER_KEY || '',
    VITE_APP_URL: 'http://localhost:5173',
    VITE_APP_NAME: 'Praahis',
    VITE_ENABLE_REALTIME: true,
    VITE_ENABLE_ANALYTICS: false,
    VITE_DEBUG_MODE: false,
    VITE_API_RATE_LIMIT: 100,
  };
}

// Export validated environment
export const env = getEnv();

// Export validation utilities
export { validateEnv, envSchema };

// Type-safe environment access
export default env;
