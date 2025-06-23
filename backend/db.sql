-- Drop tables if they already exist to ensure a clean slate
DROP TABLE IF EXISTS property_documents;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;

-- Create the "users" table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    reset_token TEXT,
    reset_expires_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create the "properties" table
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    price NUMERIC NOT NULL,
    status TEXT NOT NULL,
    property_type TEXT NOT NULL,
    bedrooms NUMERIC NOT NULL,
    bathrooms NUMERIC NOT NULL,
    square_footage NUMERIC NOT NULL,
    additional_notes TEXT,
    tags JSON,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id)
        REFERENCES users(id)
);

-- Create the "property_images" table
CREATE TABLE property_images (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    CONSTRAINT fk_property_image
      FOREIGN KEY(property_id)
        REFERENCES properties(id)
);

-- Create the "property_documents" table
CREATE TABLE property_documents (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    document_url TEXT NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT fk_property_document
      FOREIGN KEY(property_id)
        REFERENCES properties(id)
);

--------------------------------------------------
-- SEED DATA
--------------------------------------------------

-- Insert seed data into the "users" table
INSERT INTO users (id, name, email, password_hash, role, reset_token, reset_expires_at, created_at, updated_at) VALUES
('user1', 'Alice Johnson', 'alice@example.com', 'hash1', 'agent', NULL, NULL, '2023-10-01T10:00:00Z', '2023-10-01T10:00:00Z'),
('user2', 'Bob Smith', 'bob@example.com', 'hash2', 'property_manager', NULL, NULL, '2023-10-02T11:00:00Z', '2023-10-02T11:00:00Z'),
('user3', 'Charlie Davis', 'charlie@example.com', 'hash3', 'admin', NULL, NULL, '2023-10-03T12:00:00Z', '2023-10-03T12:00:00Z');

-- Insert seed data into the "properties" table
INSERT INTO properties (id, user_id, title, description, street, city, state, zip_code, country, latitude, longitude, price, status, property_type, bedrooms, bathrooms, square_footage, additional_notes, tags, is_deleted, created_at, updated_at) VALUES
('prop1', 'user1', 'Cozy Cottage', 'A cozy cottage in the countryside with beautiful garden', '123 Maple Street', 'Springfield', 'IL', '62704', 'USA', 39.7817, -89.6501, 120000, 'for_sale', 'residential', 2, 1, 850, 'Great starter home.', '["cozy", "garden", "affordable"]', false, '2023-10-04T09:00:00Z', '2023-10-04T09:00:00Z'),
('prop2', 'user2', 'Modern Downtown Apartment', 'Apartment located in the heart of downtown', '456 Oak Avenue', 'Metropolis', 'NY', '10001', 'USA', 40.7128, -74.0060, 350000, 'for_sale', 'residential', 3, 2, 1200, 'Close to public transport.', '["modern", "downtown", "luxury"]', false, '2023-10-05T10:30:00Z', '2023-10-05T10:30:00Z'),
('prop3', 'user1', 'Spacious Suburban Home', 'A spacious home in a quiet suburb', '789 Birch Road', 'Pleasantville', 'CA', '90001', 'USA', 34.0522, -118.2437, 550000, 'for_sale', 'residential', 4, 3, 2500, 'Recently renovated kitchen.', '["suburban", "family", "spacious"]', false, '2023-10-06T14:00:00Z', '2023-10-06T14:00:00Z'),
('prop4', 'user3', 'Commercial Office Space', 'Office space available in commercial district', '1010 Industrial Blvd', 'Capital City', 'TX', '73301', 'USA', 30.2672, -97.7431, 750000, 'for_rent', 'commercial', 0, 0, 5000, 'Perfect for startups.', '["office", "commercial", "modern"]', false, '2023-10-07T08:00:00Z', '2023-10-07T08:00:00Z'),
('prop5', 'user2', 'Luxury Villa', 'Stunning villa with a pool and scenic views', '2020 Palm Drive', 'Beverly Hills', 'CA', '90210', 'USA', 34.0736, -118.4004, 2000000, 'sold', 'residential', 5, 4, 3500, 'Includes private cinema.', '["luxury", "villa", "pool"]', false, '2023-10-08T16:00:00Z', '2023-10-08T16:00:00Z');

-- Insert seed data into the "property_images" table
INSERT INTO property_images (id, property_id, image_url, alt_text, display_order, created_at) VALUES
('img1', 'prop1', 'https://picsum.photos/seed/prop1_img1/600/400', 'Front view of Cozy Cottage', 1, '2023-10-04T09:05:00Z'),
('img2', 'prop1', 'https://picsum.photos/seed/prop1_img2/600/400', 'Backyard and garden', 2, '2023-10-04T09:06:00Z'),
('img3', 'prop2', 'https://picsum.photos/seed/prop2_img1/600/400', 'Living area view', 1, '2023-10-05T10:35:00Z'),
('img4', 'prop2', 'https://picsum.photos/seed/prop2_img2/600/400', 'Kitchen area', 2, '2023-10-05T10:36:00Z'),
('img5', 'prop3', 'https://picsum.photos/seed/prop3_img1/600/400', 'Exterior of Suburban Home', 1, '2023-10-06T14:05:00Z'),
('img6', 'prop4', 'https://picsum.photos/seed/prop4_img1/600/400', 'Office building exterior', 1, '2023-10-07T08:05:00Z'),
('img7', 'prop5', 'https://picsum.photos/seed/prop5_img1/600/400', 'Luxury villa front view', 1, '2023-10-08T16:05:00Z'),
('img8', 'prop5', 'https://picsum.photos/seed/prop5_img2/600/400', 'Villa pool area', 2, '2023-10-08T16:06:00Z');

-- Insert seed data into the "property_documents" table
INSERT INTO property_documents (id, property_id, document_url, document_name, document_type, created_at) VALUES
('doc1', 'prop1', 'https://picsum.photos/seed/prop1_doc1/600/400', 'Cottage Floor Plan', 'pdf', '2023-10-04T09:10:00Z'),
('doc2', 'prop2', 'https://picsum.photos/seed/prop2_doc1/600/400', 'Apartment Lease Agreement', 'pdf', '2023-10-05T10:40:00Z'),
('doc3', 'prop3', 'https://picsum.photos/seed/prop3_doc1/600/400', 'Suburban Home Inspection Report', 'pdf', '2023-10-06T14:10:00Z'),
('doc4', 'prop4', 'https://picsum.photos/seed/prop4_doc1/600/400', 'Office Space Layout', 'pdf', '2023-10-07T08:10:00Z'),
('doc5', 'prop5', 'https://picsum.photos/seed/prop5_doc1/600/400', 'Villa Brochure', 'pdf', '2023-10-08T16:10:00Z');