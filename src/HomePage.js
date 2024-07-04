import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  addNewWorld as addNewWorldAction,
  selectWorld as selectWorldAction,
  editSelectedWorld as editSelectedWorldAction,
  deleteSelectedWorld as deleteSelectedWorldAction,
  setButtonClickStatus as setButtonClickStatusAction,
  setWorlds
} from './types/actions';
import { 
  selectWorlds,
  selectSelectedWorldName,
  selectIsEditMode,
  selectButtonClickStatus 
} from './types/selectors';
import styles from './App.module.css';
import './App.css';

const HomePage = ({ handleDoubleClick }) => {
  const dispatch = useDispatch();
  const worlds = useSelector(selectWorlds);
  const buttonClickStatus = useSelector(selectButtonClickStatus);
  const selectedWorldName = useSelector(selectSelectedWorldName);
  const isEditMode = useSelector(selectIsEditMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [worldName, setWorldName] = useState('');

  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const response = await axios.get('/api/worlds');
        dispatch(setWorlds(response.data));
      } catch (error) {
        console.error("Error fetching worlds", error);
      }
    };
    fetchWorlds();
  }, [dispatch]);

  const handleAddWorld = async () => {
    if (!worldName.trim()) {
      alert("Please enter a valid world name.");
      return;
    }

    if (worlds.some(world => world.name === worldName.trim())) {
      alert("A world with that name already exists.");
      return;
    }

    try {
      const response = await axios.post('/api/worlds', { name: worldName.trim() });
      dispatch(addNewWorldAction(response.data));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding new world", error);
    }
  };

  const handleEditWorld = async () => {
    if (selectedWorldName) {
      const newName = window.prompt("Enter the new world name:", selectedWorldName);
      if (!newName || newName.trim() === "" || newName === selectedWorldName) {
        alert("Invalid or unchanged name.");
        return;
      }

      try {
        const updatedWorld = { newName: newName.trim() };
        await axios.put(`/api/worlds/${encodeURIComponent(selectedWorldName)}`, updatedWorld);
        dispatch(editSelectedWorldAction(selectedWorldName, newName));
      } catch (error) {
        console.error("Error editing world", error);
      }
    }
  };

  const handleDeleteWorld = async () => {
    if (selectedWorldName && window.confirm(`Are you sure you want to delete ${selectedWorldName}?`)) {
      try {
        await axios.delete(`/api/worlds/${encodeURIComponent(selectedWorldName)}`);
        dispatch(deleteSelectedWorldAction(selectedWorldName));
      } catch (error) {
        console.error("Error deleting world", error);
      }
    }
  };

  const handleButtonClick = (actionType) => {
    dispatch(setButtonClickStatusAction(actionType, true));
    setTimeout(() => dispatch(setButtonClickStatusAction(actionType, false)), 100);
  };

  return (
    <div className="unselectable">
      <div id="worldCountDisplay">{worlds.length} Worlds</div>
      <div className="container">
        <div className="main-buttons">
          <button
            onMouseDown={() => handleButtonClick('addNewWorld')}
            onMouseUp={() => setIsModalOpen(true)}
            className={`${styles.addNewWorldButton} ${buttonClickStatus.addNewWorld ? styles.buttonClicked : ''}`}
          >
            +New
          </button>
          <button
            onMouseDown={() => handleButtonClick('editSelectedWorld')}
            onMouseUp={handleEditWorld}
            className={`${styles.editModeButton} ${selectedWorldName ? styles.buttonClickabled : ''} ${buttonClickStatus.editSelectedWorld ? styles.buttonClicked : ''}`}
          >
            Edit
          </button>
          <button
            onMouseDown={() => handleButtonClick('deleteSelectedWorld')}
            onMouseUp={handleDeleteWorld}
            className={`${styles.deleteWorldButton} ${selectedWorldName ? styles.buttonClickabled : ''} ${buttonClickStatus.deleteSelectedWorld ? styles.buttonClicked : ''}`}
          >
            Delete
          </button>
        </div>
        <div id="worldContainer">
          {worlds.map((world, index) => (
            <button
              key={index}
              onDoubleClick={() => handleDoubleClick(world.name)}
              onClick={() => dispatch(selectWorldAction(world.name))}
              className={`world-button ${selectedWorldName === world.name ? 'worldOutline' : ''}`}
            >
              <div className="world-name">{world.name}</div>
              <div className="last-date">{world.lastEdit}</div>
              <div className="world-page">{world.page}</div>
            </button>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            <input 
              type="text" 
              value={worldName} 
              onChange={(e) => setWorldName(e.target.value)} 
              placeholder="Enter world name" 
            />
            <button onClick={handleAddWorld}>Add World</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
