import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Head>
        <title>Restaurant Developer | Create Your Restaurant Website</title>
        <meta name="description" content="Create and manage your restaurant website with ease" />
      </Head>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-900">
        <div className="container mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Create Your Restaurant Website in Minutes
              </h1>
              <p className="mt-4 text-xl text-white opacity-90">
                Build a professional online presence for your restaurant without any technical skills.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row">
                <Link href="/signup" className="btn-primary bg-white text-primary-700 hover:bg-gray-100 text-lg px-6 py-3 mb-4 sm:mb-0 sm:mr-4">
                  Get Started Free
                </Link>
                <Link href="/examples" className="btn-secondary border-white text-white hover:bg-primary-800 text-lg px-6 py-3">
                  View Examples
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="/placeholder-restaurant.jpg" 
                alt="Restaurant website preview" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Everything You Need to Succeed Online</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="card text-center">
              <div className="mx-auto bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Beautiful Templates</h3>
              <p className="text-gray-600">Choose from professionally designed templates tailored for restaurants.</p>
            </div>
            
            <div className="card text-center">
              <div className="mx-auto bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Menu Management</h3>
              <p className="text-gray-600">Easily update your menu items, prices, and specials in real-time.</p>
            </div>
            
            <div className="card text-center">
              <div className="mx-auto bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Online Ordering</h3>
              <p className="text-gray-600">Accept online orders directly through your website.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to grow your restaurant business?</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of restaurant owners who are already using our platform to increase their online presence.
          </p>
          <Link href="/signup" className="btn-primary text-lg px-8 py-3">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold">Restaurant Developer</h2>
              <p className="mt-2 text-gray-400">Create your restaurant website with ease.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Product</h3>
                <ul>
                  <li className="mb-2"><Link href="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                  <li className="mb-2"><Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                  <li className="mb-2"><Link href="/examples" className="text-gray-400 hover:text-white">Examples</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul>
                  <li className="mb-2"><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                  <li className="mb-2"><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                  <li className="mb-2"><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Legal</h3>
                <ul>
                  <li className="mb-2"><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                  <li className="mb-2"><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center md:text-left">
            <p className="text-gray-400">© {new Date().getFullYear()} Restaurant Developer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 