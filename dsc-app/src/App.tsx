import React from "react";
import AppRouter from "@/routes/AppRouter";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { useTheme } from "@/hooks/useTheme";

const App: React.FC = () => {
  useAuthCheck();
  useTheme();
  return <AppRouter />;
};

export default App;
