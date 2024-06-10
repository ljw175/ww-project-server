import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setWorldData } from './types/actions';
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
import TileSelected from './images/TileSelected.png';

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
  const [selectedTile, setSelectedTile] = useState({ rowIndex: null, tileIndex: null });
  const [copiedTile, setCopiedTile] = useState(null);
  const [detailPopupPosition, setDetailPopupPosition] = useState({ top: 0, left: 0 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tileMap, setTileMap] = useState(createInitialTileMap());

  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  const worldData = useSelector(state => selectWorldDataByName(state, name));
  const [activeTab, setActiveTab] = useState('Map');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({ name: '', description: '' });

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
      setDetailPopupVisible(false); // Hide detail popup when changing mode
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

  const handleTileRightClick = (e, rowIndex, tileIndex) => {
    e.preventDefault();
    if (selectedOption === 'Select' && selectedTile.rowIndex === rowIndex && selectedTile.tileIndex === tileIndex) {
      setDetailPopupPosition({ top: e.clientY, left: e.clientX });
      const tile = tileMap[rowIndex][tileIndex];
      setSelectedTileDetails(tile);
      setDetailPopupVisible(true);
    }
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
      setDetailPopupVisible(false); // Ensure detail popup is not shown on left click
    } else {
      setDetailPopupVisible(false); // Hide detail popup when clicking another tile
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
            saveTileMap(newMap); // Save tile map to the server
          }
          break;
        case 'Character':
          if (tileMap[rowIndex][tileIndex].place) {
            addCharacterOrEvent('characters', rowIndex, tileIndex, newItem);
            saveTileMap(newMap); // Save tile map to the server
          }
          break;
        case 'Event':
          if (tileMap[rowIndex][tileIndex].place) {
            addCharacterOrEvent('events', rowIndex, tileIndex, newItem);
            saveTileMap(newMap); // Save tile map to the server
          }
          break;
        default:
          break;
      }

      return newMap;
    });
  };

  const saveTileMap = async (newMap) => {
    try {
      await axios.put(`/api/worlds/${name}`, { tileMap: newMap });
    } catch (error) {
      console.error("Error saving tile map", error);
    }
  };

  const handleDeleteTile = () => {
    if (selectedTile.rowIndex !== null && selectedTile.tileIndex !== null) {
      setTileMap(currentMap => {
        const newMap = JSON.parse(JSON.stringify(currentMap));
        const tile = newMap[selectedTile.rowIndex][selectedTile.tileIndex];
        if (tile.place || tile.characters.length > 0 || tile.events.length > 0) {
          setHistory([...history, currentMap]); // Save current state to history before deleting
          setRedoStack([]); // Clear redo stack
          tile.place = null;
          tile.characters = [];
          tile.events = [];
          saveTileMap(newMap); // Save tile map to the server
        }
        return newMap;
      });
    }
  };

  const handleCopyTile = () => {
    if (selectedTile.rowIndex !== null && selectedTile.tileIndex !== null) {
      const tile = tileMap[selectedTile.rowIndex][selectedTile.tileIndex];
      setCopiedTile({ ...tile });
    }
  };

  const handleCutTile = () => {
    if (selectedTile.rowIndex !== null && selectedTile.tileIndex !== null) {
      const tile = tileMap[selectedTile.rowIndex][selectedTile.tileIndex];
      setCopiedTile({ ...tile });
      handleDeleteTile(); // Delete the tile after copying it
    }
  };

  const handlePasteTile = () => {
    if (copiedTile && selectedTile.rowIndex !== null && selectedTile.tileIndex !== null) {
      setTileMap(currentMap => {
        const newMap = JSON.parse(JSON.stringify(currentMap));
        const tile = newMap[selectedTile.rowIndex][selectedTile.tileIndex];
        if (!tile.place && tile.characters.length === 0 && tile.events.length === 0) { // Only paste if the target tile is empty
          setHistory([...history, currentMap]); // Save current state to history before pasting
          setRedoStack([]); // Clear redo stack
          newMap[selectedTile.rowIndex][selectedTile.tileIndex] = { ...copiedTile };
          saveTileMap(newMap); // Save tile map to the server
        }
        return newMap;
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const lastState = history.pop();
      setRedoStack([...redoStack, tileMap]); // Save current state to redo stack
      setTileMap(lastState);
      setHistory(history);
      saveTileMap(lastState); // Save tile map to the server
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const lastRedoState = redoStack.pop();
      setHistory([...history, tileMap]); // Save current state to history
      setTileMap(lastRedoState);
      setRedoStack(redoStack);
      saveTileMap(lastRedoState); // Save tile map to the server
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (selectedOption === 'Select') {
      switch (e.key) {
        case 'Delete':
          handleDeleteTile();
          break;
        case 'c':
          if (e.ctrlKey) {
            handleCopyTile();
          }
          break;
        case 'x':
          if (e.ctrlKey) {
            handleCutTile();
          }
          break;
        case 'v':
          if (e.ctrlKey) {
            handlePasteTile();
          }
          break;
        case 'z':
          if (e.ctrlKey) {
            handleUndo();
          }
          break;
        case 'y':
          if (e.ctrlKey) {
            handleRedo();
          }
          break;
        default:
          break;
      }
    }
  }, [selectedOption, handleDeleteTile, handleCopyTile, handleCutTile, handlePasteTile, handleUndo, handleRedo]);

  const resetDragging = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
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
    window.addEventListener('keydown', handleKeyDown); // Add keydown event listener to the window object

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown); // Remove keydown event listener from the window object
      resetDragging();
    };
  }, [name, dispatch, handleKeyDown]);

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

  useEffect(() => {
    if (worldData.tileMap) {
      setTileMap(worldData.tileMap);
    }
  }, [worldData]);

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
                  data-row={rowIndex}
                  data-tile={tileIndex}
                  className={`${styles.tile} ${selectedTile.rowIndex === rowIndex && selectedTile.tileIndex === tileIndex ? styles.selectedTile : ''}`}
                  onClick={() => handleTileClick(rowIndex, tileIndex)}
                  onContextMenu={(e) => handleTileRightClick(e, rowIndex, tileIndex)}
                >
                  {tile.place && <img src={PlaceTile} alt="Place" className={styles.placeTileImage} />}
                  {tile.characters.length > 0 && <img src={CharacterTile} alt="Character" className={`${styles.characterTileImage} ${styles.overlay}`} />}
                  {tile.events.length > 0 && <img src={EventTile} alt="Event" className={`${styles.eventTileImage} ${styles.overlay}`} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {isDetailPopupVisible && (
        <div className={styles.detailPopup} style={{ top: detailPopupPosition.top, left: detailPopupPosition.left }}>
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
  );
};

export default WorldProject;
