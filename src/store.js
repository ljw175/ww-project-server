import { configureStore } from '@reduxjs/toolkit';
import worldReducer from './types/reducers'; // Ensure this path matches the location of your reducer file

export default configureStore({
  reducer: {
    world: worldReducer,
  },
});