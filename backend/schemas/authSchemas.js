const { z } = require('zod');

const registerSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character or symbol'),
  firstName: z.string({ required_error: 'Full name is required' })
    .trim()
    .min(1, 'Full name cannot be empty'),
  department: z.string().optional(),
  inviteCode: z.any().optional(),
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
