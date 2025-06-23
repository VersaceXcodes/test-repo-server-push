// server.mjs

// Load environment variables first!
import dotenv from "dotenv";
dotenv.config();

// Import required modules
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";

// Import zod schemas from the schema.ts file
import {
  createPropertyInputSchema,
  updatePropertyInputSchema,
  searchPropertyInputSchema,
  createPropertyImageInputSchema,
  updatePropertyImageInputSchema,
  createPropertyDocumentInputSchema,
  updatePropertyDocumentInputSchema
} from "./schema.ts";

// Set up SendGrid API Key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize postgres pool as specified (DO NOT MODIFY THE SNIPPET)
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // In production, securely set this.
const PORT = process.env.PORT || 3000;

// Create Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// JWT Authentication Middleware
/**
 * Middleware function to verify JWT token from the Authorization header.
 * Attaches the decoded user info to req.user if valid.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// Middleware to verify property ownership
async function verifyPropertyOwnership(req, res, next) {
  const { property_id } = req.params;
  try {
    const propRes = await pool.query("SELECT * FROM properties WHERE id = $1 AND is_deleted = false", [property_id]);
    if (propRes.rowCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    const property = propRes.rows[0];
    if (req.user.role !== 'admin' && req.user.id !== property.user_id) {
      return res.status(403).json({ message: 'Forbidden: Not the property owner' });
    }
    req.property = property;
    next();
  } catch (e) {
    console.error('Error in verifyPropertyOwnership:', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Helper: Get property images and documents for a given property ID
async function getPropertyMedia(property_id) {
  const imagesRes = await pool.query(
    "SELECT * FROM property_images WHERE property_id = $1 ORDER BY display_order ASC",
    [property_id]
  );
  const documentsRes = await pool.query(
    "SELECT * FROM property_documents WHERE property_id = $1 ORDER BY created_at ASC",
    [property_id]
  );
  return { images: imagesRes.rows, documents: documentsRes.rows };
}

// ----------------- AUTHENTICATION ROUTES -----------------

/*
  POST /auth/login
  Authenticates a user by validating email and password.
  @@need:external-api : In a production system, a proper password-hashing mechanism (e.g. bcrypt) must be used.
*/
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    // Query user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Use bcrypt.compare to validate the password against the stored hash
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Remove sensitive information from the response
    delete user.password_hash;

    // Generate JWT token with basic user data
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Error in /auth/login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  POST /auth/forgot-password
  Initiates password reset by generating a resetToken and setting an expiration.
  @@need:external-api : An external email service (e.g., SendGrid, Mailgun) to send reset instructions.
*/
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    // Find the user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) {
      // For security, do not reveal that the email doesn't exist
      return res.status(200).json({ message: "If a user with that email exists, reset instructions have been sent." });
    }
    // Generate a reset token and expiration (e.g., 1 hour from now)
    const resetToken = randomUUID();
    const resetExpiresAt = new Date(Date.now() + 3600000).toISOString();
    const updated_at = new Date().toISOString();
    await pool.query(
      "UPDATE users SET reset_token = $1, reset_expires_at = $2, updated_at = $3 WHERE id = $4",
      [resetToken, resetExpiresAt, updated_at, user.id]
    );
    
    // Prepare the email using SendGrid
    const msg = {
      to: user.email,
      from: process.env.FROM_EMAIL || "noreply@example.com", // Replace with your verified sender
      subject: "Password Reset Instructions",
      text: `Please click on the following link to reset your password: ${(process.env.RESET_URL || "https://yourdomain.com/reset-password")}?token=${resetToken}`,
      html: `<p>Please click on the following <strong><a href="${(process.env.RESET_URL || "https://yourdomain.com/reset-password")}?token=${resetToken}">link</a></strong> to reset your password.</p>`
    };
    
    // Send the email asynchronously
    await sgMail.send(msg);
    
    return res.status(200).json({ message: "Password reset instructions sent" });
  } catch (error) {
    console.error("Error in /auth/forgot-password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------- DASHBOARD ROUTE -----------------

/*
  GET /dashboard
  Retrieves dashboard metrics such as total properties and counts per status.
  Requires valid authentication.
*/
app.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    // Aggregate queries for metric counts
    const totalRes = await pool.query("SELECT COUNT(*) FROM properties WHERE is_deleted = false");
    const forSaleRes = await pool.query("SELECT COUNT(*) FROM properties WHERE status = 'for_sale' AND is_deleted = false");
    const forRentRes = await pool.query("SELECT COUNT(*) FROM properties WHERE status = 'for_rent' AND is_deleted = false");
    const soldRes = await pool.query("SELECT COUNT(*) FROM properties WHERE status = 'sold' AND is_deleted = false");
    const recentRes = await pool.query("SELECT title FROM properties WHERE is_deleted = false ORDER BY created_at DESC LIMIT 5");

    const dashboardData = {
      total_properties: parseInt(totalRes.rows[0].count, 10),
      for_sale_properties: parseInt(forSaleRes.rows[0].count, 10),
      for_rent_properties: parseInt(forRentRes.rows[0].count, 10),
      sold_properties: parseInt(soldRes.rows[0].count, 10),
      recent_activity: recentRes.rows.map(row => row.title)
    };
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error in /dashboard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------- PROPERTY ROUTES -----------------

/*
  GET /properties
  Retrieves list of properties with filtering, sorting and pagination.
  Requires valid authentication.
*/
app.get("/properties", authenticateToken, async (req, res) => {
  try {
    // Validate and parse query parameters using the zod schema
    const parsedQuery = searchPropertyInputSchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({ message: parsedQuery.error.errors });
    }
    let { query, status, property_type, limit, offset, sort_by, sort_order } = parsedQuery.data;
    limit = limit || 10;
    offset = offset || 0;
    sort_by = sort_by || 'created_at';
    sort_order = sort_order || 'asc';
    const allowedSortBy = ['price', 'created_at', 'title'];
    if (!allowedSortBy.includes(sort_by)) {
      sort_by = 'created_at';
    }
    sort_order = (sort_order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
    const conditions = ['is_deleted = false'];
    const values = [];
    let idx = 1;

    // Build filtering conditions
    if (query) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR street ILIKE $${idx} OR city ILIKE $${idx})`);
      values.push(`%${query}%`);
      idx++;
    }
    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (property_type) {
      conditions.push(`property_type = $${idx}`);
      values.push(property_type);
      idx++;
    }
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const orderClause = `ORDER BY ${sort_by} ${sort_order.toUpperCase()}`;
    const limitClause = `LIMIT $${idx} OFFSET $${idx + 1}`;
    values.push(limit, offset);

    // Query properties with filtering and pagination
    const propertiesQuery = `SELECT * FROM properties ${whereClause} ${orderClause} ${limitClause}`;
    const propertiesResult = await pool.query(propertiesQuery, values);

    // Get total count of properties matching the conditions (without limit/offset)
    const countQuery = `SELECT COUNT(*) FROM properties ${whereClause}`;
    const countResult = await pool.query(countQuery, values.slice(0, values.length - 2));

    const properties = propertiesResult.rows;

    // Retrieve media for all properties in a batched query
    const propertyIds = properties.map(p => p.id);
    let imagesMap = {};
    let documentsMap = {};
    if (propertyIds.length > 0) {
      const imagesRes = await pool.query(
        `SELECT * FROM property_images WHERE property_id IN (${propertyIds.map((_, i) => "$" + (i + 1)).join(", ")}) ORDER BY display_order ASC`,
        propertyIds
      );
      imagesRes.rows.forEach(image => {
        imagesMap[image.property_id] = imagesMap[image.property_id] || [];
        imagesMap[image.property_id].push(image);
      });
      const documentsRes = await pool.query(
        `SELECT * FROM property_documents WHERE property_id IN (${propertyIds.map((_, i) => "$" + (i + 1)).join(", ")}) ORDER BY created_at ASC`,
        propertyIds
      );
      documentsRes.rows.forEach(doc => {
        documentsMap[doc.property_id] = documentsMap[doc.property_id] || [];
        documentsMap[doc.property_id].push(doc);
      });
    }
    // Attach images and documents to each property object
    const propertiesWithMedia = properties.map(property => ({
      ...property,
      images: imagesMap[property.id] || [],
      documents: documentsMap[property.id] || []
    }));
    return res.status(200).json({
      properties: propertiesWithMedia,
      total_count: parseInt(countResult.rows[0].count, 10)
    });
  } catch (error) {
    console.error("Error in GET /properties:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  POST /properties
  Creates a new property record using validated input.
  Requires valid authentication.
*/
app.post("/properties", authenticateToken, async (req, res) => {
  try {
    // Validate input using zod schema
    const parseResult = createPropertyInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors });
    }
    const data = parseResult.data;
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    // Use the authenticated user's id
    const insertQuery = `
      INSERT INTO properties 
      (id, user_id, title, description, street, city, state, zip_code, country, latitude, longitude, price, status, property_type, bedrooms, bathrooms, square_footage, additional_notes, tags, is_deleted, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *;
    `;
    const values = [
      id,
      req.user.id,
      data.title,
      data.description,
      data.street,
      data.city,
      data.state,
      data.zip_code,
      data.country,
      data.latitude || null,
      data.longitude || null,
      data.price,
      data.status,
      data.property_type,
      data.bedrooms,
      data.bathrooms,
      data.square_footage,
      data.additional_notes || null,
      data.tags ? JSON.stringify(data.tags) : null,
      false,
      created_at,
      updated_at
    ];
    const result = await pool.query(insertQuery, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error in POST /properties:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  GET /properties/:property_id
  Retrieves details for a specific property including its images and documents.
  Requires valid authentication.
*/
app.get("/properties/:property_id", authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    const propResult = await pool.query("SELECT * FROM properties WHERE id = $1 AND is_deleted = false", [property_id]);
    const property = propResult.rows[0];
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    const media = await getPropertyMedia(property_id);
    return res.status(200).json({ ...property, images: media.images, documents: media.documents });
  } catch (error) {
    console.error("Error in GET /properties/:property_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  PUT /properties/:property_id
  Updates an existing property record with the provided fields.
  Requires valid authentication.
*/
app.put("/properties/:property_id", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    // Validate input using zod schema
    const parseResult = updatePropertyInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors });
    }
    const data = parseResult.data;
    const updated_at = new Date().toISOString();
    
    // Build dynamic SET clause for update query
    let setClauses = [];
    let values = [];
    let idx = 1;
    for (let key in data) {
      if (key !== "id") { // Skip id as it's provided in URL
        setClauses.push(`${key} = $${idx}`);
        values.push(key === "tags" && data[key] ? JSON.stringify(data[key]) : data[key]);
        idx++;
      }
    }
    // Always update updated_at timestamp
    setClauses.push(`updated_at = $${idx}`);
    values.push(updated_at);
    const updateQuery = `UPDATE properties SET ${setClauses.join(", ")} WHERE id = $${idx+1} RETURNING *`;
    values.push(property_id);
    const result = await pool.query(updateQuery, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    const updatedProperty = result.rows[0];
    const media = await getPropertyMedia(property_id);
    return res.status(200).json({ ...updatedProperty, images: media.images, documents: media.documents });
  } catch (error) {
    console.error("Error in PUT /properties/:property_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  DELETE /properties/:property_id
  Soft-deletes a property by setting its is_deleted flag to true.
  Requires valid authentication.
*/
app.delete("/properties/:property_id", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    const updated_at = new Date().toISOString();
    const deleteQuery = "UPDATE properties SET is_deleted = true, updated_at = $1 WHERE id = $2";
    const result = await pool.query(deleteQuery, [updated_at, property_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    return res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /properties/:property_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------- PROPERTY IMAGES ROUTES -----------------

/*
  POST /properties/:property_id/images
  Adds a new image for a specified property.
  Requires valid authentication.
*/
app.post("/properties/:property_id/images", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    // Validate input using zod schema
    const parseResult = createPropertyImageInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors });
    }
    const data = parseResult.data;
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const insertQuery = `
      INSERT INTO property_images (id, property_id, image_url, alt_text, display_order, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      id,
      property_id,
      data.image_url,
      data.alt_text || null,
      data.display_order || 0,
      created_at
    ];
    const result = await pool.query(insertQuery, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error in POST /properties/:property_id/images:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  PUT /properties/:property_id/images/:image_id
  Updates an existing image record.
  Requires valid authentication.
*/
app.put("/properties/:property_id/images/:image_id", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id, image_id } = req.params;
    // Validate using zod schema
    const parseResult = updatePropertyImageInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors });
    }
    const data = parseResult.data;
    let setClauses = [];
    let values = [];
    let idx = 1;
    for (let key in data) {
      setClauses.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    const updateQuery = `UPDATE property_images SET ${setClauses.join(", ")} WHERE id = $${idx} AND property_id = $${idx+1} RETURNING *`;
    values.push(image_id, property_id);
    const result = await pool.query(updateQuery, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Image not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error in PUT /properties/:property_id/images/:image_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  DELETE /properties/:property_id/images/:image_id
  Deletes an image record from a property.
  Requires valid authentication.
*/
app.delete("/properties/:property_id/images/:image_id", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id, image_id } = req.params;
    const deleteQuery = "DELETE FROM property_images WHERE id = $1 AND property_id = $2";
    const result = await pool.query(deleteQuery, [image_id, property_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Image not found" });
    }
    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /properties/:property_id/images/:image_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------- PROPERTY DOCUMENTS ROUTES -----------------

/*
  POST /properties/:property_id/documents
  Adds a new document for a specified property.
  Requires valid authentication.
*/
app.post("/properties/:property_id/documents", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id } = req.params;
    // Validate input using zod schema
    const parseResult = createPropertyDocumentInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors });
    }
    const data = parseResult.data;
    const id = randomUUID();
    const created_at = new Date().toISOString();
    const insertQuery = `
      INSERT INTO property_documents (id, property_id, document_url, document_name, document_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      id,
      property_id,
      data.document_url,
      data.document_name,
      data.document_type,
      created_at
    ];
    const result = await pool.query(insertQuery, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error in POST /properties/:property_id/documents:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  PUT /properties/:property_id/documents/:document_id
  Updates an existing document record.
  Requires valid authentication.
*/
app.put("/properties/:property_id/documents/:document_id", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id, document_id } = req.params;
    // Validate using zod schema
    const parseResult = updatePropertyDocumentInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.errors });
    }
    const data = parseResult.data;
    let setClauses = [];
    let values = [];
    let idx = 1;
    for (let key in data) {
      setClauses.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    const updateQuery = `UPDATE property_documents SET ${setClauses.join(", ")} WHERE id = $${idx} AND property_id = $${idx+1} RETURNING *`;
    values.push(document_id, property_id);
    const result = await pool.query(updateQuery, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error in PUT /properties/:property_id/documents/:document_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*
  DELETE /properties/:property_id/documents/:document_id
  Deletes a document record from a property.
  Requires valid authentication.
*/
app.delete("/properties/:property_id/documents/:document_id", authenticateToken, verifyPropertyOwnership, async (req, res) => {
  try {
    const { property_id, document_id } = req.params;
    const deleteQuery = "DELETE FROM property_documents WHERE id = $1 AND property_id = $2";
    const result = await pool.query(deleteQuery, [document_id, property_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /properties/:property_id/documents/:document_id:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------- SPA CATCH-ALL ROUTE -----------------

// Catch-all route for SPA routing: every other request returns index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});