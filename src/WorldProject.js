import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setWorldData } from './types/actions';
import { createSelector } from 'reselect';
import styles from './WorldProject.module.css';
import './WorldProject.css';
import BackspaceLogo from './images/Backspace.png'
import SelectLogo from './images/Cursor.png';
import PlaceTile from './images/Place.png';
import PlaceLogo from './images/PlaceIcon.png';
import CharacterTile from './images/Character.png';
import CharacterLogo from './images/Character.png';
import EventTile from './images/Event.png';
import EventLogo from './images/Event.png';


const createInitialTileMap = () => {
  // 여기서는 100x100 타일맵을 예로 들겠다.
  const mapSize = 100;
  let initialMap = [];

  for (let row = 0; row < mapSize; row++) {
    let tileRow = [];
    for (let col = 0; col < mapSize; col++) {
      // 각 타일의 기본 상태를 설정
      tileRow.push({
        place: null, // Keep as is, since only one place is allowed per tile
        characters: [], // Change to support multiple characters
        events: [], // Change to support multiple events
      });
    }
    initialMap.push(tileRow);
  }

  return initialMap;
};

const WorldProject = () => {
  const tileWidth = 40;
  const tileHeight = 40;

  const { name } = useParams();
  const dispatch = useDispatch();

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  // Replace local state with Redux state
  const worldData = useSelector(state => selectWorldDataByName(state, name));
  const [activeTab, setActiveTab] = useState('Map');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({ name: '', description: '' });

  const handleMouseDown = (e) => {
    if (e.button === 0 && selectedOption === 'Place') {
      const tileContainer = document.querySelector('.tileMap-container');
      const rect = tileContainer.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.
  
      setSelectionStart({ x, y });
      setIsDragging(true);
    }
    if (e.button === 2 && selectedOption === 'Select') {
      setIsDragging(true);
      setStartX(e.clientX);
      setStartY(e.clientY);
    }
    e.preventDefault(); // Prevent default right-click menu
  };
  
  const handleMouseMove = (e) => {
    if (isDragging && selectedOption === 'Place') {
      const tileContainer = document.querySelector('.tileMap-container');
      const rect = tileContainer.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.
  
      setSelectionEnd({ x, y });
    }
    if (isDragging && selectedOption === 'Select') {
      const tileContainer = document.querySelector('.tileMap-container');
      tileContainer.scrollBy(startX - (e.clientX), startY - (e.clientY));
      setStartX(e.clientX);
      setStartY(e.clientY);
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging && selectedOption === 'Place') {
      // Calculate the tiles within the selection bounds and update them
      applyPlaceToSelectedTiles();
    }
    setIsDragging(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleTabClick = (modeName) => {
    setActiveTab(modeName);
    // 여기서 추가적으로 탭에 따른 데이터 로딩 등의 로직을 구현할 수 있다.
  };

  const handleOptionClick = (optionName) => {
    setSelectedOption(optionName);
    // Remove previous cursor class from tileMapContainer if any
    const tileContainer = document.querySelector('.tileMap-container');
    tileContainer.classList.remove('selectCursor', 'placeCursor', 'characterCursor', 'eventCursor');

    // Add the corresponding cursor class based on the selected option
    switch(optionName) {
      case 'Select':
        tileContainer.classList.add('selectCursor');
        break;
      case 'Place':
        tileContainer.classList.add('placeCursor');
        break;
      case 'Character':
        tileContainer.classList.add('characterCursor');
        break;
      case 'Event':
        tileContainer.classList.add('eventCursor');
        break;
      default:
        break; // No default action
    }
  };

  const applyPlaceToSelectedTiles = () => {
    if (!selectionStart || !selectionEnd) return;
  
    const startCol = Math.floor(Math.min(selectionStart.x, selectionEnd.x) / tileWidth);
    const endCol = Math.floor(Math.max(selectionStart.x, selectionEnd.x) / tileWidth);
    const startRow = Math.floor(Math.min(selectionStart.y, selectionEnd.y) / tileHeight);
    const endRow = Math.floor(Math.max(selectionStart.y, selectionEnd.y) / tileHeight);
  
    const updatedMap = tileMap.map((row, rowIndex) => {
      if (rowIndex >= startRow && rowIndex <= endRow) {
        return row.map((tile, colIndex) => {
          if (colIndex >= startCol && colIndex <= endCol) {
            return { ...tile, place: { name: 'New Place', details: 'Added via Drag' } }; // Update as necessary
          }
          return tile;
        });
      }
      return row;
    });
  
    setTileMap(updatedMap);
  };
  

  

  const handleTileDoubleClick = (rowIndex, tileIndex) => {
    const tile = tileMap[rowIndex][tileIndex];
    setSelectedTileDetails(tile); // Now includes all characters and events
    setDetailPopupVisible(true);
  };

  const addCharacterOrEvent = (type, rowIndex, tileIndex, newItem) => {
    setTileMap(currentMap => {
      const newMap = [...currentMap];
      const tile = newMap[rowIndex][tileIndex];
      if (!tile[type].find(item => item.name === newItem.name)) {
        tile[type].push({ ...newItem });
      }
      return newMap;
    });
  };

  const handleTileClick = (rowIndex, tileIndex) => {
    setTileMap((currentMap) => {
      // 현재 타일맵의 깊은 복사본을 생성하여 불변성을 유지
      const newMap = JSON.parse(JSON.stringify(currentMap));
      const tile = newMap[rowIndex][tileIndex];
      const newItem = {
        name: 'Unique Name', // This should be dynamically generated or input by the user
      };
      
      switch (selectedOption) {
        case 'Place':
          // Place 옵션이 선택되었을 때만 빈 타일에 배치 가능
          if (!tile.place && !isDragging) {
            tile.place = { name: 'New Place', details: 'Place Details' };
          }
          break;
        case 'Character':
          if (tileMap[rowIndex][tileIndex].place) {
            addCharacterOrEvent('characters', rowIndex, tileIndex, newItem);
          }
          break;
        case 'Event':
          if (tileMap[rowIndex][tileIndex].place) {
            addCharacterOrEvent('events', rowIndex, tileIndex, newItem);
          }
          break;
        default:
          // 기본 커서(Select)는 상세정보 팝업을 띄우는 역할
          if (tile.place || tile.character || tile.event) {
            setDetailPopupVisible(true);
            setSelectedTileDetails({ ...tile });
          }
          break;
      }
      
      return newMap; // 업데이트된 타일맵 상태를 반환
      
    });
  };

  useEffect(() => {
    setTileMap(createInitialTileMap());
    if (!worldData) {
      // Fetch world data only if it's not already available in the Redux store
      const fetchWorldData = async () => {
        try {
          const response = await axios.get(`/api/worlds/${name}`);
          dispatch(setWorldData(response.data)); // Dispatch action to set world data in the store
        } catch (error) {
          console.error("Error fetching world data", error);
        }
      };
      fetchWorldData();
    }
  }, [name, dispatch]);

  return (
    <div className='unselectable'>
      <div className="back">
          <button
            className={`${styles.backspaceButton}`}>
            <img src={BackspaceLogo} alt="Backspace" className={styles.backspaceButtonIcon}/>
          </button>
      </div>
      <div className="tabs">
        {['Map', 'State', 'System'].map((mode) => (
          
          <button
            key={mode}
            className={`
            ${styles.modeButton} 
            ${activeTab === mode ? styles.modeButtonClicked : ''}`}
            onClick={() => handleTabClick(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="options">
          <button
            key="Select"
            className={`
            ${styles.optionButton} 
            ${selectedOption === 'Select' ? styles.optionButtonClicked : ''}`}
            onClick={() => handleOptionClick('Select')}
          >
            <img src={SelectLogo} alt="Select" className={styles.selectButtonIcon}/> Select
          </button>
          <button
            key="Place"
            className={`
            ${styles.optionButton} 
            ${selectedOption === 'Place' ? styles.optionButtonClicked : ''}`}
            onClick={() => handleOptionClick('Place')}
          >
            <img src={PlaceLogo} alt="Place" className={styles.placeButtonIcon}/> Place
          </button>
          <button
            key="Character"
            className={`
            ${styles.optionButton} 
            ${selectedOption === 'Character' ? styles.optionButtonClicked : ''}`}
            onClick={() => handleOptionClick('Character')}
          >
            <img src={CharacterLogo} alt="Character" className={styles.characterButtonIcon}/> Character
          </button>
          <button
            key="Event"
            className={`
            ${styles.optionButton} 
            ${selectedOption === 'Event' ? styles.optionButtonClicked : ''}`}
            onClick={() => handleOptionClick('Event')}
          >
            <img src={EventLogo} alt="Event" className={styles.eventButtonIcon}/> Event
          </button>
      </div>
  <div 
      className={`tileMap-container ${styles.tileMapContainer}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()} // Prevent the context menu from showing on right-click
  >
      <div className={`tileMap ${styles.tileMap}`}>
        {tileMap.map((row, rowIndex) => (
          <div key={rowIndex} className={`tile-row ${styles.tile-row}`}>
          {row.map((tile, tileIndex) => (
            <div
              key={tileIndex}
              className={`tile ${styles.tile}`} // Use module CSS for base styling
              onClick={() => handleTileClick(rowIndex, tileIndex)}
              onDoubleClick={() => handleTileDoubleClick(rowIndex, tileIndex)}
            >
              {/* Temporary visual indicator */}
              {tile.place && <img src={PlaceTile} alt="Place" className={styles.placeTileImage} />}
              {tile.characters.length > 0 && <img src={CharacterTile} alt="Character" className={`${styles.characterTileImage} ${styles.overlay}`} />}
              {tile.events.length > 0 && <img src={EventTile} alt="Event" className={`${styles.eventTileImage} ${styles.overlay}`} />}
            </div>
          ))}
      </div>
    ))}
  </div>

        {isDetailPopupVisible && (
          <div className="detail-popup">
            <h2>Tile Details</h2>
            <p>Name (Place): {selectedTileDetails.place?.name || 'N/A'}</p>
            <p>Description (Place): {selectedTileDetails.place?.details || 'N/A'}</p>
            <h3>Characters:</h3>
            {selectedTileDetails.characters?.map((char, index) => (
              <div key={index}>
                <p>Name: {char.name}</p>
                <p>Description: {char.details}</p>
              </div>
            ))}
            <h3>Events:</h3>
            {selectedTileDetails.events?.map((event, index) => (
              <div key={index}>
                <p>Name: {event.name}</p>
                <p>Description: {event.details}</p>
              </div>
            ))}
            <button onClick={() => setDetailPopupVisible(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default WorldProject;
