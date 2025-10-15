function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            🎨 Picasso Config Builder
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Conversational Forms Configuration Tool
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Welcome to Picasso Config Builder
          </h2>
          <p className="text-gray-600 mb-6">
            This tool helps you configure conversational forms, CTAs, and conversation branches.
          </p>
          <div className="inline-flex gap-4">
            <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Get Started
            </button>
            <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              View Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
