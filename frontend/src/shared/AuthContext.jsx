import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useRouter() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  const navigate = (path) => {
    const nextRoute = path.startsWith("#") ? path : `#${path}`;
    if (window.location.hash === nextRoute) {
      setRoute(path.replace(/^#/, "") || "/");
      return;
    }
    window.location.hash = nextRoute;
  };
  return { route, navigate };
}
