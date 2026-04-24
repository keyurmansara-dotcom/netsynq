const STORAGE_KEY = 'user';
const REMEMBERED_LOGIN_KEY = 'remembered_login';

const getStorage = () => window.sessionStorage;
const getLocalStorage = () => window.localStorage;

export const getStoredUser = () => {
  const rawValue = getStorage().getItem(STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (!user) {
    getStorage().removeItem(STORAGE_KEY);
    return;
  }

  getStorage().setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  getStorage().removeItem(STORAGE_KEY);
};

export const getRememberedLogin = () => {
  const rawValue = getLocalStorage().getItem(REMEMBERED_LOGIN_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const setRememberedLogin = (loginData) => {
  if (!loginData) {
    getLocalStorage().removeItem(REMEMBERED_LOGIN_KEY);
    return;
  }

  getLocalStorage().setItem(REMEMBERED_LOGIN_KEY, JSON.stringify(loginData));
};