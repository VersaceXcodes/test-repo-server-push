import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from '@/store/main';
import { Property, UpdatePropertyInput, CreatePropertyImageInput, PropertyImage } from "@schema";

const UV_PropertyEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = useAppStore((state) => state.auth_token);
  const addNotification = useAppStore((state) => state.add_notification);
  const navigate = useNavigate();

  // Fetch the property details.
  const fetchProperty = async (): Promise<Property> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/properties/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  };

  const { data: property, isLoading, isError, error, refetch } = useQuery<Property, Error>(["property", id], fetchProperty);

  // Local state for property form fields.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState("for_sale");
  const [propertyType, setPropertyType] = useState("residential");
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [squareFootage, setSquareFootage] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [tags, setTags] = useState("");

  // Local state for new image addition.
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");

  // When property data is fetched, pre-populate form fields.
  useEffect(() => {
    if (property) {
      setTitle(property.title);
      setDescription(property.description);
      setStreet(property.street);
      setCity(property.city);
      setStateField(property.state);
      setZipCode(property.zip_code);
      setCountry(property.country);
      setLatitude(property.latitude || 0);
      setLongitude(property.longitude || 0);
      setPrice(property.price);
      setStatus(property.status);
      setPropertyType(property.property_type);
      setBedrooms(property.bedrooms);
      setBathrooms(property.bathrooms);
      setSquareFootage(property.square_footage);
      setAdditionalNotes(property.additional_notes || "");
      setTags(property.tags ? property.tags.join(", ") : "");
    }
  }, [property]);

  // Mutation to update property details.
  const updatePropertyMutation = useMutation(async () => {
    const payload: UpdatePropertyInput = {
      id: property?.id!,
      title,
      description,
      street,
      city,
      state: stateField,
      zip_code: zipCode,
      country,
      latitude: latitude,
      longitude: longitude,
      price,
      status,
      property_type: propertyType,
      bedrooms,
      bathrooms,
      square_footage: squareFootage,
      additional_notes: additionalNotes,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
    };
    const response = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/properties/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }, {
    onSuccess: () => {
      navigate(`/properties/${id}`);
    },
    onError: (err: any) => {
      addNotification({
        id: Date.now().toString(),
        type: "error",
        message: err.message || "Failed to update property"
      });
    }
  });

  // Mutation to add a new image.
  const addImageMutation = useMutation(async () => {
    const payload: CreatePropertyImageInput = {
      property_id: property?.id!,
      image_url: newImageUrl,
      alt_text: newImageAlt ? newImageAlt : null,
      display_order: 0,
    };
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/properties/${id}/images`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }, {
    onSuccess: () => {
      setNewImageUrl("");
      setNewImageAlt("");
      refetch();
    },
    onError: (err: any) => {
      addNotification({
        id: Date.now().toString(),
        type: "error",
        message: err.message || "Failed to add image"
      });
    }
  });

  // Mutation to delete an image.
  const deleteImageMutation = useMutation(async (imageId: string) => {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/properties/${id}/images/${imageId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }, {
    onSuccess: () => {
      refetch();
    },
    onError: (err: any) => {
      addNotification({
        id: Date.now().toString(),
        type: "error",
        message: err.message || "Failed to delete image"
      });
    }
  });

  // Handle form submission to update property details.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePropertyMutation.mutate();
  };

  return (
    <>
      {isLoading && <p className="text-center text-xl">Loading...</p>}
      {isError && <p className="text-center text-red-500">Error: {error?.message}</p>}
      {property && (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 bg-white shadow-md rounded">
          <h1 className="text-2xl font-bold mb-4">Edit Property</h1>
          <div className="mb-4">
            <label className="block text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 p-2 border rounded w-full"
              rows={4}
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700">Street</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700">State</label>
              <input
                type="text"
                value={stateField}
                onChange={(e) => setStateField(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700">Zip Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700">Latitude</label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700">Longitude</label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              >
                <option value="for_sale">For Sale</option>
                <option value="for_rent">For Rent</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                required
                className="mt-1 p-2 border rounded w-full"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700">Bathrooms</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-gray-700">Square Footage</label>
              <input
                type="number"
                value={squareFootage}
                onChange={(e) => setSquareFootage(Number(e.target.value))}
                required
                className="mt-1 p-2 border rounded w-full"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
              rows={3}
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 p-2 border rounded w-full"
            />
          </div>
          {/* Image management */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Property Images</label>
            <div className="flex flex-wrap gap-4">
              {property.images &&
                property.images.map((img: PropertyImage) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || "Property Image"}
                      className="w-32 h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => deleteImageMutation.mutate(img.id)}
                      className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="New Image URL"
                className="p-2 border rounded flex-1"
              />
              <input
                type="text"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                placeholder="Alt Text (optional)"
                className="p-2 border rounded flex-1"
              />
              <button
                type="button"
                onClick={() => { if (newImageUrl) { addImageMutation.mutate(); } }}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add Image
              </button>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex justify-end gap-4">
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
              Save Changes
            </button>
            <Link to={`/properties/${id}`} className="bg-gray-500 text-white px-4 py-2 rounded">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </>
  );
};

export default UV_PropertyEdit;