export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Loading AI Dashboard</h2>
          <p className="text-sm text-gray-500">Initializing configuration...</p>
        </div>
      </div>
    </div>
  );
}