import { GET_PRODUCTS } from "../../../reducers/products/types";
import { GET_PRODUCT } from "../../../reducers/products/types";
import { GET_PRODUCT_TYPES } from "../../../reducers/products/types";

import api from "../../../config/api";

export const getProductsByPageId = (pageId, query, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .get("provider/places/" + pageId + "/products", { params: query })
    .then(response => {
      if (response && response.data) {
        dispatch({
          type: GET_PRODUCTS,
          payload: response.data
        });
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductsGroceryByPageId = (pageId, query, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .get("provider/places/" + pageId + "/grocery-products", { params: query })
    .then(response => {
      if (response && response.data) {
        dispatch({
          type: GET_PRODUCTS,
          payload: response.data
        });
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductsByProviderId = (query, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .get("/provider/products", { params: query })
    .then(response => {
      if (response && response.data) {
        dispatch({
          type: GET_PRODUCTS,
          payload: response.data
        });
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductById = (productId, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .get("/provider/products/" + productId)
    .then(response => {
      if (response && response.data) {
        dispatch({
          type: GET_PRODUCT,
          payload: response.data
        });
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const addProduct = (product, token, cb) => (dispatch, getState) => {
  const body = product;
  api(token)
    .post("/business/products", body)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const updateProduct = (product, productId, token, cb) => (
  dispatch,
  getState
) => {
  const body = product;
  api(token)
    .patch(`/business/products/${productId}`, body)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const deleteProduct = (productId, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .delete(`/business/products/${productId}`)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductTypes = cb => (dispatch, getState) => {
  api()
    .get("/provider/product-types")
    .then(response => {
      if (response && response.data) {
        dispatch({
          type: GET_PRODUCT_TYPES,
          payload: response.data
        });
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

// Get Page Categories (productcategories)
export const getProductCategories = (token, cb) => () => {
  api(token)
    .get(`/product-categories/all`)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

// Get NEW Page Categories (placeproductcategories)
export const getProductCategoriesV2 = (placeId, query, token, cb) => () => {
  api(token)
    .get(`/places/${placeId}/product-categories/all`,{ params: query })
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const uploadPhoto = (productId, data, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .post(`/business/products/${productId}/media`, data)
    .then(response => {
      if (response && response.data) return cb(null, response.data);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const removePhoto = (productId, photoId, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .delete(`business/products/${productId}/media/${photoId}`)
    .then(response => {
      if (response && response.data) return cb(null, response.data);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getOrdersList = (query, token, cb) => () => {
  api(token)
    .get("/provider/orders", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductOrders = (query, token, cb) => () => {
  api(token)
    .get("/provider/product-orders", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const uploadPhotoByProductName = (productName, data, token, cb) => (
  dispatch,
  getState
) => {
  api(token)
    .post(`/business/products/uploadPhotoByProductName/${productName}`, data)
    .then(response => {
      if (response && response.data) return cb(null, response.data);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getSalesList = (query, token, cb) => () => {
  api(token)
    .get("/provider/salesV2", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductOrdersGrocery = (query, token, cb) => () => {
  api(token)
    .get("/provider/grocery/product-orders", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getOrdersListGrocery = (query, token, cb) => () => {
  api(token)
    .get("/provider/grocery/orders", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getSalesListGrocery = (query, token, cb) => () => {
  api(token)
    .get("/provider/grocery/sales", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getSalesListXls = (query, token, cb) => () => {
  api(token)
    .get("/provider/sales-list-xls", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getSalesListGroceryXls = (query, token, cb) => () => {
  api(token)
    .get("/provider/sales-list-grocery-xls", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getOrderListXls = (query, token, cb) => () => {
  api(token)
    .get("/provider/orders-list-xls", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductOrdersXls = (query, token, cb) => () => {
  api(token)
    .get("/provider/product-orders-xls", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const getProductOrdersGroceryXls = (query, token, cb) => () => {
  api(token)
    .get("/provider/product-orders-grocery-xls", { params: query })
    .then(response => {
      if (response) {
        return cb(null, response);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const merchantApiLogin = (endpoint, username, password, token, cb) => () => {
  
  const body = {
    endpoint: endpoint,
    username: username,
    password: password
  };

  api(token)
    .post("/business/merchant-api-login", body)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
}

export const importProductsFromApi = (endpoint, apiKey, placeId, token, cb) => () => {
  const body = {
    endpoint: endpoint, 
    apiKey: apiKey,
    placeId: placeId,
  };

  api(token)
    .post("/business/import-products-from-api", body)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const syncProductsFromAPI = (endpoint, apiKey, placeId, token, cb) => () => {
  const body = {
    endpoint: endpoint, 
    apiKey: apiKey,
    placeId: placeId,
  };

  api(token)
    .post("/business/sync-products-from-api", body)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};

export const syncProductsFromJSON = (products, placeId, token, cb) => () => {
  const body = {
    products,
    placeId
  };

  api(token)
    .post("/business/sync-products-from-json", body)
    .then(response => {
      if (response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null);
    })
    .catch(error => {
      cb(error, null);
    });
};
