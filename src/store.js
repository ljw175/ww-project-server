import { configureStore } from '@reduxjs/toolkit';
import worldReducer from './types/reducers';

export default configureStore({
  reducer: {
    world: worldReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(/* other middlewares */),
});
