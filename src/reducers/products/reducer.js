import {
  GET_PRODUCTS,
  GET_PRODUCT_TYPES,
} from './types';

const initialState = {
  products: [],
};

export default function(state = initialState, action) {
  switch (action.type) {
    case GET_PRODUCTS: {
      return {
        ...state,
        products: action.payload,
      };
    }
    case GET_PRODUCT: {
      return {
        ...state,
        product: action.payload,
      };
    }
    case GET_PRODUCT_TYPES: {
      return {
        ...state,
        product_types: action.payload,
      };
    }
    default:
      return state;
  }
}