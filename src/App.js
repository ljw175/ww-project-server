/* eslint-disable */
import axios from 'axios';
import React, { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import WorldProject from './WorldProject';
import './App.css';

const App = () => {
  const navigate = useNavigate(); // useNavigate 호출
  const [buttonClickStatus, setButtonClickStatus] = useState({
    addNewWorld: false,
    edit: false,
    delete: false,
    });
  const [worldCount, setWorldCount] = useState(0);
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

    // 버튼 클릭 핸들러
  const handleButtonClick = (buttonName) => {
    // 모든 버튼 상태를 false로 설정하고, 클릭된 버튼만 true로 설정
    setButtonClickStatus({ ...buttonClickStatus, [buttonName]: true });

    setTimeout(() => {
      setButtonClickStatus({ ...buttonClickStatus, [buttonName]: false });
    }, 100); // 0.1초 후 클릭된 버튼 상태를 false로 설정
  };

  const addNewWorld = async () => {
    const newWorldData = {
      name: `New World ${worldCount + 1}`,
      lastEdit: 'Just now',
      page: '1 Page',
    };
  
    try {
      const response = await axios.post('/api/worlds', newWorldData);
      const savedWorld = response.data;
      setWorlds([...worlds, savedWorld]);
      setWorldCount(worldCount + 1);
    } catch (error) {
      console.error("Error adding new world", error);
    }
  };

  const selectWorld = (id) => {
      setSelectedWorldId(id);
      if (isEditMode) {
          setIsEditMode(false);
      }
  };

  const editSelectedWorld = (newName) => {
      const updatedWorlds = worlds.map(world => {
          if (world.id === selectedWorldId) {
              return { ...world, name: newName };
          }
          return world;
      });
      setWorlds(updatedWorlds);
      setIsEditMode(false);
  };
  
  const clickableButtonStyle = {
    pointerEvents: selectedWorldId ? 'auto' : 'none',
    color: selectedWorldId ? 'black' : '#909090', // 조건에 따른 색상 변경
  };

  const deleteSelectedWorld = () => {
    const isConfirmed = window.confirm("Are you sure you want to delete this world?");
    if (isConfirmed) {
      const updatedWorlds = worlds.filter(world => world.id !== selectedWorldId);
      setWorlds(updatedWorlds);
      setWorldCount(worldCount - 1);
      setSelectedWorldId(null);
    }
  };

  const handleDoubleClick = (worldId) => {
    navigate(`/world/${worldId}`); // navigate 함수 사용
  };

  return (
      <div>
        <Routes>
          <Route 
            path="/" 
            element={<HomePage 
            buttonClickStatus={buttonClickStatus}
            worldCount={worldCount} 
            worlds={worlds}
            selectedWorldId={selectedWorldId}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            handleButtonClick={handleButtonClick}
            addNewWorld={addNewWorld}
            selectWorld={selectWorld} 
            editSelectedWorld={editSelectedWorld}
            clickableButtonStyle={clickableButtonStyle}
            deleteSelectedWorld={deleteSelectedWorld}
            handleDoubleClick={handleDoubleClick} />} />
          <Route 
            path="/world/:worldId" 
            element={<WorldProject />} />
        </Routes>
      </div>
  );
}

export default App;
