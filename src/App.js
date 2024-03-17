/* eslint-disable */
// Import necessary hooks and functions from react-redux and the actions from actions.js
import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  addNewWorld, selectWorld, editSelectedWorld, deleteSelectedWorld, setButtonClickStatus
} from './types/actions'; // Assuming actions are directly exported from 'actions.js'
import HomePage from './HomePage';
import WorldProject from './WorldProject';
import './App.css';

const App = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Access state from Redux store using useSelector
  const buttonClickStatus = useSelector(state => state.buttonClickStatus);
  const worlds = useSelector(state => state.worlds);
  const selectedWorldName = useSelector(state => state.selectedWorldName);
  const isEditMode = useSelector(state => state.isEditMode);
  const worldCount = useSelector(state => state.worlds.length);

  // Local state manipulations are now replaced with dispatches to Redux actions
  const handleButtonClick = (buttonName) => {
    dispatch(setButtonClickStatus(buttonName, true));
    setTimeout(() => dispatch(setButtonClickStatus(buttonName, false)), 100);
  };

  const handleDoubleClick = (name) => {
    navigate(`/worlds/${name}`);
  };

  // Since the state management has been moved to Redux, there's no direct manipulation of states like `setWorlds` or `setWorldCount` here.
  // Any action that modifies these states should dispatch an appropriate action to the Redux store.

  return (
      <div>
        <Routes>
          <Route 
            path="/" 
            element={<HomePage 
            buttonClickStatus={buttonClickStatus}
            worldCount={worldCount} 
            selectedWorldName={selectedWorldName}
            isEditMode={isEditMode}
            handleButtonClick={handleButtonClick}
            handleDoubleClick={handleDoubleClick} 
            />} />
          <Route 
            path="/worlds/:name" 
            element={<WorldProject 
            />} />
        </Routes>
      </div>
  );
}

export default App;
