import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});
type LoginData = z.infer<typeof schema>;

const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({ resolver: zodResolver(schema) });
  const onSubmit = (data: LoginData) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register('email')}    type="email"    placeholder="Email"    className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700" />
      {errors.email    && <p className="text-red-400 text-xs">{errors.email.message}</p>}
      <input {...register('password')} type="password" placeholder="Password" className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700" />
      {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
      <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">Sign In</button>
    </form>
  );
};

export default LoginForm;
