import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Restaurant Menu - Order Online</title>
        <meta name="description" content="Order delicious food online from our restaurant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Our Restaurant
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Customer Website Template - Coming Soon
            </p>
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Setup Required</h2>
              <p className="text-gray-600 mb-4">
                Configure your restaurant ID and API settings to get started.
              </p>
              <div className="text-sm text-gray-500">
                <p>Restaurant ID: {process.env.RESTAURANT_ID || 'Not configured'}</p>
                <p>API URL: {process.env.API_BASE_URL || 'Not configured'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
} 