import { atom } from 'recoil';
import type { TUser, TPlugin } from 'librechat-data-provider';
import { atomWithLocalStorage } from './utils';

// 从本地缓存初始化用户信息
const initializeUser = (): TUser | undefined => {
  try {
    const storedUser = localStorage.getItem(import.meta.env.VITE_ENV_CACHE_USER_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (e) {
    console.error('Error parsing stored user:', e);
  }
  return undefined;
};

const user = atomWithLocalStorage<TUser | undefined>('user', initializeUser());

const availableTools = atom<Record<string, TPlugin>>({
  key: 'availableTools',
  default: {},
});

export default {
  user,
  availableTools,
};
