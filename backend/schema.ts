import { z } from 'zod';

/* =====================================================
   USERS SCHEMAS
===================================================== */

// Entity schema for "users"
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email({ message: "Invalid email address" }),
  password_hash: z.string(),
  role: z.enum(['agent', 'property_manager', 'admin']),
  reset_token: z.string().nullable(),
  reset_expires_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// Input schema for creating a new user (auto-generated fields omitted)
export const createUserInputSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).max(255),
  email: z.string().email({ message: "Invalid email address" }),
  password_hash: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(['agent', 'property_manager', 'admin']),
  // Optional reset fields if provided
  reset_token: z.string().nullable().optional(),
  reset_expires_at: z.coerce.date().nullable().optional(),
});

// Input schema for updating an existing user (all fields optional except id)
export const updateUserInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Name cannot be empty" }).max(255).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password_hash: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  role: z.enum(['agent', 'property_manager', 'admin']).optional(),
  reset_token: z.string().nullable().optional(),
  reset_expires_at: z.coerce.date().nullable().optional(),
});

// Query schema for searching/filtering users
export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().min(0).default(0),
  sort_by: z.enum(['name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Inferred Types for users
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;


/* =====================================================
   PROPERTIES SCHEMAS
===================================================== */

// Entity schema for "properties"
export const propertySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  price: z.number(),
  status: z.enum(['for_sale', 'for_rent', 'sold']),
  property_type: z.enum(['residential', 'commercial']),
  bedrooms: z.number().int(),
  bathrooms: z.number().int(),
  square_footage: z.number().int(),
  additional_notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  is_deleted: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// Input schema for creating a new property (auto-generated fields omitted)
export const createPropertyInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  street: z.string().min(1, { message: "Street is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zip_code: z.string().min(1, { message: "Zip code is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  price: z.number(),
  status: z.enum(['for_sale', 'for_rent', 'sold']),
  property_type: z.enum(['residential', 'commercial']),
  bedrooms: z.number().int(),
  bathrooms: z.number().int(),
  square_footage: z.number().int(),
  additional_notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

// Input schema for updating an existing property
export const updatePropertyInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  title: z.string().min(1, { message: "Title cannot be empty" }).optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }).optional(),
  street: z.string().min(1, { message: "Street cannot be empty" }).optional(),
  city: z.string().min(1, { message: "City cannot be empty" }).optional(),
  state: z.string().min(1, { message: "State cannot be empty" }).optional(),
  zip_code: z.string().min(1, { message: "Zip code cannot be empty" }).optional(),
  country: z.string().min(1, { message: "Country cannot be empty" }).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  price: z.number().optional(),
  status: z.enum(['for_sale', 'for_rent', 'sold']).optional(),
  property_type: z.enum(['residential', 'commercial']).optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  square_footage: z.number().int().optional(),
  additional_notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  is_deleted: z.boolean().optional(),
});

// Query schema for searching/filtering properties
export const searchPropertyInputSchema = z.object({
  query: z.string().optional(),
  user_id: z.string().optional(),
  status: z.enum(['for_sale', 'for_rent', 'sold']).optional(),
  property_type: z.enum(['residential', 'commercial']).optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().min(0).default(0),
  // Sorting can be extended based on the available fields.
  sort_by: z.enum(['created_at', 'price', 'bedrooms', 'bathrooms']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Inferred Types for properties
export type Property = z.infer<typeof propertySchema>;
export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertyInputSchema>;
export type SearchPropertyInput = z.infer<typeof searchPropertyInputSchema>;


/* =====================================================
   PROPERTY IMAGES SCHEMAS
===================================================== */

// Entity schema for "property_images"
export const propertyImageSchema = z.object({
  id: z.string(),
  property_id: z.string(),
  image_url: z.string(),
  alt_text: z.string().nullable(),
  display_order: z.number().int(),
  created_at: z.coerce.date(),
});

// Input schema for creating a new property image (auto-generated fields omitted)
export const createPropertyImageInputSchema = z.object({
  property_id: z.string(),
  image_url: z.string().url({ message: "Invalid image URL" }),
  alt_text: z.string().nullable().optional(),
  display_order: z.number().int().optional().default(0),
});

// Input schema for updating an existing property image
export const updatePropertyImageInputSchema = z.object({
  id: z.string(),
  property_id: z.string().optional(),
  image_url: z.string().url({ message: "Invalid image URL" }).optional(),
  alt_text: z.string().nullable().optional(),
  display_order: z.number().int().optional(),
});

// Query schema for searching/filtering property images
export const searchPropertyImageInputSchema = z.object({
  property_id: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().min(0).default(0),
  sort_by: z.enum(['display_order', 'created_at']).default('display_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Inferred Types for property images
export type PropertyImage = z.infer<typeof propertyImageSchema>;
export type CreatePropertyImageInput = z.infer<typeof createPropertyImageInputSchema>;
export type UpdatePropertyImageInput = z.infer<typeof updatePropertyImageInputSchema>;
export type SearchPropertyImageInput = z.infer<typeof searchPropertyImageInputSchema>;


/* =====================================================
   PROPERTY DOCUMENTS SCHEMAS
===================================================== */

// Entity schema for "property_documents"
export const propertyDocumentSchema = z.object({
  id: z.string(),
  property_id: z.string(),
  document_url: z.string().url({ message: "Invalid document URL" }),
  document_name: z.string(),
  document_type: z.string(),
  created_at: z.coerce.date(),
});

// Input schema for creating a new property document (auto-generated fields omitted)
export const createPropertyDocumentInputSchema = z.object({
  property_id: z.string(),
  document_url: z.string().url({ message: "Invalid document URL" }),
  document_name: z.string().min(1, { message: "Document name is required" }),
  document_type: z.string().min(1, { message: "Document type is required" }),
});

// Input schema for updating an existing property document
export const updatePropertyDocumentInputSchema = z.object({
  id: z.string(),
  property_id: z.string().optional(),
  document_url: z.string().url({ message: "Invalid document URL" }).optional(),
  document_name: z.string().min(1, { message: "Document name cannot be empty" }).optional(),
  document_type: z.string().min(1, { message: "Document type cannot be empty" }).optional(),
});

// Query schema for searching/filtering property documents
export const searchPropertyDocumentInputSchema = z.object({
  property_id: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().min(0).default(0),
  sort_by: z.enum(['created_at', 'document_name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Inferred Types for property documents
export type PropertyDocument = z.infer<typeof propertyDocumentSchema>;
export type CreatePropertyDocumentInput = z.infer<typeof createPropertyDocumentInputSchema>;
export type UpdatePropertyDocumentInput = z.infer<typeof updatePropertyDocumentInputSchema>;
export type SearchPropertyDocumentInput = z.infer<typeof searchPropertyDocumentInputSchema>;