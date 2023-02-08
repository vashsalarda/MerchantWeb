import api from '../../../config/api';

export const getOrders = (query,pageId,token,cb) => () => {
  api(token).get('/provider/fetchOrders/'+pageId,{params: query})
    .then(response => {
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const saveNewStatus = (query,pageId,token,cb) => () => {
  const body = {confirmationCode : ''}
  api(token).patch('/provider/orders/'+pageId,body)
    .then(response => {
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const pickUp = (payloadData,pageId,token,cb) => () => {
  api(token).patch('/business/order/transactions/update/'+pageId,payloadData)
    .then(response => {
      cb(response, null)
    })
    .catch(error => {
      console.error(error)
      cb(error, null);
    })
};

export const cancelAction = (id,messages,token,cb) => () => {
  const body = messages;
  api(token).post('/provider/cancel/'+id,body)
    .then(response => {
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};
export const checkIfMine = (id,pageId,token,cb) => () => {
  const body = {page:pageId};
  api(token).post('/provider/checkIfMine/'+id,body)
    .then(response => {
      cb(response, null)
    })
    .catch(error => {
      cb(error, null);
    })
};

export const receivePayment = (paymentData,token,cb) => () => {
  const body = {
    totalPaid: paymentData.totalPaid,
    customerCash: paymentData.customerCash,
    deliveryFee: paymentData.deliveryFee,
  };
  api(token).post('/payments/' + paymentData.invoiceId, body).then(response => {
    cb(response, null)
  }).catch(error => {
    cb(null, error);
  })
};

export const fetchSingleOrderData = (orderId, token, cb) => () => {
  api(token).get('/merchant/fetchSingleOrderData/'+orderId).then(res => {
    cb(null, res.data.order);
  }).catch(error => {
    cb(error, null);
  })
}
