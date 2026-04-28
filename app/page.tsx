import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
      <main className="text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Secure Authentication System
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          A production-ready full-stack authentication system built with Next.js, Prisma, and Tailwind CSS.
        </p>

        <div className="flex space-x-4 justify-center mt-10">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            Sign In
          </Link>
          <Link 
            href="/admin" 
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700 shadow-lg"
          >
            Admin Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
