import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './App.module.css';
import './App.css';

const HomePage = ({ 
  buttonClickStatus,
  worldCount, 
  selectedWorldName,
  isEditMode,
  setIsEditMode,
  handleButtonClick,
  addNewWorld,
  selectWorld, 
  editSelectedWorld,
  clickableButtonStyle,
  deleteSelectedWorld,
  handleDoubleClick }) => {
    const [worlds, setWorlds] = useState([]);

  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const response = await axios.get('/api/worlds');
        console.log(response.data); // 응답 데이터 확인
        if (Array.isArray(response.data)) {
          setWorlds(response.data);
        } else {
          console.error("Received data is not an array:", response.data);
          setWorlds([]); // 응답이 배열이 아니면 빈 배열로 설정
        }
      } catch (error) {
        console.error("Error fetching worlds", error);
      }
    };

    fetchWorlds();
  }, [worlds]);

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
                    {worlds.map(world => (
                        <button key={world.Name} 
                        onDoubleClick={() => handleDoubleClick(world.Name)}
                        onClick={() => {selectWorld(world.Name)}}
                        className={`world-button ${selectedWorldName === world.Name ? 'worldOutline' : ''}`}>
                            <div className="world-name">{world.name}</div>
                            <div className="last-date">{world.lastEdit}</div>
                            <div className="world-page">{world.page}</div>
                        </button>
                    ))}
              </div>
          </div>
          {isEditMode && selectedWorldName && (
              <input
                  type="text"
                  value={worlds.find(world => world.Name === selectedWorldName)?.name || ''}
                  onChange={(e) => editSelectedWorld(e.target.value)}
                  onBlur={() => setIsEditMode(false)}
                  autoFocus
              />
          )}
      </div>
  );
};

export default HomePage;
