import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setWorldData, updateTime } from './types/actions';
import { createSelector } from 'reselect';
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
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
import PlayerCharacterImg from './images/PlayerCharacter.png';

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
  const contextMenuRef = useRef(null);

  const [selectedTile, setSelectedTile] = useState({ rowIndex: null, tileIndex: null });
  const [detailPopupPosition, setDetailPopupPosition] = useState({ top: 0, left: 0 });
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({});
  const [activeTab, setActiveTab] = useState('Map');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [isContextMenuVisible, setContextMenuVisible] = useState(false);
  const [isCharacterContextMenuVisible, setCharacterContextMenuVisible] = useState(false);

  const [placeTypes, setPlaceTypes] = useState([]);
  const [characters, setCharacters] = useState([{ name: 'PlayerCharacter', route: [], race: '', sex: '', age: '', personality: '', alignment: '' }]);
  const [events, setEvents] = useState([]);

  const [newPlaceType, setNewPlaceType] = useState({ name: '', color: '#ffffff', script: '', activateWithEvent: false });
  const [newCharacter, setNewCharacter] = useState({ name: '', route: [], race: '', sex: '', age: '', personality: '', alignment: '' });
  const [newEvent, setNewEvent] = useState({ name: '', triggers: [{ type: '', value: '' }], script: '' });

  const [editingPlaceType, setEditingPlaceType] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [stateData, setStateData] = useState([]);
  const [systemData, setSystemData] = useState({});

  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  const worldData = useSelector(state => selectWorldDataByName(state, name));
  const time = useSelector(state => state.world.time);

  const handleMouseDown = (e, rowIndex = null, tileIndex = null) => {
    if (e.button === 0 && selectedOption === 'Select' && rowIndex !== null && tileIndex !== null) {
      setSelectedTile({ rowIndex, tileIndex });
    }
    e.preventDefault();
  };

  const handleTabClick = (modeName) => {
    setActiveTab(modeName);
    if (modeName === 'State') {
      setSelectedOption('Place');
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
    setCharacters([...characters, newChar]);
    setNewCharacter({ name: '', route: [], race: '', sex: '', age: '', personality: '', alignment: '' });
  };

  const handleEditCharacter = (index) => {
    setEditingCharacter(index);
    setNewCharacter(characters[index]);
  };

  const handleUpdateCharacter = (updatedCharacter) => {
    const updatedCharacters = [...characters];
    updatedCharacters[editingCharacter] = updatedCharacter || { ...newCharacter };
    setCharacters(updatedCharacters);
    setNewCharacter({ name: '', route: [], race: '', sex: '', age: '', personality: '', alignment: '' });
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
    setEvents([...events, newEvt]);
    setNewEvent({ name: '', triggers: [{ type: '', value: '' }], script: '' });
  };

  const handleEditEvent = (index) => {
    setEditingEvent(index);
    setNewEvent(events[index]);
  };

  const handleUpdateEvent = (updatedEvent) => {
    const updatedEvents = [...events];
    updatedEvents[editingEvent] = updatedEvent || { ...newEvent };
    setEvents(updatedEvents);
    setNewEvent({ name: '', triggers: [{ type: '', value: '' }], script: '' });
    setEditingEvent(null);
  };

  const handleDeleteEvent = (index) => {
    const updatedEvents = [...events];
    updatedEvents.splice(index, 1);
    setEvents(updatedEvents);
  };

  const handleAddTrigger = () => {
    setNewEvent(prevState => ({
      ...prevState,
      triggers: [...prevState.triggers, { type: '', value: '' }]
    }));
  };

  const handleTriggerChange = (index, key, value) => {
    const updatedTriggers = [...newEvent.triggers];
    updatedTriggers[index][key] = value;
    setNewEvent({ ...newEvent, triggers: updatedTriggers });
  };

  const handlePlaceModeRightClick = (e) => {
    e.preventDefault();
    if (selectedOption === 'Place') {
      setContextMenuPosition({ top: e.clientY, left: e.clientX });
      setContextMenuVisible(true);
    }
  };

  const handleCharacterModeRightClick = (e) => {
    e.preventDefault();
    if (selectedOption === 'Character') {
      setContextMenuPosition({ top: e.clientY, left: e.clientX });
      setCharacterContextMenuVisible(true);
    }
  };

  const handleSelectPlaceType = (placeType) => {
    setSelectedTile((prev) => {
      if (prev.rowIndex !== null && prev.tileIndex !== null) {
        const newMap = [...tileMap];
        newMap[prev.rowIndex][prev.tileIndex].place = placeType;
        setTileMap(newMap);
      }
      return prev;
    });
    setContextMenuVisible(false);
  };

  const handleSelectCharacter = (character) => {
    setSelectedTile((prev) => {
      if (prev.rowIndex !== null && prev.tileIndex !== null) {
        const newMap = [...tileMap];
        const currentTile = newMap[prev.rowIndex][prev.tileIndex];
        if (character.name === 'PlayerCharacter') {
          for (let row = 0; row < newMap.length; row++) {
            for (let col = 0; col < newMap[row].length; col++) {
              const index = newMap[row][col].characters.findIndex(c => c.name === 'PlayerCharacter');
              if (index > -1) {
                newMap[row][col].characters.splice(index, 1);
                break;
              }
            }
          }
          currentTile.characters = [character];
        } else {
          const isDuplicate = currentTile.characters.some(c => c.name === character.name);
          if (!isDuplicate) {
            currentTile.characters.push(character);
          }
        }
        setTileMap(newMap);
      }
      return prev;
    });
    setCharacterContextMenuVisible(false);
  };

  const handleClickOutside = useCallback((e) => {
    if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
      setContextMenuVisible(false);
      setCharacterContextMenuVisible(false);
    }
  }, []);

  useEffect(() => {
    if (isContextMenuVisible || isCharacterContextMenuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isContextMenuVisible, isCharacterContextMenuVisible, handleClickOutside]);

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
      setPlaceTypes(worldData.placeTypes || []);
      setCharacters(worldData.characters || []);
      setEvents(worldData.events || []);
      setStateData(worldData.stateData || []);
      setSystemData(worldData.systemData || {});
    }
  }, [worldData?.tileMap]);

  useEffect(() => {
    const placeButton = document.querySelector(`.${styles.optionButton}[key="Place"]`);
    const characterButton = document.querySelector(`.${styles.optionButton}[key="Character"]`);

    if (placeButton) {
      placeButton.addEventListener('contextmenu', handlePlaceModeRightClick);
    }
    if (characterButton) {
      characterButton.addEventListener('contextmenu', handleCharacterModeRightClick);
    }

    return () => {
      if (placeButton) {
        placeButton.removeEventListener('contextmenu', handlePlaceModeRightClick);
      }
      if (characterButton) {
        characterButton.removeEventListener('contextmenu', handleCharacterModeRightClick);
      }
    };
  }, [selectedOption]);

  const handleTimeChange = (e) => {
    const newTime = parseInt(e.target.value, 10);
    dispatch(updateTime(newTime));
  };

  const saveWorldData = async () => {
    const worldDataToSave = {
      name,
      tileMap,
      placeTypes,
      characters,
      events,
      stateData,
      systemData,
    };

    try {
      await axios.put(`/api/worlds/${name}`, worldDataToSave);
      alert('World data saved successfully!');
    } catch (error) {
      console.error('Error saving world data', error);
      alert('Failed to save world data.');
    }
  };

  useEffect(() => {
    const editor = new EditorView({
      doc: 'console.log("Hello, World!");',
      extensions: [basicSetup, javascript(), oneDark],
      parent: document.getElementById("script-editor"),
    });
  }, []);

  return (
    <div className='unselectable'>
      <div className="back">
        <button className={`${styles.backspaceButton}`}>
          <img src={BackspaceLogo} alt="Backspace" className={styles.backspaceButtonIcon} />
        </button>
      </div>
      <div className="tabs">
        {['Map', 'Script', 'State', 'System'].map((mode) => (
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
              onContextMenu={(e) => handlePlaceModeRightClick(e)}
            >
              <img src={PlaceLogo} alt="Place" className={styles.placeButtonIcon} /> Place
            </button>
            <button
              key="Character"
              className={`${styles.optionButton} ${selectedOption === 'Character' ? styles.optionButtonClicked : ''}`}
              onClick={() => handleOptionClick('Character')}
              onContextMenu={(e) => handleCharacterModeRightClick(e)}
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
                      {tile.characters.some(c => c.name === 'PlayerCharacter') ? (
                        <img src={PlayerCharacterImg} alt="PlayerCharacter" className={`${styles.characterTileImage} ${styles.overlay}`} />
                      ) : tile.characters.length > 0 && (
                        <img src={CharacterTile} alt="Character" className={`${styles.characterTileImage} ${styles.overlay}`} />
                      )}
                      {tile.events.length > 0 && <img src={EventTile} alt="Event" className={`${styles.eventTileImage} ${styles.overlay}`} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={`time-player-bar ${styles.timePlayerBar}`}>
            <input type="range" min="0" max="100" value={time} onChange={handleTimeChange} />
            <span>{time}</span>
          </div>
          <button onClick={saveWorldData} className={styles.dataButton}>Save World</button>
        </>
      )}
      {activeTab === 'Script' && (
        <div className={`script-container ${styles.scriptContainer}`}>
          <div className={styles.scriptContent}>
            <h2 className={styles.scriptTitle}>Script Editor and Playtesting</h2>
            <div id="script-editor" className={styles.scriptEditor}></div>
            <div className={styles.scriptText}>
              <p>Welcome to the Script Editor! This is where you can edit scripts and playtest your TextRPG.</p>
              <p className={styles.scriptExample}>You wake up in a dark room. There are two doors in front of you.</p>
              <button className={styles.choiceButton}>Open the left door</button>
              <button className={styles.choiceButton}>Open the right door</button>
            </div>
          </div>
        </div>
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
            <>
              <div className={styles.dataSection}>
                <button onClick={handleAddPlaceType} className={`${styles.dataButton} ${styles.addButton}`}>Add Place Type</button>
                <h3>Place Types</h3>
                {placeTypes.map((placeType, index) => (
                  <div key={index} className={styles.dataRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.dataLabel}>
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
                          className={styles.dataInput}
                        />
                      </label>
                      <label className={styles.dataLabel}>
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
                          className={styles.colorInput}
                        />
                      </label>
                      <label className={styles.dataLabel}>
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
                          className={styles.checkboxInput}
                        />
                      </label>
                    </div>
                    <label className={styles.dataLabel}>
                      Script:
                      <textarea
                        value={editingPlaceType === index ? newPlaceType.script : placeType.script}
                        onChange={(e) => {
                          if (editingPlaceType === index) {
                            setNewPlaceType({ ...newPlaceType, script: e.target.value });
                          }
                        }}
                        onFocus={() => handleEditPlaceType(index)}
                        className={styles.dataTextarea}
                      />
                    </label>
                    {editingPlaceType === index && <button onClick={handleUpdatePlaceType} className={styles.dataButton}>Update</button>}
                    <button onClick={() => handleDeletePlaceType(index)} className={styles.dataButton}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {selectedOption === 'Character' && (
            <>
              <div className={styles.dataSection}>
                <button onClick={handleAddCharacter} className={`${styles.dataButton} ${styles.addButton}`}>Add Character</button>
                <h3>Characters</h3>
                {characters.map((character, index) => (
                  <div key={index} className={styles.dataRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.dataLabel}>
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
                          className={styles.dataInput}
                        />
                      </label>
                      <label className={styles.dataLabel}>
                        Race:
                        <input
                          type="text"
                          value={editingCharacter === index ? newCharacter.race : character.race}
                          onChange={(e) => {
                            if (editingCharacter === index) {
                              setNewCharacter({ ...newCharacter, race: e.target.value });
                            }
                          }}
                          onFocus={() => handleEditCharacter(index)}
                          className={styles.dataInput}
                        />
                      </label>
                      <label className={styles.dataLabel}>
                        Sex:
                        <select
                          value={editingCharacter === index ? newCharacter.sex : character.sex}
                          onChange={(e) => {
                            if (editingCharacter === index) {
                              setNewCharacter({ ...newCharacter, sex: e.target.value });
                            }
                          }}
                          onFocus={() => handleEditCharacter(index)}
                          className={styles.dataInput}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="None">None</option>
                          <option value="Hermaphrodite">Hermaphrodite</option>
                        </select>
                      </label>
                      <label className={styles.dataLabel}>
                        Age:
                        <input
                          type="number"
                          value={editingCharacter === index ? newCharacter.age : character.age}
                          onChange={(e) => {
                            if (editingCharacter === index) {
                              setNewCharacter({ ...newCharacter, age: e.target.value });
                            }
                          }}
                          onFocus={() => handleEditCharacter(index)}
                          className={styles.dataInput}
                        />
                      </label>
                    </div>
                    <label className={styles.dataLabel}>
                      Personality:
                      <textarea
                        value={editingCharacter === index ? newCharacter.personality : character.personality}
                        onChange={(e) => {
                          if (editingCharacter === index) {
                            setNewCharacter({ ...newCharacter, personality: e.target.value });
                          }
                        }}
                        onFocus={() => handleEditCharacter(index)}
                        className={styles.dataTextarea}
                      />
                    </label>
                    <label className={styles.dataLabel}>
                      Alignment:
                      <textarea
                        value={editingCharacter === index ? newCharacter.alignment : character.alignment}
                        onChange={(e) => {
                          if (editingCharacter === index) {
                            setNewCharacter({ ...newCharacter, alignment: e.target.value });
                          }
                        }}
                        onFocus={() => handleEditCharacter(index)}
                        className={styles.dataTextarea}
                      />
                    </label>
                    {editingCharacter === index && <button onClick={handleUpdateCharacter} className={styles.dataButton}>Update</button>}
                    <button onClick={() => handleDeleteCharacter(index)} className={styles.dataButton}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {selectedOption === 'Event' && (
            <>
              <div className={styles.dataSection}>
                <button onClick={handleAddEvent} className={`${styles.dataButton} ${styles.addButton}`}>Add Event</button>
                <h3>Events</h3>
                {events.map((event, index) => (
                  <div key={index} className={styles.dataRow}>
                    <div className={styles.inputGroup}>
                      <label className={styles.dataLabel}>
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
                          className={styles.dataInput}
                        />
                      </label>
                    </div>
                    <div className={styles.inputGroup}>
                      {editingEvent === index &&
                        newEvent.triggers.map((trigger, triggerIndex) => (
                          <div key={triggerIndex} className={styles.triggerRow}>
                            <select
                              value={trigger.type}
                              onChange={(e) => handleTriggerChange(triggerIndex, 'type', e.target.value)}
                              className={styles.triggerTypeSelect}
                            >
                              <option value="">Select Trigger</option>
                              <option value="Who">Who</option>
                              <option value="When">When</option>
                              <option value="Where">Where</option>
                              <option value="What">What</option>
                            </select>
                            <input
                              type="text"
                              value={trigger.value}
                              onChange={(e) => handleTriggerChange(triggerIndex, 'value', e.target.value)}
                              placeholder={`Trigger ${triggerIndex + 1} Value`}
                              className={styles.triggerValueInput}
                            />
                          </div>
                        ))}
                      {editingEvent === index && (
                        <button onClick={handleAddTrigger} className={styles.addTriggerButton}>+</button>
                      )}
                    </div>
                    <label className={styles.dataLabel}>
                      Script:
                      <textarea
                        value={editingEvent === index ? newEvent.script : event.script}
                        onChange={(e) => {
                          if (editingEvent === index) {
                            setNewEvent({ ...newEvent, script: e.target.value });
                          }
                        }}
                        onFocus={() => handleEditEvent(index)}
                        className={styles.dataTextarea}
                      />
                    </label>
                    {editingEvent === index && <button onClick={handleUpdateEvent} className={styles.dataButton}>Update</button>}
                    <button onClick={() => handleDeleteEvent(index)} className={styles.dataButton}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === 'System' && (
        <div className={`system-container ${styles.systemContainer}`}>
          <h2>System Management</h2>
          <p>Advanced users can manage additional variables and control the narrative scale, density, and progress speed here.</p>
          <div className={styles.systemContent}>
            <h3>Variable Management</h3>
            <div className={styles.dataSection}>
              <button className={`${styles.dataButton} ${styles.addButton}`}>Add Variable</button>
              {/* Add additional fields and logic for managing system-level variables */}
            </div>
            <h3>Narrative Control</h3>
            <div className={styles.dataSection}>
              <label className={styles.dataLabel}>
                Minimum Time Value:
                <input type="number" className={styles.dataInput} />
              </label>
              <label className={styles.dataLabel}>
                Maximum Time Value:
                <input type="number" className={styles.dataInput} />
              </label>
              <label className={styles.dataLabel}>
                Time Playback Speed:
                <input type="number" className={styles.dataInput} />
              </label>
            </div>
          </div>
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
          <button onClick={() => setDetailPopupVisible(false)} className={styles.dataButton}>Close</button>
        </div>
      )}
      {isContextMenuVisible && (
        <div ref={contextMenuRef} className={styles.contextMenu} style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}>
          {placeTypes.map((placeType, index) => (
            <div key={index} className={styles.contextMenuItem} onClick={() => handleSelectPlaceType(placeType)}>
              <div className={styles.placeTypeIcon} style={{ backgroundColor: placeType.color }}></div>
              {placeType.name}
            </div>
          ))}
        </div>
      )}
      {isCharacterContextMenuVisible && (
        <div ref={contextMenuRef} className={styles.contextMenu} style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}>
          {characters.map((character, index) => (
            <div key={index} className={styles.contextMenuItem} onClick={() => handleSelectCharacter(character)}>
              {character.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorldProject;
