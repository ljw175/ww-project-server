import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
// Import actions
import {
  addNewWorld as addNewWorldAction,
  selectWorld as selectWorldAction,
  editSelectedWorld as editSelectedWorldAction,
  deleteSelectedWorld as deleteSelectedWorldAction,
  setButtonClickStatus as setButtonClickStatusAction,
  setWorlds
} from './types/actions'; 
// Import selectors
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

  // Fetch worlds on component mount
  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const response = await axios.get('/api/worlds');
        dispatch(setWorlds(response.data)); // Assuming setWorlds is a Redux action
      } catch (error) {
        console.error("Error fetching worlds", error);
      }
    };
    fetchWorlds();
  }, [dispatch]);

  const handleAddWorld = async () => {
    // Use a prompt to ask for the world name
    const inputName = window.prompt("Enter the world name:");
    if (!inputName || !inputName.trim()) {
      window.alert("Please enter a valid world name.");
      return;
    }
  
    if (worlds.some(world => world.name === inputName.trim())) {
      window.alert("A world with that name already exists.");
      return;
    }
  
    try {
      const response = await axios.post('/api/worlds', { name: inputName.trim() });
      dispatch(addNewWorldAction(response.data));
    } catch (error) {
      console.error("Error adding new world", error);
    }
  };

  const handleEditWorld = async () => {
    if (selectedWorldName) {
      // Example: Prompt the user for the new name (implement a more user-friendly approach in production)
      const newName = window.prompt("Enter the new world name:", selectedWorldName);
      if (!newName || newName.trim() === "" || newName === selectedWorldName) {
        window.alert("Invalid or unchanged name.");
        return;
      }
  
      try {
        const updatedWorld = { newName: newName.trim() }; // Assuming the backend expects this structure
        await axios.put(`/api/worlds/${encodeURIComponent(selectedWorldName)}`, updatedWorld);
        dispatch(editSelectedWorldAction(selectedWorldName, newName));
        // Optionally, refetch worlds list to ensure UI is in sync with the DB
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
        // Optionally, refetch worlds list to ensure UI is in sync with the DB
      } catch (error) {
        console.error("Error deleting world", error);
      }
    }
  };
  
  // Handler for button click actions, replace this with your actual logic
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
            onMouseUp={handleAddWorld}
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
    </div>
  );
};

export default HomePage;
