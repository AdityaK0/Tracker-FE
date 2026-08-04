import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/Toaster';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

// Landing page for the Google OAuth redirect. The backend finishes the code
// exchange and sends the browser here either with tokens on the query string
// or (if it set an HttpOnly cookie instead) with nothing at all — this page
// handles both without knowing which strategy is live on the backend.
export default function AuthSuccess() {
  const navigate = useNavigate();
  const { loginWithTokens, refreshUser } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error');

    // Scrub tokens/error out of the address bar immediately so they never
    // end up in browser history or get shared via copy-paste.
    window.history.replaceState({}, document.title, window.location.pathname);

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        if (accessToken) {
          await loginWithTokens(accessToken, refreshToken);
        } else {
          const ok = await refreshUser();
          if (!ok) throw new Error('Not authenticated');
        }
        toast.success('Signed in with Google');
        navigate('/', { replace: true });
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        toast.error('Google sign-in failed. Please try again.');
        navigate('/login', { replace: true });
      }
    })();
  }, [loginWithTokens, refreshUser, navigate]);

  return <LoadingSpinner fullScreen />;
}
