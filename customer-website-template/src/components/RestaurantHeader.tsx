import React from 'react';
import { Restaurant } from '../types/Restaurant';

interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant }) => {
  const formatHours = (hours: any) => {
    if (!hours) return null;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = hours[today.toLowerCase()];
    
    if (!todayHours) return null;
    
    if (todayHours.closed) {
      return `Closed today`;
    }
    
    return `Open today: ${todayHours.open} - ${todayHours.close}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{restaurant.name}</h1>
          
          {restaurant.description && (
            <p className="text-xl md:text-2xl text-blue-100 mb-6 max-w-3xl mx-auto leading-relaxed">
              {restaurant.description}
            </p>
          )}
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-blue-100">
            {restaurant.phone && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{restaurant.phone}</span>
              </div>
            )}
            
            {restaurant.address && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{restaurant.address}</span>
              </div>
            )}
            
            {restaurant.hours && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatHours(restaurant.hours)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader; 