import { Navigate,Route,Routes} from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? children : <Navigate to="/login" />;
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
    </Routes>
  );
};

export default App;
