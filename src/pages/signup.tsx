import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import authService, { RegisterData } from '../services/authService';

const SignupPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData & { role: string }>({
    name: '',
    email: '',
    password: '',
    role: 'restaurant_owner', // All users are restaurant owners in this B2B platform
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Enhanced client-side validation
    if (!formData.name.trim()) {
      setError('Name is required.');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    console.log('Submitting signup form with data:', {
      name: formData.name,
      email: formData.email,
      passwordLength: formData.password.length
    });

    try {
      const result = await authService.register(formData);
      console.log('Signup successful:', result);
      setSuccess('Registration successful! You will be redirected to login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Signup error details:', {
        error: err,
        response: err.response,
        data: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });

      // Try to expand the error data for better debugging
      if (err.response?.data) {
        console.error('Full error data:', JSON.stringify(err.response.data, null, 2));
      }

      let errorMessage = 'An unexpected error occurred during registration.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        
        // If there are detailed validation errors, show them
        if (err.response.data.details) {
          const details = err.response.data.details;
          const detailMessages = Object.values(details).filter(Boolean);
          if (detailMessages.length > 0) {
            errorMessage += '\n' + detailMessages.join('\n');
          }
        }
      } else if (err.message) {
        errorMessage = `Network error: ${err.message}`;
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Unable to connect to server. Please check if the backend is running.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Start Your Restaurant</h1>
            <p className="mt-2 text-sm text-gray-600">Create your restaurant owner account</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SignupPage; 