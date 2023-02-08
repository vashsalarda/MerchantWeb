import api from '../../../config/api';

export const getPageById = (placeId, token, cb) => () => {
  api(token).get('/provider/places/'+placeId)
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

export const addPage = (page, token, cb) => () => {
  const body = page;
  api(token).post('/provider/places',body)
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

export const updatePage = (place, placeId, token, cb) => (dispatch, getState) => {
  const body = place;
  api(token).patch('/provider/places/'+placeId,body)
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

export const uploadPhoto = (placeId, data, token, cb) => (dispatch, getState) => {
  api(token).post(`/business/places/${placeId}/media`, data)
    .then(response => {
      if(response && response.data)
      return cb(null, response.data);
    })
    .catch(error => {
      cb(error,null);
    })
};

export const removePhoto = (placeId, photoId, token, cb) => (dispatch, getState) => {
  api(token).delete(`business/places/${placeId}/media/${photoId}`)
    .then(response => {
      if(response && response.data)
      return cb(null, response.data);
    })
    .catch(error => {
      cb(error,null);
    })
};

export const getPageTypes = (cb) => () => {
  api().get('/provider/page-types')
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

export const getPageCategories = (cb) => () => { // Get New Page Categories (pagecategories)
  api().get('/page-categories/all')
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
export const getAmenities = (cb) => () => { // Get New Amenities (amenities)
  api().get('/provider/amenities')
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

export const getOrders = (cb) => () => {
  api().post('/provider/fetchOrders')
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

export const addTour = (tour, token, cb) => (dispatch, getState) => {
  const body = tour;
  api(token)
    .post("/provider/tours", body)
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