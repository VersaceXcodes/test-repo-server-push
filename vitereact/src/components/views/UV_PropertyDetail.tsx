import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/main";
import { Property } from "@schema";

const UV_PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Get auth token from global Zustand store
  const authToken = useAppStore((state) => state.auth_token);

  // Local state for the currently selected image index in the image gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Reset selected image index when property changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [id]);

  // Fetch property details from backend
  const fetchPropertyDetail = async (): Promise<Property> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/properties/${id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  };

  const { data: property, isLoading, error } = useQuery<Property, Error>(["property", id], fetchPropertyDetail, {
    enabled: !!id && !!authToken,
  });

  // Mutation for deleting the property
  const deleteProperty = async (): Promise<{ message: string }> => {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/properties/${id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  };

  const deleteMutation = useMutation(deleteProperty, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      navigate("/properties");
    },
    onError: (error: any) => {
      // Optionally add global notification error message here using the store
      console.error("Error deleting property:", error.message);
    },
  });

  // Handle delete action with confirmation dialog
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      deleteMutation.mutate();
    }
  };

  // Determine the main image to display from the property images array
  const mainImageUrl =
    property && property.images && property.images.length > 0
      ? property.images[selectedImageIndex]?.image_url
      : null;

  return (
    <>
      {isLoading && <div className="text-center mt-8">Loading...</div>}
      {error && (
        <div className="text-center mt-8 text-red-500">
          Error fetching property details: {error.message}
        </div>
      )}
      {property && (
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
          <div className="mb-6">
            <p className="text-lg">
              <span className="font-semibold">Address: </span>
              {property.street}, {property.city}, {property.state} {property.zip_code}, {property.country}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Price: </span>${property.price.toLocaleString()}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Status: </span>
              {property.status.replace("_", " ")}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Type: </span>
              {property.property_type.replace("_", " ")}
            </p>
            <p className="mt-4">{property.description}</p>
          </div>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* Image Gallery Section */}
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={`${property.title} - Main Image`}
                  className="w-full h-80 object-cover rounded"
                />
              ) : (
                <div className="w-full h-80 flex items-center justify-center bg-gray-200 rounded">
                  No Image Available
                </div>
              )}
              {property.images && property.images.length > 1 && (
                <div className="flex mt-2 space-x-2 overflow-x-auto">
                  {property.images.map((img, index) => (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt={img.alt_text || `Thumbnail ${index + 1}`}
                      className={`w-20 h-20 object-cover rounded cursor-pointer border ${selectedImageIndex === index ? "border-blue-500" : "border-gray-300"}`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              {/* Property Specifications */}
              <h2 className="text-2xl font-semibold mb-2">Specifications</h2>
              <ul className="list-disc list-inside">
                <li>
                  <span className="font-semibold">Bedrooms:</span> {property.bedrooms}
                </li>
                <li>
                  <span className="font-semibold">Bathrooms:</span> {property.bathrooms}
                </li>
                <li>
                  <span className="font-semibold">Square Footage:</span> {property.square_footage} sq ft
                </li>
              </ul>
              {property.additional_notes && (
                <div className="mt-4">
                  <h3 className="font-semibold">Additional Notes:</h3>
                  <p>{property.additional_notes}</p>
                </div>
              )}
              {property.tags && property.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold">Tags:</h3>
                  <div className="flex flex-wrap mt-1">
                    {property.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-300 text-gray-800 px-2 py-1 mr-2 mb-2 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Embedded Google Map if latitude and longitude available */}
          {property.latitude !== null && property.longitude !== null && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">Location Map</h2>
              <iframe
                title="Property Map"
                width="100%"
                height="300"
                frameBorder="0"
                src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
              ></iframe>
            </div>
          )}
          <div className="flex space-x-4">
            <Link
              to={`/properties/${property.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_PropertyDetail;