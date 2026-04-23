import { z } from 'zod';
import { isValidRuMobile } from '../model/phone';

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(3, 'Укажите email')
    .email('Введите корректный email'),
  password: z.string().min(6, 'Введите пароль (минимум 6 символов)'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    email: z
      .string()
      .min(3, 'Укажите email')
      .email('Введите корректный email'),
    phone: z
      .string()
      .min(1, 'Укажите номер телефона')
      .refine((v) => isValidRuMobile(v), 'Нужен мобильный номер РФ в формате +7'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    referralUserLogin: z
      .string()
      .refine(
        (v) => v.trim().length === 0 || isValidRuMobile(v),
        'Нужен мобильный номер РФ в формате +7'
      ),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const paymentFormSchema = z.object({
  period: z.coerce
    .number()
    .refine((v) => v === 1 || v === 3 || v === 6, 'Доступны только 1, 3 или 6 месяцев'),
  phone: z
    .string()
    .min(1, 'Укажите номер телефона')
    .refine((v) => isValidRuMobile(v), 'Нужен мобильный номер РФ в формате +7'),
  receipt: z
    .custom<File>((v) => v instanceof File, 'Прикрепите квитанцию')
    .refine((f) => f.size > 0, 'Прикрепите квитанцию'),
});

export type PaymentFormValues = z.input<typeof paymentFormSchema>;
