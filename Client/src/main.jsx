import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from './components/ui/sonner'
import { Provider } from 'react-redux'
import store from './redux/store'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import axios from 'axios'
import { setUser, setToken } from './redux/authSlice'
import { toast } from 'sonner'

// Ensure withCredentials is true by default
axios.defaults.withCredentials = true;

// Attach Authorization Bearer token from Redux store or localStorage to every request
axios.interceptors.request.use((config) => {
  const token = store.getState()?.auth?.token || localStorage.getItem("token");
  if (token && token !== "null" && token !== "undefined") {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to catch 401 session expiry and clean up auth state
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isAuthRoute = url.includes("/login") || url.includes("/register");

      if (!isAuthRoute) {
        // Clear stored credentials
        localStorage.removeItem("token");
        store.dispatch(setUser(null));
        store.dispatch(setToken(null));

        const isExpired = error.response?.data?.expired || error.response?.data?.message?.includes("expired");
        if (isExpired) {
          toast.error("Session Expired", {
            description: "Your session has expired. Please log in again to continue.",
          });
        }
      }
    }
    return Promise.reject(error);
  }
);

const persistor = persistStore(store)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
    <Toaster />
  </StrictMode>,
)
