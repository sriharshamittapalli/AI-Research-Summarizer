// src/app/page.tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          AI Research Summarizer
        </h1>
        <div className="space-x-4">
          <a
            href="/auth/signin"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}
