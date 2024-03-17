export const SET_WORLDS = 'SET_WORLDS';
export const SET_BUTTON_CLICK_STATUS = 'SET_BUTTON_CLICK_STATUS';
export const ADD_NEW_WORLD = 'ADD_NEW_WORLD';
export const SELECT_WORLD = 'SELECT_WORLD';
export const EDIT_SELECTED_WORLD = 'EDIT_SELECTED_WORLD';
export const DELETE_SELECTED_WORLD = 'DELETE_SELECTED_WORLD';
// 액션 생성 함수 정의

  export function setWorlds(worldsData) {
    return {
      type: SET_WORLDS,
      payload: worldsData,
    };
  }

// 버튼 클릭 상태 설정
  export function setButtonClickStatus(buttonName, status) {
    return {
      type: SET_BUTTON_CLICK_STATUS,
      payload: { buttonName, status },
    };
  }
  
  // 새 월드 추가
  export function addNewWorld(worldData) {
    return {
      type: ADD_NEW_WORLD,
      payload: worldData,
    };
  }
  
  // 월드 선택
  export function selectWorld(worldName) {
    return {
      type: SELECT_WORLD,
      payload: worldName,
    };
  }
  
  // 선택된 월드 편집
  export function editSelectedWorld(worldName, newName) {
    return {
      type: EDIT_SELECTED_WORLD,
      payload: { worldName, newName },
    };
  }
  
  // 선택된 월드 삭제
  export function deleteSelectedWorld(worldName) {
    return {
      type: DELETE_SELECTED_WORLD,
      payload: worldName,
    };
  }