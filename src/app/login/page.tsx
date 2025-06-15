// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link'; // 👈 ADD THIS IMPORT

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // ... (your handleEmailLogin and handleGoogleLogin functions remain the same)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        console.error(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An unexpected error occurred.');
      console.error(error);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };


  return (
    <main className="flex items-center justify-center min-h-screen bg-grid-pattern">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white shadow-lg rounded-xl">
        {/* ... (header, Google button, and form are the same) ... */}
        <div className="flex justify-center">
            <h1 className="text-2xl font-bold text-gray-800">
                <span className="text-orange-600">✔</span> AI Research Summarizer
            </h1>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FcGoogle className="w-5 h-5 mr-2" />
          Sign in with Google
        </button>

        <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>
        
        {error && (
            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
                {error}
            </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
          </div>
          <div>
            <button type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none">
              Continue
            </button>
          </div>
        </form>

        {/* 👇 THIS IS THE NEW PART TO ADD 👇 */}
        <p className="text-sm text-center text-gray-600">
                            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-orange-600 hover:text-orange-500">
                Sign Up
            </Link>
        </p>
        {/* 👆 END OF NEW PART 👆 */}

      </div>
    </main>
  );
}