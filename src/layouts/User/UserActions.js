import { SET_USER, GET_PROVIDER_PLACES } from '../../reducers/types';
import { setSession } from '../../config/session';

export const register = (body, cb) => (dispatch, getState, { api }) => {
  api().post('/provider/register', body)
    .then(response => {
      if(response && response.data) {
        const { data } = response;
        if(response.status ===200) {
          if(data.status === 'error') {
            cb(data, null);
          } else if (data.statusCode === 201) {
            dispatch({
              type: SET_USER,
              payload: response.data
            });
            const userData = {
              info: data.info,
              email: data.email,
              userId: data.objectId,
              isGuest: data.isGuest,
              isAdmin: data.isAdmin,
              isSBTours: data.isSBTours,
              sessionToken: data.sessionToken,
              createdAt: data.createdAt,
            }
            cb(null, userData)
          }
        }
      }
    })
    .catch(error => {
      cb(error, null);
    })
};

export const login = (email, password, cb) => (dispatch, getState, { api }) => {
  const body = { email, password };
  api().post('/provider/login', body)
    .then(response => {
      if(response && response.data) {
        dispatch({
          type: SET_USER,
          payload: response.data
        });
        const data = response.data;
        const userData = {
          info: data.info,
          email: data.email,
          userId: data.objectId,
          isGuest: data.isGuest,
          isAdmin: data.isAdmin,
          isSBTours: data.isSBTours,
          sessionToken: data.sessionToken,
          createdAt: data.createdAt,
        }
        const defaultPage = data.defaultPage ? data.defaultPage : "";
        setSession('userData',JSON.stringify(userData));
        setSession('defaultPage',JSON.stringify(defaultPage));
        return cb(null, true);
      }
      cb(true, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const sendResetPasswordRequest = (email, cb) => (dispatch, getState, { api }) => {
  const body = { email };
  api().post('/provider/resetPasswordRequest', body)
    .then(response => {
      if(response && response.data) {
        return cb(null, true);
      }
      cb(true, null)
    })
    .catch(error => {
      cb(error, null);
    })
}; 

export const getProviderPlaces = (token,cb) => (dispatch, getState, {api}) => {
  api(token).get('/provider/places')
    .then(response => {
      if(response && response.data) {
        dispatch({
          type: GET_PROVIDER_PLACES,
          payload: response.data
        });
        return cb(null, response.data);
      }
      cb(response, null)
    })
    .catch(error => {
      console.error({error});
      cb(error, null);
    })
};

export const getProviderInfo = (token,cb) => (dispatch, getState, {api}) => {
  api(token).get('/provider/places')
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

export const updateProfile = (providerInfo, token, cb) => (dispatch, getState, {api}) => {
  const body = providerInfo;
  api(token)
    .patch(`/provider/update-profile`, body)
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

export const changePassword = (place, token, cb) => (dispatch, getState, {api}) => {
  const body = place;
  api(token).patch('/provider/change-password',body)
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

