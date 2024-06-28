import React, { useEffect, useState, useCallback } from 'react';
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

const generateUniqueName = (existingNames, baseName = "Name") => {
  let counter = 1;
  let newName = `${baseName}${counter}`;
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName}${counter}`;
  }
  return newName;
};

const WorldProject = () => {
  const { name } = useParams();
  const dispatch = useDispatch();

  const [selectedTile, setSelectedTile] = useState({ rowIndex: null, tileIndex: null });
  const [detailPopupPosition, setDetailPopupPosition] = useState({ top: 0, left: 0 });
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({});
  const [activeTab, setActiveTab] = useState('Map');
  const [selectedOption, setSelectedOption] = useState('Select');

  // State for managing place types, characters, and events
  const [placeTypes, setPlaceTypes] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [events, setEvents] = useState([]);

  // State for form inputs
  const [newPlaceType, setNewPlaceType] = useState({ name: '', color: '#ffffff', script: '', activateWithEvent: false });
  const [newCharacter, setNewCharacter] = useState({ name: '', details: '' });
  const [newEvent, setNewEvent] = useState({ name: '', details: '' });

  // State for editing
  const [editingPlaceType, setEditingPlaceType] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  const worldData = useSelector(state => selectWorldDataByName(state, name));

  const handleMouseDown = (e, rowIndex = null, tileIndex = null) => {
    if (e.button === 0 && selectedOption === 'Select' && rowIndex !== null && tileIndex !== null) {
      setSelectedTile({ rowIndex, tileIndex });
    }
    e.preventDefault();
  };

  const handleTabClick = (modeName) => {
    setActiveTab(modeName);
    if (modeName === 'State') {
      setSelectedOption('Place'); // Default to 'Place' management when opening 'State' tab
    } else {
      setSelectedOption('Select');
    }
    setSelectedTile({ rowIndex: null, tileIndex: null });
  };

  const handleOptionClick = (optionName) => {
    setSelectedOption(optionName);
    setSelectedTile({ rowIndex: null, tileIndex: null });
    const tileContainer = document.querySelector('.tileMap-container');

    if (!tileContainer) return;

    tileContainer.classList.remove('selectCursor', 'placeCursor', 'characterCursor', 'eventCursor');

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

  const handleTileClick = (rowIndex, tileIndex) => {
    if (selectedOption === 'Select') {
      setSelectedTile({ rowIndex, tileIndex });
      setDetailPopupVisible(false);
    } else {
      setDetailPopupVisible(false);
    }

    setTileMap((currentMap) => {
      const newMap = JSON.parse(JSON.stringify(currentMap));
      const tile = newMap[rowIndex][tileIndex];
      const newItem = {
        name: generateUniqueName([]),
      };

      switch (selectedOption) {
        case 'Place':
          if (!tile.place) {
            tile.place = { name: 'Void', color: '#ffffff', script: '', activateWithEvent: false };
          }
          break;
        case 'Character':
          if (tileMap[rowIndex][tileIndex].place) {
            tile.characters.push(newItem);
          }
          break;
        case 'Event':
          if (tileMap[rowIndex][tileIndex].place) {
            tile.events.push(newItem);
          }
          break;
        default:
          break;
      }

      return newMap;
    });
  };

  const handleAddPlaceType = () => {
    const name = newPlaceType.name.trim() || generateUniqueName(placeTypes.map(pt => pt.name));
    const newType = { ...newPlaceType, name };
    if (editingPlaceType !== null) {
      handleUpdatePlaceType(newType);
      return;
    }
    setPlaceTypes([...placeTypes, newType]);
    setNewPlaceType({ name: '', color: '#ffffff', script: '', activateWithEvent: false });
  };

  const handleEditPlaceType = (index) => {
    setEditingPlaceType(index);
    setNewPlaceType(placeTypes[index]);
  };

  const handleUpdatePlaceType = (updatedType) => {
    const updatedPlaceTypes = [...placeTypes];
    updatedPlaceTypes[editingPlaceType] = updatedType || { ...newPlaceType };
    setPlaceTypes(updatedPlaceTypes);
    setNewPlaceType({ name: '', color: '#ffffff', script: '', activateWithEvent: false });
    setEditingPlaceType(null);
  };

  const handleDeletePlaceType = (index) => {
    const updatedPlaceTypes = [...placeTypes];
    updatedPlaceTypes.splice(index, 1);
    setPlaceTypes(updatedPlaceTypes);
  };

  const handleAddCharacter = () => {
    const name = newCharacter.name.trim() || generateUniqueName(characters.map(c => c.name));
    const newChar = { ...newCharacter, name };
    if (editingCharacter !== null) {
      handleUpdateCharacter(newChar);
      return;
    }
    setCharacters([...characters, newChar]);
    setNewCharacter({ name: '', details: '' });
  };

  const handleEditCharacter = (index) => {
    setEditingCharacter(index);
    setNewCharacter(characters[index]);
  };

  const handleUpdateCharacter = (updatedCharacter) => {
    const updatedCharacters = [...characters];
    updatedCharacters[editingCharacter] = updatedCharacter || { ...newCharacter };
    setCharacters(updatedCharacters);
    setNewCharacter({ name: '', details: '' });
    setEditingCharacter(null);
  };

  const handleDeleteCharacter = (index) => {
    const updatedCharacters = [...characters];
    updatedCharacters.splice(index, 1);
    setCharacters(updatedCharacters);
  };

  const handleAddEvent = () => {
    const name = newEvent.name.trim() || generateUniqueName(events.map(e => e.name));
    const newEvt = { ...newEvent, name };
    if (editingEvent !== null) {
      handleUpdateEvent(newEvt);
      return;
    }
    setEvents([...events, newEvt]);
    setNewEvent({ name: '', details: '' });
  };

  const handleEditEvent = (index) => {
    setEditingEvent(index);
    setNewEvent(events[index]);
  };

  const handleUpdateEvent = (updatedEvent) => {
    const updatedEvents = [...events];
    updatedEvents[editingEvent] = updatedEvent || { ...newEvent };
    setEvents(updatedEvents);
    setNewEvent({ name: '', details: '' });
    setEditingEvent(null);
  };

  const handleDeleteEvent = (index) => {
    const updatedEvents = [...events];
    updatedEvents.splice(index, 1);
    setEvents(updatedEvents);
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
  }, [name, dispatch]);

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
          {selectedOption === 'Place' && (
            <div>
              <h3>Place Types</h3>
              {placeTypes.map((placeType, index) => (
                <div key={index}>
                  <label>
                    Name:
                    <input
                      type="text"
                      value={editingPlaceType === index ? newPlaceType.name : placeType.name}
                      onChange={(e) => {
                        if (editingPlaceType === index) {
                          setNewPlaceType({ ...newPlaceType, name: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditPlaceType(index)}
                    />
                  </label>
                  <label>
                    Color:
                    <input
                      type="color"
                      value={editingPlaceType === index ? newPlaceType.color : placeType.color}
                      onChange={(e) => {
                        if (editingPlaceType === index) {
                          setNewPlaceType({ ...newPlaceType, color: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditPlaceType(index)}
                    />
                  </label>
                  <label>
                    Script:
                    <textarea
                      value={editingPlaceType === index ? newPlaceType.script : placeType.script}
                      onChange={(e) => {
                        if (editingPlaceType === index) {
                          setNewPlaceType({ ...newPlaceType, script: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditPlaceType(index)}
                    />
                  </label>
                  <label>
                    Activate with Event:
                    <input
                      type="checkbox"
                      checked={editingPlaceType === index ? newPlaceType.activateWithEvent : placeType.activateWithEvent}
                      onChange={(e) => {
                        if (editingPlaceType === index) {
                          setNewPlaceType({ ...newPlaceType, activateWithEvent: e.target.checked });
                        }
                      }}
                      onFocus={() => handleEditPlaceType(index)}
                    />
                  </label>
                  {editingPlaceType === index && <button onClick={handleUpdatePlaceType}>Save</button>}
                  <button onClick={() => handleDeletePlaceType(index)}>Delete</button>
                </div>
              ))}
              <button onClick={handleAddPlaceType}>{editingPlaceType !== null ? 'Update' : 'Add'} Place Type</button>
            </div>
          )}
          {selectedOption === 'Character' && (
            <div>
              <h3>Characters</h3>
              {characters.map((character, index) => (
                <div key={index}>
                  <label>
                    Name:
                    <input
                      type="text"
                      value={editingCharacter === index ? newCharacter.name : character.name}
                      onChange={(e) => {
                        if (editingCharacter === index) {
                          setNewCharacter({ ...newCharacter, name: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditCharacter(index)}
                    />
                  </label>
                  <label>
                    Details:
                    <textarea
                      value={editingCharacter === index ? newCharacter.details : character.details}
                      onChange={(e) => {
                        if (editingCharacter === index) {
                          setNewCharacter({ ...newCharacter, details: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditCharacter(index)}
                    />
                  </label>
                  {editingCharacter === index && <button onClick={handleUpdateCharacter}>Save</button>}
                  <button onClick={() => handleDeleteCharacter(index)}>Delete</button>
                </div>
              ))}
              <button onClick={handleAddCharacter}>{editingCharacter !== null ? 'Update' : 'Add'} Character</button>
            </div>
          )}
          {selectedOption === 'Event' && (
            <div>
              <h3>Events</h3>
              {events.map((event, index) => (
                <div key={index}>
                  <label>
                    Name:
                    <input
                      type="text"
                      value={editingEvent === index ? newEvent.name : event.name}
                      onChange={(e) => {
                        if (editingEvent === index) {
                          setNewEvent({ ...newEvent, name: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditEvent(index)}
                    />
                  </label>
                  <label>
                    Details:
                    <textarea
                      value={editingEvent === index ? newEvent.details : event.details}
                      onChange={(e) => {
                        if (editingEvent === index) {
                          setNewEvent({ ...newEvent, details: e.target.value });
                        }
                      }}
                      onFocus={() => handleEditEvent(index)}
                    />
                  </label>
                  {editingEvent === index && <button onClick={handleUpdateEvent}>Save</button>}
                  <button onClick={() => handleDeleteEvent(index)}>Delete</button>
                </div>
              ))}
              <button onClick={handleAddEvent}>{editingEvent !== null ? 'Update' : 'Add'} Event</button>
            </div>
          )}
        </div>
      )}
      {isDetailPopupVisible && (
        <div className={styles.detailPopup} style={{ top: detailPopupPosition.top, left: detailPopupPosition.left }}>
          <h2>Tile Details</h2>
          <p>Place Type: {selectedTileDetails.place?.name || 'N/A'}</p>
          <h3>Characters:</h3>
          {selectedTileDetails.characters?.length > 0 ? (
            selectedTileDetails.characters.map((char, index) => (
              <p key={index}>{index + 1}. {char.name}</p>
            ))
          ) : (
            <p>No characters</p>
          )}
          <h3>Events:</h3>
          {selectedTileDetails.events?.length > 0 ? (
            selectedTileDetails.events.map((event, index) => (
              <p key={index}>{event.name}</p>
            ))
          ) : (
            <p>No events</p>
          )}
          <button onClick={() => setDetailPopupVisible(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default WorldProject;
