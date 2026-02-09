import { Routes, Route } from "react-router-dom";
import TablePage from "./pages/TablePage";
import WaiterPage from "./pages/WaiterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/t/:tableId" element={<TablePage />} />
      <Route path="/waiter" element={<WaiterPage />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  );
}
