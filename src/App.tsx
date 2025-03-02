// Code for the main App component

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
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { SignUpPage } from "./components/Auth/SignUpPage"; 
import { ForgotPassword } from "./components/Auth/ForgotPassword";  

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Interface />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path= "/forgot-password" element={<ForgotPassword />} />

          {/* Protected route */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
