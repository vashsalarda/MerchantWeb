import { getSession } from '../config/session';

import {
  SET_USER,
} from './types';

const initialState = {
  currentUser: getSession('userData') || null,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_USER: {
      return {
        ...state,
        currentUser: action.payload,
      };
    }
    default:
      return state;
  }
}
