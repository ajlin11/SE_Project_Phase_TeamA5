import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();
  const token = localStorage.getItem("accessToken");

  // If no token at all, redirect to login
  if (!token) return <Navigate to="/login" replace />;

  // If token exists but auth context hasn't loaded yet, wait
  if (!isAuthenticated) return <div className="loading">Loading...</div>;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
