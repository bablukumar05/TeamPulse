const { z } = require('zod');

const registerSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email cannot be empty')
    .email('Invalid email address format'),
  password: z.string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  firstName: z.string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name cannot be empty'),
  inviteCode: z.any().optional(),
  skills: z.any().optional(),
  tenthMarks: z.any().optional(),
  twelfthMarks: z.any().optional(),
  graduationDegree: z.any().optional(),
  postGraduationDegree: z.any().optional(),
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
