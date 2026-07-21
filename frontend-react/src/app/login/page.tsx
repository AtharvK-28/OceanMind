import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in to OceanMind</h2>
          <p className="mt-2 text-sm text-gray-600">Access your dashboard and marine data</p>
        </div>
        <form className="mt-8 space-y-6" action={login}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input id="email" name="email" type="email" required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Sign In
          </button>
        </form>
        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">Sign up</a>
        </div>
      </div>
    </div>
  )
}
