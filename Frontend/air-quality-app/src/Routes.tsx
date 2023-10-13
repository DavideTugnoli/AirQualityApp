import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";

const RootRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:city/:country" element={<App />} />
        <Route path="/:city" element={<App />} />
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RootRoutes;
