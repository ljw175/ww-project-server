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
        place: null, // Place type unset initially
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

  const [selectedTile, setSelectedTile] = useState({ rowIndex: null, tileIndex: null });
  const [copiedTile, setCopiedTile] = useState(null);
  const [detailPopupPosition, setDetailPopupPosition] = useState({ top: 0, left: 0 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [placeTypes, setPlaceTypes] = useState([{ name: 'Void', color: '#d9d9d9', script: '', activateWithEvent: false }]);
  const [selectedPlaceType, setSelectedPlaceType] = useState(null);
  const [showPlaceSelectionWindow, setShowPlaceSelectionWindow] = useState(false);

  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  const worldData = useSelector(state => selectWorldDataByName(state, name));
  const [activeTab, setActiveTab] = useState('Map');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({ name: '', description: '' });
  const [stateSubTab, setStateSubTab] = useState('Place');

  const handleMouseDown = (e, rowIndex = null, tileIndex = null) => {
    if (e.button === 0 && selectedOption === 'Select' && rowIndex !== null && tileIndex !== null) {
      setSelectedTile({ rowIndex, tileIndex });
    }
    e.preventDefault();
  };

  const handleTabClick = (modeName) => {
    setActiveTab(modeName);
    setSelectedOption('Select'); // Reset option to Select
    setShowPlaceSelectionWindow(false); // Hide the place selection window when switching tabs
    if (modeName === 'State') {
      setStateSubTab('Place'); // Default to 'Place' sub-tab when entering 'State' tab
    }
  };

  const handleOptionClick = (optionName) => {
    setSelectedOption(optionName);
    const tileContainer = document.querySelector('.tileMap-container');
    tileContainer.classList.remove('selectCursor', 'placeCursor', 'characterCursor', 'eventCursor');

    switch (optionName) {
      case 'Select':
        tileContainer.classList.add('selectCursor');
        setShowPlaceSelectionWindow(false);
        break;
      case 'Place':
        tileContainer.classList.add('placeCursor');
        setShowPlaceSelectionWindow(true);
        setSelectedPlaceType(placeTypes.length > 1 ? placeTypes[1] : placeTypes[0]); // Default to first user-created type or 'Void'
        break;
      case 'Character':
        tileContainer.classList.add('characterCursor');
        setShowPlaceSelectionWindow(false);
        break;
      case 'Event':
        tileContainer.classList.add('eventCursor');
        setShowPlaceSelectionWindow(false);
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
          if (!tile.place) {
            tile.place = selectedPlaceType || { name: 'Void', color: '#d9d9d9', script: '', activateWithEvent: false }; // Set the selected place type
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
          tile.place = null; // Unset place type
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

  const handleAddPlace = () => {
    const newPlaceType = {
      name: `New Type ${placeTypes.length}`,
      color: '#ffffff',
      script: '',
      activateWithEvent: false,
    };
    setPlaceTypes([...placeTypes, newPlaceType]);
  };

  const handlePlaceTypeClick = (placeType) => {
    setSelectedPlaceType(placeType);
  };

  const handlePlaceTypeChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const updatedPlaceTypes = [...placeTypes];
    updatedPlaceTypes[index] = {
      ...updatedPlaceTypes[index],
      [name]: type === 'checkbox' ? checked : value,
    };
    setPlaceTypes(updatedPlaceTypes);
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

    window.addEventListener('keydown', handleKeyDown); // Add keydown event listener to the window object

    return () => {
      window.removeEventListener('keydown', handleKeyDown); // Remove keydown event listener from the window object
    };
  }, [name, dispatch, handleKeyDown]);

  useEffect(() => {
    if (worldData?.tileMap) {
      setTileMap(worldData.tileMap);
    }
  }, [worldData?.tileMap]);

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
      {activeTab === 'Map' && (
        <>
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
          {selectedOption === 'Place' && showPlaceSelectionWindow && (
            <div className={`${styles.placeSelectionWindow}`}>
              {placeTypes.map((placeType, index) => (
                <div
                  key={index}
                  className={styles.placeTypeIcon}
                  style={{ backgroundColor: placeType.color }}
                  onClick={() => handlePlaceTypeClick(placeType)}
                  title={placeType.name}
                >
                  {placeType.name}
                </div>
              ))}
            </div>
          )}
          <div
            className={`tileMap-container ${styles.tileMapContainer}`}
            onMouseDown={(e) => handleMouseDown(e)}
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
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, tileIndex)}
                      onClick={() => handleTileClick(rowIndex, tileIndex)}
                      onContextMenu={(e) => handleTileRightClick(e, rowIndex, tileIndex)}
                      style={{ backgroundColor: tile.place ? tile.place.color : '#d9d9d9' }}
                    >
                      {tile.place && tile.place.name !== 'Void' && <img src={PlaceTile} alt="Place" className={styles.placeTileImage} />}
                      {tile.characters.length > 0 && <img src={CharacterTile} alt="Character" className={`${styles.characterTileImage} ${styles.overlay}`} />}
                      {tile.events.length > 0 && <img src={EventTile} alt="Event" className={`${styles.eventTileImage} ${styles.overlay}`} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {activeTab === 'State' && (
        <div className={`state-container ${styles.stateContainer}`}>
          <h2>State Management</h2>
          <div className="options">
            <button
              key="Place"
              className={`${styles.optionButton} ${stateSubTab === 'Place' ? styles.optionButtonClicked : ''}`}
              onClick={() => setStateSubTab('Place')}
            >
              <img src={PlaceLogo} alt="Place" className={styles.placeButtonIcon} /> Place
            </button>
            <button
              key="Character"
              className={`${styles.optionButton} ${stateSubTab === 'Character' ? styles.optionButtonClicked : ''}`}
              onClick={() => setStateSubTab('Character')}
            >
              <img src={CharacterLogo} alt="Character" className={styles.characterButtonIcon} /> Character
            </button>
            <button
              key="Event"
              className={`${styles.optionButton} ${stateSubTab === 'Event' ? styles.optionButtonClicked : ''}`}
              onClick={() => setStateSubTab('Event')}
            >
              <img src={EventLogo} alt="Event" className={styles.eventButtonIcon} /> Event
            </button>
          </div>
          {stateSubTab === 'Place' && (
            <div>
              <h3>Places</h3>
              <button onClick={handleAddPlace}>Add Place</button>
              {placeTypes.map((placeType, index) => (
                <div key={index} className="place-type">
                  <h4>{placeType.name}</h4>
                  <label>
                    Name:
                    <input
                      type="text"
                      name="name"
                      value={placeType.name}
                      onChange={(e) => handlePlaceTypeChange(e, index)}
                    />
                  </label>
                  <label>
                    Color:
                    <input
                      type="color"
                      name="color"
                      value={placeType.color}
                      onChange={(e) => handlePlaceTypeChange(e, index)}
                    />
                  </label>
                  <label>
                    Script:
                    <textarea
                      name="script"
                      value={placeType.script}
                      onChange={(e) => handlePlaceTypeChange(e, index)}
                    />
                  </label>
                  <label>
                    Activate with Event:
                    <input
                      type="checkbox"
                      name="activateWithEvent"
                      checked={placeType.activateWithEvent}
                      onChange={(e) => handlePlaceTypeChange(e, index)}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
          {stateSubTab === 'Character' && (
            <div>
              <h3>Characters</h3>
              <button>Add Character</button>
              {/* List and manage characters here */}
            </div>
          )}
          {stateSubTab === 'Event' && (
            <div>
              <h3>Events</h3>
              <button>Add Event</button>
              {/* List and manage events here */}
            </div>
          )}
        </div>
      )}
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
