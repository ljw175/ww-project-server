/* eslint-disable */
import React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import WorldProject from './WorldProject';
import './App.css';

const App = () => {
  const navigate = useNavigate();

  const handleDoubleClick = (name) => {
    navigate(`/worlds/${name}`);
  };

  return (
    <div>
      <Routes>
        <Route 
          path="/" 
          element={<HomePage handleDoubleClick={handleDoubleClick} />} />
        <Route 
          path="/worlds/:name" 
          element={<WorldProject />} />
      </Routes>
    </div>
  );
}

export default App;
