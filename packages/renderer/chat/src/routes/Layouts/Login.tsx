import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { useAuthContext } from '~/hooks/AuthContext';
import StartupLayout from './Startup';
import store from '~/store';

export default function LoginLayout() {
  const { isAuthenticated } = useAuthContext();
  const [queriesEnabled, setQueriesEnabled] = useRecoilState<boolean>(store.queriesEnabled);

  useEffect(() => {
    // 检查本地存储中的 token
    const storedToken = localStorage.getItem(import.meta.env.VITE_ENV_CACHE_TOKEN_KEY);
    const storedUser = localStorage.getItem(import.meta.env.VITE_ENV_CACHE_USER_KEY);
    
    // 如果本地存储中有 token 和用户信息，但 isAuthenticated 为 false，则重新设置认证状态
    if (storedToken && storedUser && !isAuthenticated) {
      window.location.reload();
      return;
    }

    if (queriesEnabled) {
      return;
    }
    const timeout: NodeJS.Timeout = setTimeout(() => {
      setQueriesEnabled(true);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [queriesEnabled, setQueriesEnabled, isAuthenticated]);

  return <StartupLayout isAuthenticated={isAuthenticated} />;
}
