import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './WorldProject.css';

const WorldProject = () => {
  const { name } = useParams();
  const [projectName, setProjectName] = useState("");
  const [worldData, setWorldData] = useState({
    name: '',
    description: '',
    // 기타 초기 상태값
  });
  const [activeTab, setActiveTab] = useState('World');
  const [selectedOption, setSelectedOption] = useState('Select');
  const [tileMap, setTileMap] = useState(createInitialTileMap());
  const [isDetailPopupVisible, setDetailPopupVisible] = useState(false);
  const [selectedTileDetails, setSelectedTileDetails] = useState(null);

  const createInitialTileMap = () => {
    // 여기서는 10x10 타일맵을 예로 들겠다.
    const mapSize = 10;
    let initialMap = [];
  
    for (let row = 0; row < mapSize; row++) {
      let tileRow = [];
      for (let col = 0; col < mapSize; col++) {
        // 각 타일의 기본 상태를 설정
        tileRow.push({
          place: null, // 처음에는 아무 Place도 배치되지 않은 상태
          character: null,
          event: null,
          // 기타 필요한 타일 상태
        });
      }
      initialMap.push(tileRow);
    }
  
    return initialMap;
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    // 여기서 추가적으로 탭에 따른 데이터 로딩 등의 로직을 구현할 수 있다.
  };

  const handleOptionClick = (optionName) => {
    setSelectedOption(optionName);
    // 해당 옵션에 따라 커서 스타일 등을 변경하는 로직을 여기에 구현한다.
  };

  const handleTileDoubleClick = (rowIndex, tileIndex) => {
    // 여기서는 예시로 타일맵 상태에서 해당 타일 정보를 추출한다고 가정한다.
    const details = tileMap[rowIndex][tileIndex].details;
    setSelectedTileDetails(details);
    setDetailPopupVisible(true);
  };

  const handleTilePlacement = (rowIndex, tileIndex, type) => {
    // 현재 타일에 배치된 타입 확인
    const tile = tileMap[rowIndex][tileIndex];
    
    // 배치 규칙에 따라 타입을 배치할 수 있는지 검사
    if (type === 'Place' && !tile.place) {
      // Place 타입은 빈 타일에만 배치 가능
      updateTile(rowIndex, tileIndex, { place: 'New Place' });
    } else if ((type === 'Character' || type === 'Event') && tile.place) {
      // Character와 Event 타입은 Place가 있는 타일에만 배치 가능
      updateTile(rowIndex, tileIndex, { [type.toLowerCase()]: 'New Character or Event' });
    }
  };

  // 타일 업데이트 함수
  const updateTile = (rowIndex, tileIndex, newContent) => {
    setTileMap(currentMap => {
      const newMap = [...currentMap];
      newMap[rowIndex][tileIndex] = { ...newMap[rowIndex][tileIndex], ...newContent };
      return newMap;
    });
  };

  const handleTileClick = (rowIndex, tileIndex) => {
    setTileMap((currentMap) => {
      // 현재 타일맵의 깊은 복사본을 생성하여 불변성을 유지
      const newMap = JSON.parse(JSON.stringify(currentMap));
      const tile = newMap[rowIndex][tileIndex];
      
      switch (selectedOption) {
        case 'Place':
          // Place 옵션이 선택되었을 때만 빈 타일에 배치 가능
          if (!tile.place) {
            tile.place = { name: 'New Place', details: 'Place Details' };
          }
          break;
        case 'Character':
          // Character 옵션이 선택되었을 때 Place가 있는 타일에만 배치 가능
          if (tile.place && !tile.character) {
            tile.character = { name: 'New Character', details: 'Character Details' };
          }
          break;
        case 'Event':
          // Event 옵션이 선택되었을 때 Place가 있는 타일에만 배치 가능
          if (tile.place && !tile.event) {
            tile.event = { name: 'New Event', details: 'Event Details' };
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
    const fetchWorldData = async () => {
      try {
        const response = await axios.get(`/api/worlds/${name}`);
        // URL에서 추출한 name을 상태에 저장
        setProjectName(name);
        setWorldData(response.data);
      } catch (error) {
        console.error("Error fetching world data", error);
      }
    };

    fetchWorldData();
    
    axios.get(`/api/worlds/${name}`)
      .then(response => {
        const data = response.data;
        setProjectName(data.name); // 받아온 데이터로 projectName 상태 업데이트
        setWorldData(response.data);
      })
      .catch(error => {
        console.error("Error fetching or creating new world data:", error);
        // 데이터를 불러오지 못했을 때의 처리 로직 (여기서는 기본 상태를 이미 설정했음)
      });
  }, [name]);

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
      <div className="tilemap"> //타일맵 랜더링
        {tileMap.map((row, rowIndex) => (
          <div key={rowIndex} className="tile-row">
            {row.map((tile, tileIndex) => (
              <div
                key={tileIndex}
                className="tile"
                onClick={() => handleTileClick(rowIndex, tileIndex)}
                onDoubleClick={() => handleTileDoubleClick(rowIndex, tileIndex)}
              >
                {/* 타일에 대한 데이터 렌더링 */}
              </div>
            ))}
          </div>
        ))}

        // 상세정보 팝업을 렌더링하는 부분
        {isDetailPopupVisible && (
          <div className="detail-popup">
            <h2>Tile Details</h2>
            <p>Name: {selectedTileDetails.name}</p>
            <p>Description: {selectedTileDetails.description}</p>
            {/* 여기에 상세 정보 표시 */}
            <button onClick={() => setDetailPopupVisible(false)}>Close</button>
          </div>
        )}

      </div>
    </div>
    
  );
};

export default WorldProject;
