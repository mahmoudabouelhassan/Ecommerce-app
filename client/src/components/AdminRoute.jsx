import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

function AdminRoute() {
  const role = useSelector((state) => state.auth.user?.role);
  return role === "admin" ? <Outlet /> : <Navigate to="/profile" replace />;
}

export default AdminRoute;
