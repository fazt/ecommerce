import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  })
  .strict();
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    preferredCurrency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'MXN']).optional(),
    preferredLocale: z.enum(['en', 'es']).optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;