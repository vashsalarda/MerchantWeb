import api from '../../../config/api';

// Get Product Categories (productcategories)
export const getProductCategoriesAll = (query, token, cb) => () => {
  api(token).get(`/product-categories/all`, { params: query })
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

// Get Product Categories (placeproductcategories)
export const getProductCategoriesAllV2 = (query, placeId, token, cb) => () => {
  api(token).get(`/places/${placeId}/product-categories/all`, { params: query })
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

// Get Product Categories (productcategories)
export const getProductCategories = (query, token, cb) => () => { 
  api(token).get(`/provider/product-categories`, { params: query })
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

// Get Product Categories (productcategories)
export const getProductCategoriesV2 = (query, placeId, token, cb) => () => { 
  api(token).get(`/places/${placeId}/product-categories`, { params: query })
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

// Get Main/Parent Product Categories (productcategories)
export const getProductCategoriesMain = (cb) => () => { 
  api().get('/product-categories')
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const addProductCategory = (category, placeId, token, cb) => () => {
  const body = category;
  api(token).post(`/places/${placeId}/product-categories`,body)
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const updateProductCategory = (category, categoryId, token, cb) => (dispatch, getState) => {
  const body = category;
  api(token).patch('/places/product-categories/'+categoryId,body)
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const deleteProductCategory = (categoryId, token, cb) => () => {
  api(token)
    .delete(`/places/product-categories/${categoryId}`)
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

export const getProductCategoryById = (categoryId, token, cb) => () => {
  api(token).get('places/product-categories/'+categoryId)
    .then(response => {
      if(response && response.data) {
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const uploadPhoto = (categoryId, data, token, cb) => (dispatch, getState) => {
  api(token).post(`places/product-categories/${categoryId}/media`, data)
    .then(response => {
      if(response && response.data)
      return cb(null, response.data);
    })
    .catch(error => {
      cb(error,null);
    })
};

export const removePhoto = (categoryId, photoId, token, cb) => (dispatch, getState) => {
  api(token).delete(`places/product-categories/${categoryId}/media/${photoId}`)
    .then(response => {
      if(response && response.data)
      return cb(null, response.data);
    })
    .catch(error => {
      cb(error,null);
    })
};