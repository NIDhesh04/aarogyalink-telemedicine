const { z } = require('zod');

/**
 * Zod schema for validating all required environment variables.
 * Fails fast on server start if any are missing or malformed.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .pipe(z.number().int().positive()),
  UV_THREADPOOL_SIZE: z
    .string()
    .default('16')
    .transform(Number)
    .pipe(z.number().int().min(4).max(128)),

  // MongoDB
  MONGO_URI: z
    .string({ required_error: 'MONGO_URI is required' })
    .url('MONGO_URI must be a valid connection string')
    .startsWith('mongodb', 'MONGO_URI must start with mongodb:// or mongodb+srv://'),

  // Redis
  REDIS_URL: z
    .string({ required_error: 'REDIS_URL is required' })
    .url('REDIS_URL must be a valid connection string')
    .startsWith('redis', 'REDIS_URL must start with redis://'),

  // Auth
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(8, 'JWT_REFRESH_SECRET must be at least 8 characters')
    .optional(),

  // Anthropic / Claude AI
  ANTHROPIC_API_KEY: z
    .string({ required_error: 'ANTHROPIC_API_KEY is required' })
    .startsWith('sk-ant-', 'ANTHROPIC_API_KEY must start with sk-ant-'),
  CLAUDE_API_KEY: z
    .string()
    .optional(),

  // Email
  EMAIL_USER: z
    .string({ required_error: 'EMAIL_USER is required' })
    .email('EMAIL_USER must be a valid email address'),
  EMAIL_PASS: z
    .string({ required_error: 'EMAIL_PASS is required' })
    .min(1, 'EMAIL_PASS cannot be empty'),
});

/**
 * Validates process.env against the schema.
 * Logs a detailed error table and exits if validation fails.
 * @returns {object} Parsed and validated environment variables.
 */
const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Environment validation failed:\n');

    const errors = result.error.flatten().fieldErrors;
    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  • ${field}: ${messages.join(', ')}`);
    }

    console.error('\n  → Check your .env file against .env.example\n');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
  return result.data;
};

module.exports = { validateEnv, envSchema };
