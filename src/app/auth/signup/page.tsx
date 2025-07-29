// src/app/auth/signup/page.tsx
import { signup } from '../actions'

export default function SignUp() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign up
        </h2>
        <form className="mt-8 space-y-6" action={signup}>
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
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Password (min 6 characters)"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign up
          </button>
        </form>
        <p className="text-center">
          <a href="/auth/signin" className="text-blue-600">
            Already have an account? Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
