import { ReactNode } from 'react';
import Head from 'next/head';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout = ({ 
  children, 
  title = 'Restaurant Developer', 
  description = 'Create and manage your restaurant website with ease'
}: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <main className="flex-grow">
          {children}
        </main>
        
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
                    <li className="mb-2"><a href="/features" className="text-gray-400 hover:text-white">Features</a></li>
                    <li className="mb-2"><a href="/pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                    <li className="mb-2"><a href="/examples" className="text-gray-400 hover:text-white">Examples</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Company</h3>
                  <ul>
                    <li className="mb-2"><a href="/about" className="text-gray-400 hover:text-white">About Us</a></li>
                    <li className="mb-2"><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
                    <li className="mb-2"><a href="/blog" className="text-gray-400 hover:text-white">Blog</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Legal</h3>
                  <ul>
                    <li className="mb-2"><a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                    <li className="mb-2"><a href="/terms" className="text-gray-400 hover:text-white">Terms of Service</a></li>
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
    </>
  );
};

export default Layout; 