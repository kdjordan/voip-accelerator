export default function useSessionStorage<T>() {
  const setSessionData = (key: string, data: T) => {
    sessionStorage.setItem(key, JSON.stringify(data));
  };

  const getSessionData = (key: string): T | null => {
    const storedData = sessionStorage.getItem(key);
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  };

  const removeSessionData = (key: string) => {
    sessionStorage.removeItem(key);
  };

  const clearSessionStorage = () => {
    sessionStorage.clear();
  };

  return {
    setSessionData,
    getSessionData,
    removeSessionData,
    clearSessionStorage,
  };
}
