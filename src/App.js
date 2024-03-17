/* eslint-disable */
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import WorldProject from './WorldProject';
import './App.css';

const App = () => {
  const navigate = useNavigate(); // useNavigate 호출
  const [buttonClickStatus, setButtonClickStatus] = useState({
    addNewWorld: false,
    setIsEditMode: false,
    deleteSelectedWorld: false,
    });
  const [worldCount, setWorldCount] = useState(0);
  const [worlds, setWorlds] = useState([]);
  const [selectedWorldName, setSelectedWorldName] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

    // 버튼 클릭 핸들러
    const handleButtonClick = (buttonName) => {
      // 클릭된 버튼의 상태를 true로 설정
      setButtonClickStatus(prevStatus => ({
        ...prevStatus,
        [buttonName]: true
      }));
    
      // 0.1초 후에 클릭된 버튼의 상태를 false로 설정
      setTimeout(() => {
        setButtonClickStatus(prevStatus => ({
          ...prevStatus,
          [buttonName]: false
        }));
      }, 100);
    };

  const addNewWorld = async () => {
    // 사용자로부터 프로젝트 이름 입력 받기
    const projectName = prompt("Enter the new project name:");
    if (projectName) {
      const newWorldData = {
        id: projectName, // 프로젝트 이름을 ID로 사용
        name: projectName,
        // 기타 필요한 프로젝트 데이터
      };

      try {
        const response = await axios.post('/api/worlds', newWorldData);
        const savedWorld = response.data;
        setWorlds([...worlds, savedWorld]);
        // 성공적으로 저장 후 UI 업데이트 또는 사용자에게 피드백 제공
      } catch (error) {
        if (error.response && error.response.status === 409) {
          alert("A world with this name already exists. Please choose a different name.");
        } else {
          console.error("Error adding new world", error);
        }
      }
    }
  };

  const selectWorld = (Name) => {
      setSelectedWorldName(Name);
      if (isEditMode) {
          setIsEditMode(false);
      }
  };

  const editSelectedWorld = (newName) => {
      const updatedWorlds = worlds.map(world => {
          if (world.name === selectedWorldName) {
              return { ...world, name: newName };
          }
          return world;
      });
      setWorlds(updatedWorlds);
      setIsEditMode(false);
  };
  
  const clickableButtonStyle = {
    pointerEvents: selectedWorldName ? 'auto' : 'none',
    color: selectedWorldName ? 'black' : '#909090', // 조건에 따른 색상 변경
  };

  const deleteSelectedWorld = async () => {
    const isConfirmed = window.confirm("Are you sure you want to delete this world?");
    if (isConfirmed && selectedWorldName) {
      try {
        // 서버에 DELETE 요청 보내기
        await axios.delete(`/api/worlds/${selectedWorldName}`);
        // 클라이언트 상의 상태 업데이트
        const updatedWorlds = worlds.filter(world => world.name !== selectedWorldName);
        setWorlds(updatedWorlds);
        setSelectedWorldName(null); // 선택된 월드 이름 초기화
      } catch (error) {
        console.error("Error deleting world", error);
      }
    }
  };

  const handleDoubleClick = (name) => {
    navigate(`/worlds/${name}`); // navigate 함수 사용
  };

  return (
      <div>
        <Routes>
          <Route 
            path="/" 
            element={<HomePage 
            buttonClickStatus={buttonClickStatus}
            worldCount={worldCount} 
            setWorldCount={setWorldCount}
            worlds={worlds}
            selectedWorldName={selectedWorldName}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            handleButtonClick={handleButtonClick}
            addNewWorld={addNewWorld}
            selectWorld={selectWorld} 
            editSelectedWorld={editSelectedWorld}
            clickableButtonStyle={clickableButtonStyle}
            deleteSelectedWorld={deleteSelectedWorld}
            handleDoubleClick={handleDoubleClick} 
            />} />
          <Route 
            path="/worlds/:name" 
            element={<WorldProject 
            />} />
        </Routes>
      </div>
  );
}

export default App;
