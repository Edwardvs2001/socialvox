
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS encuestas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE encuestas_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'admin-manager', 'surveyor') NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL
);

-- Tabla de encuestas
CREATE TABLE IF NOT EXISTS surveys (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    questions JSON,
    created_at DATETIME NOT NULL,
    assigned_to JSON
);

-- Tabla de respuestas de encuestas
CREATE TABLE IF NOT EXISTS survey_responses (
    id VARCHAR(36) PRIMARY KEY,
    survey_id VARCHAR(36) NOT NULL,
    response_data JSON NOT NULL,
    created_at DATETIME NOT NULL,
    created_by VARCHAR(36),
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- Usuario admin por defecto (contraseña: admin123)
INSERT INTO users (id, username, password, role, name, email, created_at) VALUES 
(UUID(), 'admin', '$2y$10$8H7hPHVaARFgKJKYe3mSJ.4/GGGp1xiRVsZ8v2E8a2TKKuPqiL9wa', 'admin', 'Administrador', 'admin@example.com', NOW());
