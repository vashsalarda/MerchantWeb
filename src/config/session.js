export const getSession = (key) => localStorage.getItem(key);
export const setSession = (key, data) => localStorage.setItem(key, data);