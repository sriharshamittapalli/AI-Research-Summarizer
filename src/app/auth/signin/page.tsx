// src/app/auth/signin/page.tsx
import { login } from '../actions'

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign in
        </h2>
        <form className="mt-8 space-y-6" action={login}>
          <div>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Email address"
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign in
          </button>
        </form>
        <p className="text-center">
          <a href="/auth/signup" className="text-blue-600">
            Don't have an account? Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
