import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface MessageResponse {
  message: string;
}

const GV_DeleteConfirmationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  
  const auth_token = useAppStore((state) => state.auth_token);
  const add_notification = useAppStore((state) => state.add_notification);
  const queryClient = useQueryClient();

  const closeModal = () => {
    setIsOpen(false);
    setPropertyId(null);
  };

  const deletePropertyMutation = useMutation<MessageResponse, Error, string>(
    (id: string) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      return axios
        .delete<MessageResponse>(`${baseUrl}/properties/${id}`, {
          headers: { Authorization: `Bearer ${auth_token}` },
        })
        .then((res) => res.data);
    },
    {
      onSuccess: (data) => {
        add_notification({
          id: Date.now().toString(),
          type: "success",
          message: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        closeModal();
      },
      onError: (error) => {
        add_notification({
          id: Date.now().toString(),
          type: "error",
          message: error.message,
        });
      },
    }
  );

  const handleConfirm = () => {
    if (propertyId) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: string }>;
      if (customEvent.detail && customEvent.detail.propertyId) {
        setPropertyId(customEvent.detail.propertyId);
        setIsOpen(true);
      }
    };

    window.addEventListener("openDeleteModal", handleOpenModal);
    return () => {
      window.removeEventListener("openDeleteModal", handleOpenModal);
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md mx-4">
            <h2 id="modal-title" className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mr-2"
                disabled={deletePropertyMutation.isLoading}
              >
                {deletePropertyMutation.isLoading ? "Deleting..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GV_DeleteConfirmationModal;