import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const WorldProject = () => {
    const { worldId } = useParams();
    const [worldData, setWorldData] = useState(null);
  
    useEffect(() => {
      // 서버로부터 worldData 불러오기
      axios.get(`/api/worlds/${worldId}`)
        .then(response => {
          setWorldData(response.data);
        })
        .catch(error => {
          console.error("Error fetching world data:", error);
          // 오류 처리
        });
    }, [worldId]);
  
    if (!worldData) {
      return <div>Loading...</div>; // 데이터 로딩 중 표시
    }
  
    return (
      <div>
        {/* worldData를 활용한 렌더링 로직 */}
        <h1>{worldData.name}</h1>
        {/* 기타 월드 데이터를 활용한 UI 구성 */}
      </div>
    );
  };
  
  export default WorldProject;