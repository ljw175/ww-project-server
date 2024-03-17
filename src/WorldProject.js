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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWorldData(prev => ({ ...prev, [name]: value }));
  };

  const saveWorldData = () => {
    axios.post(`/api/worlds/${name}`, worldData)
    .then(response => {
      console.log('World data saved successfully:', response.data);
      // 성공적으로 저장된 후의 로직을 여기에 작성할 수 있습니다.
      // 예를 들어, 사용자에게 성공 메시지를 보여주거나, 페이지를 새로고침하거나, 다른 페이지로 리디렉트할 수 있습니다.
    })
    .catch(error => {
      console.error('Error saving world data:', error);
      // 에러 처리 로직을 여기에 작성할 수 있습니다.
      // 예를 들어, 사용자에게 에러 메시지를 보여주는 등의 처리를 할 수 있습니다.
    });
  };

  return (
    <div>
      <h1>{worldData.name || "새로운 월드 프로젝트"}</h1>
      <input
        type="text"
        name="projectName"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="월드 이름"
      />
      <textarea
        name="projectName"
        value={worldData.description}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="월드 설명"
      />
      {/* 기타 입력 필드와 컨트롤 */}
      <button onClick={saveWorldData}>저장</button>
    </div>
  );
};

export default WorldProject;
