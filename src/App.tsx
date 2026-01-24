import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Interface from "./interface";
import ChatInterface from "./components/chatbot/chatBot";
import { LoginPage } from "./components/Auth/Login";
import { AuthCallback } from "./components/Auth/AuthCallback";

import { SignUpPage } from "./components/Auth/SignUpPage";
import { ForgotPassword } from "./components/Auth/ForgotPassword";
import NotFoundPage from "./components/404";
import About from "./components/About";
import LoadingScreen from "./components/LoadingScreen";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 6000); // Corresponds to the loading animation duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <LoadingScreen onFinished={() => setLoading(false)} />}
      <div style={{ display: loading ? 'none' : 'block' }}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Interface />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/about" element={<About />} />

              {/* Protected route */}
              <Route
                path="/chat"
                element={<ChatInterface />}
              />

              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </div>
    </>
  );
}

export default App;
