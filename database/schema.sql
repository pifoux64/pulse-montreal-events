-- Schéma de base de données pour Montréal Events
-- À exécuter dans votre projet Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sub-categories table
CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_address TEXT NOT NULL,
    location_city VARCHAR(100) NOT NULL,
    location_postal_code VARCHAR(10) NOT NULL,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    price_amount DECIMAL(10, 2) DEFAULT 0,
    price_currency VARCHAR(3) DEFAULT 'CAD',
    price_is_free BOOLEAN DEFAULT false,
    image_url TEXT,
    ticket_url TEXT,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_capacity INTEGER,
    current_attendees INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom filters table
CREATE TABLE custom_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'boolean', 'select', 'number')),
    options TEXT[],
    is_required BOOLEAN DEFAULT false,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accessibility table
CREATE TABLE accessibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    wheelchair_accessible BOOLEAN DEFAULT false,
    hearing_assistance BOOLEAN DEFAULT false,
    visual_assistance BOOLEAN DEFAULT false,
    quiet_space BOOLEAN DEFAULT false,
    gender_neutral_bathrooms BOOLEAN DEFAULT false,
    other TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event target audience table
CREATE TABLE event_target_audience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    audience VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorite_categories TEXT[] DEFAULT '{}',
    favorite_sub_categories TEXT[] DEFAULT '{}',
    preferred_radius INTEGER DEFAULT 5,
    notifications JSONB DEFAULT '{"email": true, "push": true, "favorites": true, "recommendations": true}',
    language VARCHAR(2) DEFAULT 'fr',
    timezone VARCHAR(50) DEFAULT 'America/Montreal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('favorite', 'reminder', 'new_event', 'custom')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_location ON events(location_lat, location_lng);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_event ON favorites(event_id);
CREATE INDEX idx_custom_filters_event ON custom_filters(event_id);
CREATE INDEX idx_accessibility_event ON accessibility(event_id);
CREATE INDEX idx_target_audience_event ON event_target_audience(event_id);

-- Spatial index for location-based queries
CREATE INDEX idx_events_location_spatial ON events USING GIST (
    ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO categories (name, name_en, icon, color) VALUES
('Musique', 'Music', '🎵', '#e74c3c'),
('Art & Culture', 'Art & Culture', '🎨', '#9b59b6'),
('Sport', 'Sports', '⚽', '#3498db'),
('Famille', 'Family', '👨‍👩‍👧‍👦', '#f39c12'),
('Gastronomie', 'Food & Drink', '🍽️', '#e67e22'),
('Théâtre', 'Theater', '🎭', '#1abc9c'),
('Cinéma', 'Cinema', '🎬', '#34495e'),
('Festival', 'Festival', '🎉', '#f1c40f');

-- Insert sample sub-categories
INSERT INTO sub_categories (name, name_en, category_id) VALUES
('Reggae', 'Reggae', (SELECT id FROM categories WHERE name = 'Musique')),
('Jazz', 'Jazz', (SELECT id FROM categories WHERE name = 'Musique')),
('Rock', 'Rock', (SELECT id FROM categories WHERE name = 'Musique')),
('Électronique', 'Electronic', (SELECT id FROM categories WHERE name = 'Musique')),
('Exposition', 'Exhibition', (SELECT id FROM categories WHERE name = 'Art & Culture')),
('Théâtre', 'Theater', (SELECT id FROM categories WHERE name = 'Art & Culture')),
('Cinéma', 'Cinema', (SELECT id FROM categories WHERE name = 'Art & Culture')),
('Football', 'Soccer', (SELECT id FROM categories WHERE name = 'Sport')),
('Basketball', 'Basketball', (SELECT id FROM categories WHERE name = 'Sport')),
('Course', 'Running', (SELECT id FROM categories WHERE name = 'Sport'));

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_target_audience ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all events
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

-- Organizers can insert/update/delete their own events
CREATE POLICY "Organizers can manage their events" ON events
    FOR ALL USING (organizer_id = auth.uid());

-- Users can manage their own favorites
CREATE POLICY "Users can manage their favorites" ON favorites
    FOR ALL USING (user_id = auth.uid());

-- Users can manage their own preferences
CREATE POLICY "Users can manage their preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Users can read their own notifications
CREATE POLICY "Users can read their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
