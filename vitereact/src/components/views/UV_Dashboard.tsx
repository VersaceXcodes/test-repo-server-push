import React from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

interface DashboardResponse {
  total_properties: number;
  for_sale_properties: number;
  for_rent_properties: number;
  sold_properties: number;
  recent_activity: string[];
}

const UV_Dashboard: React.FC = () => {
  const auth_token = useAppStore((state) => state.auth_token);

  if (!auth_token) {
    return <Navigate to="/login" />;
  }

  const fetchDashboardMetrics = async (): Promise<DashboardResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.get(`${baseUrl}/dashboard`, {
      headers: { Authorization: `Bearer ${auth_token}` },
    });
    return response.data;
  };

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardResponse, Error>(
    ["dashboard_metrics"],
    fetchDashboardMetrics,
    {
      enabled: !!auth_token,
      refetchInterval: 10000,
    }
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {isLoading && (
        <div className="text-center py-6">
          <span className="text-gray-600">
            Loading dashboard metrics...
          </span>
        </div>
      )}
      {isError && (
        <div className="text-center py-6">
          <span className="text-red-500">Error: {error.message}</span>
        </div>
      )}
      {data && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded p-4 flex flex-col items-center">
              <span className="text-xl font-semibold">
                {data.total_properties}
              </span>
              <span className="text-gray-500">Total Properties</span>
            </div>
            <div className="bg-white shadow rounded p-4 flex flex-col items-center">
              <span className="text-xl font-semibold">
                {data.for_sale_properties}
              </span>
              <span className="text-gray-500">For Sale</span>
            </div>
            <div className="bg-white shadow rounded p-4 flex flex-col items-center">
              <span className="text-xl font-semibold">
                {data.for_rent_properties}
              </span>
              <span className="text-gray-500">For Rent</span>
            </div>
            <div className="bg-white shadow rounded p-4 flex flex-col items-center">
              <span className="text-xl font-semibold">
                {data.sold_properties}
              </span>
              <span className="text-gray-500">Sold</span>
            </div>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-2xl font-bold mb-3">Recent Activity</h2>
            {data.recent_activity && data.recent_activity.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {data.recent_activity.map((activity, index) => (
                  <li key={index} className="text-gray-700">
                    {activity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
            <Link
              to="/properties"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-center"
            >
              View Property Listings
            </Link>
            <Link
              to="/properties/create"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded text-center"
            >
              Add New Property
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UV_Dashboard;