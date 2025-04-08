// client/src/components/ProtectedRoute.js
import { useAuth } from '../context/AuthContext';

/**
 * A component wrapper that doesn't block access but provides authentication features
 * Simply passes through the children regardless of authentication status
 */
const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  // If still checking authentication status, show the content anyway
  if (loading) {
    return children;
  }

  // Always render children - auth state is handled inside components
  return children;
};

export default ProtectedRoute;