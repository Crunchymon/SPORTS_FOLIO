export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-600">
          <span className="text-xl font-bold text-white">S</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          SportsFolio
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Trade athlete performance like stocks.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
