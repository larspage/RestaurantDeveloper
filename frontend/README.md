# Restaurant Developer Frontend

This is the frontend application for the Restaurant Developer platform, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern UI with responsive design
- Authentication system
- Restaurant management
- Menu management
- Theme customization
- Order processing

## Tech Stack

- **Framework**: Next.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Forms**: Formik with Yup validation
- **UI Components**: Custom components with Headless UI
- **Icons**: Heroicons
- **API Client**: Axios

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/restaurant-developer.git
cd restaurant-developer/frontend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following content:
```
NEXT_PUBLIC_API_URL=http://localhost:3550
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `src/pages` - Next.js pages
- `src/components` - Reusable UI components
- `src/hooks` - Custom React hooks
- `src/utils` - Utility functions
- `src/types` - TypeScript type definitions
- `src/context` - React context providers
- `src/services` - API service functions
- `src/styles` - Global styles and Tailwind configuration
- `src/assets` - Static assets like images

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Cypress tests
- `npm run test:dev` - Open Cypress test runner
- `npm run format` - Format code with Prettier

## API Integration

The frontend communicates with the backend API using Axios. The API client is configured in `src/services/api.ts` and includes:

- Automatic token handling for authentication
- Error handling
- Request/response interceptors

## Authentication Flow

1. User logs in via the login page
2. On successful login, the API returns a JWT token
3. The token is stored in localStorage
4. The token is automatically included in subsequent API requests
5. Protected routes check for valid authentication

## Deployment

This application can be deployed to Vercel, Netlify, or any other platform that supports Next.js applications.

## License

This project is licensed under the MIT License - see the LICENSE file for details.