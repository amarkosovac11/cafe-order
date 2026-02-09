import { Routes, Route } from "react-router-dom";
import TablePage from "./pages/TablePage";

export default function App() {
  return (
    <Routes>
      <Route path="/t/:tableId" element={<TablePage />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
