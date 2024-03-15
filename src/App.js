/* eslint-disable */
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import WorldProject from './WorldProject';
import styles from './App.module.css';
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

  const addNewWorld = () => {
      const newWorld = {
          id: worldCount + 1,
          name: 'New World',
          lastEdit: 'No history of edit',
          page: '0 Page',
      };
      setWorlds([...worlds, newWorld]);
      setWorldCount(worldCount + 1);
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
      <div className="unselectable">
          <div id="worldCountDisplay">{worldCount} World</div>
          <div className="container">
              <div className="main-buttons">

                  <button 
                  onClick={() => {
                    addNewWorld();
                    handleButtonClick('addNewWorld');
                }}
                  className={`${styles.addNewWorldButton} ${buttonClickStatus.addNewWorld ? styles.buttonClicked : ''}`}
                  >
                    +New
                  </button>

                  <button 
                  onClick={() => {
                    setIsEditMode(true);
                    handleButtonClick('setIsEditMode');
                }}
                  className={`${styles.editModeButton} ${buttonClickStatus.edit ? styles.buttonClicked : ''}`}
                  style={clickableButtonStyle}
                  >
                    Edit
                  </button>

                  <button 
                  onClick={() => {
                    deleteSelectedWorld();
                    handleButtonClick('deleteSelectedWorld');
                }}
                  className={`${styles.deleteWorldButton} ${buttonClickStatus.delete ? styles.buttonClicked : ''}`}
                  style={clickableButtonStyle}
                  >
                    Delete
                  </button>

              </div>
              <div id="worldContainer">
                  {worlds.map((world) => (
                      <button key={world.id} 
                      className={`world-button ${selectedWorldId === world.id ? 'worldOutline' : ''}`} 
                      onDoubleClick={handleDoubleClick}
                      onClick={() => {selectWorld(world.id)}}>
                          <div className="world-name">{world.name}</div>
                          <div className="last-date">{world.lastEdit}</div>
                          <div className="world-page">{world.page}</div>
                      </button>
                  ))}
              </div>
          </div>
          {isEditMode && selectedWorldId && (
              <input
                  type="text"
                  value={worlds.find(world => world.id === selectedWorldId)?.name || ''}
                  onChange={(e) => editSelectedWorld(e.target.value)}
                  onBlur={() => setIsEditMode(false)}
                  autoFocus
              />
          )}
      <Routes>
        <Route path="/world/:worldId" element={<WorldProject />} />
      </Routes>
      </div>
  );
}

export default App;
