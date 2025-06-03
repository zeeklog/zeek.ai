import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';

export default function useAuthRedirect() {
  const { user, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // 检查本地存储中的 token
      const storedToken = localStorage.getItem(import.meta.env.VITE_ENV_CACHE_TOKEN_KEY);
      const storedUser = localStorage.getItem(import.meta.env.VITE_ENV_CACHE_USER_KEY);
      
      // 如果本地存储中有 token 和用户信息，但 isAuthenticated 为 false，则重新设置认证状态
      if (storedToken && storedUser && !isAuthenticated) {
        window.location.reload();
        return;
      }
      
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [isAuthenticated, navigate]);

  return {
    user,
    isAuthenticated,
  };
}
