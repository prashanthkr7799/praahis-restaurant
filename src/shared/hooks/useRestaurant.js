import { useContext } from 'react';
import RestaurantContext from '@shared/contexts/RestaurantContext.jsx';

// Public hook
export const useRestaurant = () => useContext(RestaurantContext);

export default useRestaurant;
