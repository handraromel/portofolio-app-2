import React from "react";
import AppRouter from "routes/AppRouter";
import { useAuthCheck } from "hooks/useAuthCheck";

const App: React.FC = () => {
  useAuthCheck();
  return <AppRouter />;
};

export default App;
