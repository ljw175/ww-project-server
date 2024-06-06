import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setWorldData, updateTime } from './types/actions';
import { createSelector } from 'reselect';
import styles from './WorldProject.module.css';
import './WorldProject.css';
import BackspaceLogo from './images/Backspace.png';
import SelectLogo from './images/Cursor.png';
import PlaceTile from './images/Place.png';
import PlaceLogo from './images/PlaceIcon.png';
import CharacterTile from './images/Character.png';
import CharacterLogo from './images/Character.png';
import EventTile from './images/Event.png';
import EventLogo from './images/Event.png';
import TileSelected from './images/TileSelected.png';  // Add this import

const createInitialTileMap = () => {
  const mapSize = 100;
  let initialMap = [];

  for (let row = 0; row < mapSize; row++) {
    let tileRow = [];
    for (let col = 0; col < mapSize; col++) {
      tileRow.push({
        place: null,
        characters: [],
        events: [],
      });
    }
    initialMap.push(tileRow);
  }

  return initialMap;
};

const WorldProject = () => {
  const { name } = useParams();
  const dispatch = useDispatch();

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const isDraggingRef = useRef(isDragging);
  const [selectedTile, setSelectedTile] = useState({ rowIndex: null, tileIndex: null });  // Add this state

  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  const worldData = useSelector(state => selectWorldDataByName(state, name));
  const [activeTab, setActiveTab] = useState('Map');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({ name: '', description: '' });
  const time = useSelector(state => state.world.time);

  const handleMouseDown = (e) => {
    if (e.button === 2 && selectedOption === 'Select') {
      setIsDragging(true);
      isDraggingRef.current = true;
      setStartX(e.clientX);
      setStartY(e.clientY);
    }
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current && selectedOption === 'Select') {
      const tileContainer = document.querySelector('.tileMap-container');
      tileContainer.scrollBy(startX - e.clientX, startY - e.clientY);
      setStartX(e.clientX);
      setStartY(e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      isDraggingRef.current = false;
    }
  };

  const handleTabClick = (modeName) => {
    setActiveTab(modeName);
    resetDragging();
  };

  const handleOptionClick = (optionName) => {
    setSelectedOption(optionName);
    const tileContainer = document.querySelector('.tileMap-container');
    tileContainer.classList.remove('selectCursor', 'placeCursor', 'characterCursor', 'eventCursor');

    if (optionName !== 'Select') {
      setSelectedTile({ rowIndex: null, tileIndex: null }); // Clear selected tile when changing mode
    }

    switch (optionName) {
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
        break;
    }
  };

  const handleTileDoubleClick = (rowIndex, tileIndex) => {
    const tile = tileMap[rowIndex][tileIndex];
    setSelectedTileDetails(tile);
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
    if (selectedOption === 'Select') {
      setSelectedTile({ rowIndex, tileIndex });
    }

    setTileMap((currentMap) => {
      const newMap = JSON.parse(JSON.stringify(currentMap));
      const tile = newMap[rowIndex][tileIndex];
      const newItem = {
        name: 'Unique Name',
      };

      switch (selectedOption) {
        case 'Place':
          if (!tile.place && !isDraggingRef.current) {
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
          if (tile.place || tile.character || tile.event) {
            setDetailPopupVisible(true);
            setSelectedTileDetails({ ...tile });
          }
          break;
      }

      return newMap;
    });
  };

  const handleMovePlayer = (newPosition) => {
    dispatch(updateTime(time + 1)); // Increment time on player move
    // Additional logic to check for events based on the new position and time
  };

  const resetDragging = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    setTileMap(createInitialTileMap());
    if (!worldData) {
      const fetchWorldData = async () => {
        try {
          const response = await axios.get(`/api/worlds/${name}`);
          dispatch(setWorldData(response.data));
        } catch (error) {
          console.error("Error fetching world data", error);
        }
      };
      fetchWorldData();
    }

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      resetDragging();
    };
  }, [name, dispatch]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);

  return (
    <div className='unselectable'>
      <div className="back">
        <button className={`${styles.backspaceButton}`}>
          <img src={BackspaceLogo} alt="Backspace" className={styles.backspaceButtonIcon} />
        </button>
      </div>
      <div className="tabs">
        {['Map', 'State', 'System'].map((mode) => (
          <button
            key={mode}
            className={`${styles.modeButton} ${activeTab === mode ? styles.modeButtonClicked : ''}`}
            onClick={() => handleTabClick(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="options">
        <button
          key="Select"
          className={`${styles.optionButton} ${selectedOption === 'Select' ? styles.optionButtonClicked : ''}`}
          onClick={() => handleOptionClick('Select')}
        >
          <img src={SelectLogo} alt="Select" className={styles.selectButtonIcon} /> Select
        </button>
        <button
          key="Place"
          className={`${styles.optionButton} ${selectedOption === 'Place' ? styles.optionButtonClicked : ''}`}
          onClick={() => handleOptionClick('Place')}
        >
          <img src={PlaceLogo} alt="Place" className={styles.placeButtonIcon} /> Place
        </button>
        <button
          key="Character"
          className={`${styles.optionButton} ${selectedOption === 'Character' ? styles.optionButtonClicked : ''}`}
          onClick={() => handleOptionClick('Character')}
        >
          <img src={CharacterLogo} alt="Character" className={styles.characterButtonIcon} /> Character
        </button>
        <button
          key="Event"
          className={`${styles.optionButton} ${selectedOption === 'Event' ? styles.optionButtonClicked : ''}`}
          onClick={() => handleOptionClick('Event')}
        >
          <img src={EventLogo} alt="Event" className={styles.eventButtonIcon} /> Event
        </button>
      </div>
      <div
        className={`tileMap-container ${styles.tileMapContainer}`}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className={`tileMap ${styles.tileMap}`}>
          {tileMap.map((row, rowIndex) => (
            <div key={rowIndex} className={`tile-row ${styles.tileRow}`}>
              {row.map((tile, tileIndex) => (
                <div
                  key={tileIndex}
                  className={`${styles.tile} ${selectedTile.rowIndex === rowIndex && selectedTile.tileIndex === tileIndex ? styles.selectedTile : ''}`}
                  onClick={() => handleTileClick(rowIndex, tileIndex)}
                  onDoubleClick={() => handleTileDoubleClick(rowIndex, tileIndex)}
                >
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
