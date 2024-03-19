import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setWorldData } from './types/actions';
import { createSelector } from 'reselect';
import './WorldProject.css';

const createInitialTileMap = () => {
  // 여기서는 10x10 타일맵을 예로 들겠다.
  const mapSize = 10;
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
  const { name } = useParams();
  const dispatch = useDispatch();
  const selectWorldDataByName = createSelector(
    [state => state.world.worldData, (state, name) => name],
    (worldData, name) => worldData.find(wd => wd.name === name) || {}
  );

  // Replace local state with Redux state
  const worldData = useSelector(state => selectWorldDataByName(state, name));
  const [activeTab, setActiveTab] = useState('World');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState({ name: '', description: '' });

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    // 여기서 추가적으로 탭에 따른 데이터 로딩 등의 로직을 구현할 수 있다.
  };

  const handleOptionClick = (optionName) => {
    setSelectedOption(optionName);
    // 해당 옵션에 따라 커서 스타일 등을 변경하는 로직을 여기에 구현한다.
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
          if (!tile.place) {
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
      <div className="tabs">
        {['World', 'State', 'System'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="options">
        {['Select', 'Place', 'Character', 'Event'].map((option) => (
          <button
            key={option}
            className={`option-button ${selectedOption === option ? 'selected' : ''}`}
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="tilemap">
        {tileMap.map((row, rowIndex) => (
          <div key={rowIndex} className="tile-row">
          {row.map((tile, tileIndex) => (
            <div
              key={tileIndex}
              className="tile"
              onClick={() => handleTileClick(rowIndex, tileIndex)}
              onDoubleClick={() => handleTileDoubleClick(rowIndex, tileIndex)}
              style={{ width: '40px', height: '40px', border: '1px solid black', display: 'inline-block', margin: '2px' }} // Add visual styling
            >
              {/* Temporary visual indicator */}
              {tile.place ? 'P' : ''}
              {tile.characters ? 'C' : ''}
              {tile.events ? 'E' : ''}
            </div>
        ))}
    </div>
  ))}

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
