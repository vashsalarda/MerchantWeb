import axios from 'axios';
const url = process.env.NODE_ENV === 'production' ? 'https://www.streetby.com' : 'http://localhost:5000';

const instance = token => {
  const api = axios.create({
    baseURL: url,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return api;
};

export default instance;
