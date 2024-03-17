import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  addNewWorld as addNewWorldAction,
  selectWorld as selectWorldAction,
  editSelectedWorld as editSelectedWorldAction,
  deleteSelectedWorld as deleteSelectedWorldAction,
  setButtonClickStatus as setButtonClickStatusAction,
  setWorlds
} from './types/actions'; // Ensure the correct path to your actions file
import styles from './App.module.css';
import './App.css';

const HomePage = () => {
  const dispatch = useDispatch();

  // Accessing Redux state
  const buttonClickStatus = useSelector(state => state.buttonClickStatus);
  const worlds = useSelector(state => state.worlds || []); // Ensure worlds is always an array
  const worldCount = worlds.length;
  const selectedWorldName = useSelector(state => state.selectedWorldName);
  const isEditMode = useSelector(state => state.isEditMode);

  // Fetch worlds on component mount
  useEffect(() => {
    const fetchWorlds = async () => {
      try {
        const { data } = await axios.get('/api/worlds');
        if (Array.isArray(data)) {
          dispatch(setWorlds(data)); // Use the new action to set worlds
        } else {
          console.error("Received data is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching worlds:", error);
      }
    };

    fetchWorlds();
  }, [dispatch]);

  // Handler for button click actions, replace this with your actual logic
  const handleButtonClick = (actionType) => {
    dispatch(setButtonClickStatusAction(actionType, true));
    setTimeout(() => dispatch(setButtonClickStatusAction(actionType, false)), 100);
  };

  return (
    <div className="unselectable">
      <div id="worldCountDisplay">{worldCount} Worlds</div>
      <div className="container">
        <div className="main-buttons">
          <button
            onMouseDown={() => handleButtonClick('addNewWorld')}
            onMouseUp={() => dispatch(addNewWorldAction())}
            className={`${styles.addNewWorldButton} ${buttonClickStatus.addNewWorld ? styles.buttonClicked : ''}`}
          >
            +New
          </button>
          <button
            onMouseDown={() => handleButtonClick('editSelectedWorld')}
            onMouseUp={() => isEditMode && selectedWorldName ? dispatch(editSelectedWorldAction(selectedWorldName)) : null}
            className={`${styles.editModeButton} ${buttonClickStatus.editSelectedWorld ? styles.buttonClicked : ''}`}
          >
            Edit
          </button>
          <button
            onMouseDown={() => handleButtonClick('deleteSelectedWorld')}
            onMouseUp={() => selectedWorldName ? dispatch(deleteSelectedWorldAction(selectedWorldName)) : null}
            className={`${styles.deleteWorldButton} ${buttonClickStatus.deleteSelectedWorld ? styles.buttonClicked : ''}`}
          >
            Delete
          </button>
        </div>
        <div id="worldContainer">
          {worlds.map(world => (
            <button
              key={world.name}
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
