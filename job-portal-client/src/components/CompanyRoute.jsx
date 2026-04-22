import React from "react";
import { Navigate } from "react-router-dom";

export default function CompanyRoute({ children }) {
  const companyEmail = localStorage.getItem("companyEmail");
  const token = localStorage.getItem("token");

  if (!companyEmail || !token) {
    return <Navigate to="/login/company" replace />;
  }

  return children;
}

