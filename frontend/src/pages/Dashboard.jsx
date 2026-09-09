import React from "react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { signOut } = useAuth();
  return (
    <div>
      Dashobard
      <button onClick={signOut}>logout</button>
    </div>
  );
};

export default Dashboard;
