import { 
    SET_BUTTON_CLICK_STATUS, 
    ADD_NEW_WORLD, 
    SELECT_WORLD, 
    EDIT_SELECTED_WORLD, 
    DELETE_SELECTED_WORLD,
    SET_WORLDS } 
    from './actions';

// 초기 상태 정의
const initialState = {
  buttonClickStatus: {
    addNewWorld: false,
    setIsEditMode: false,
    deleteSelectedWorld: false,
  },
  worldCount: 0,
  worlds: [],
  selectedWorldName: null,
  isEditMode: false,
};

// 리듀서 함수 정의
function worldReducer(state = initialState, action) {
  switch (action.type) {
    case SET_WORLDS:
      return {
        ...state,
        worlds: action.payload, // Assuming payload is the array of worlds
        worldCount: action.payload.length,
      };
    case SET_BUTTON_CLICK_STATUS:
      return {
        ...state,
        buttonClickStatus: {
          ...state.buttonClickStatus,
          [action.payload.buttonName]: action.payload.status,
        },
      };
    case ADD_NEW_WORLD:
      return {
        ...state,
        worlds: [...state.worlds, action.payload],
        worldCount: state.worldCount + 1,
      };
    case SELECT_WORLD:
      return {
        ...state,
        selectedWorldName: action.payload,
      };
    case EDIT_SELECTED_WORLD:
      return {
        ...state,
        worlds: state.worlds.map(world =>
          world.name === action.payload.worldName ? { ...world, name: action.payload.newName } : world
        ),
      };
    case DELETE_SELECTED_WORLD:
      return {
        ...state,
        worlds: state.worlds.filter(world => world.name !== action.payload),
        selectedWorldName: null,
        worldCount: state.worldCount - 1,
      };
    default:
      return state;
  }
}

export default worldReducer;
