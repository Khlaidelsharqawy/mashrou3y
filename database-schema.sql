-- MASHROU3Y Database Schema
-- Comprehensive schema for the educational platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_type AS ENUM ('student', 'instructor', 'freelancer', 'store_owner', 'admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE content_type AS ENUM ('material', 'project', 'presentation', 'video', 'document');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    user_type user_type NOT NULL DEFAULT 'student',
    location TEXT,
    university TEXT,
    faculty TEXT,
    specialization TEXT,
    academic_year TEXT,
    skills TEXT[],
    bio TEXT,
    avatar_url TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approval_status approval_status DEFAULT 'pending',
    profile_completed BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content table (materials, projects, presentations)
CREATE TABLE content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    category TEXT,
    subject TEXT,
    university TEXT,
    faculty TEXT,
    year TEXT,
    file_url TEXT,
    thumbnail_url TEXT,
    preview_url TEXT,
    is_free BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    file_size BIGINT,
    file_type TEXT,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    cover_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    owner_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    images_urls TEXT[],
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    weight DECIMAL(8,2),
    dimensions JSONB,
    tags TEXT[],
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelancer profiles table
CREATE TABLE freelancer_profiles (
    id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    portfolio_url TEXT,
    hourly_rate DECIMAL(8,2),
    availability TEXT,
    languages TEXT[],
    certifications TEXT[],
    work_experience TEXT,
    completed_projects INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    response_time TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES profiles(id) NOT NULL,
    store_id UUID REFERENCES stores(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status transaction_status DEFAULT 'pending',
    payment_method TEXT,
    payment_id TEXT,
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    content_id UUID REFERENCES content(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Downloads table (track user downloads)
CREATE TABLE downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    content_id UUID REFERENCES content(id) NOT NULL,
    order_id UUID REFERENCES orders(id),
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    download_count INTEGER DEFAULT 1,
    UNIQUE(user_id, content_id)
);

-- Reviews and ratings table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES profiles(id) NOT NULL,
    content_id UUID REFERENCES content(id),
    product_id UUID REFERENCES products(id),
    store_id UUID REFERENCES stores(id),
    freelancer_id UUID REFERENCES profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages/Chat table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    receiver_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type TEXT DEFAULT 'text',
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table (for tracking active sessions)
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    session_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites/Bookmarks table
CREATE TABLE favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    content_id UUID REFERENCES content(id),
    product_id UUID REFERENCES products(id),
    store_id UUID REFERENCES stores(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id),
    UNIQUE(user_id, product_id),
    UNIQUE(user_id, store_id)
);

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content access permissions
CREATE TABLE content_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    content_id UUID REFERENCES content(id) NOT NULL,
    access_type TEXT NOT NULL DEFAULT 'view', -- view, download, edit
    granted_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id, access_type)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_category ON content(category);
CREATE INDEX idx_content_created_by ON content(created_by);
CREATE INDEX idx_content_is_approved ON content(is_approved);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (is_approved = true);

-- Content policies
CREATE POLICY "Anyone can view approved content" ON content
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own content" ON content
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create content" ON content
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own content" ON content
    FOR UPDATE USING (auth.uid() = created_by);

-- Store policies
CREATE POLICY "Anyone can view active stores" ON stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Store owners can manage their stores" ON stores
    FOR ALL USING (auth.uid() = owner_id);

-- Product policies
CREATE POLICY "Anyone can view available products" ON products
    FOR SELECT USING (is_available = true);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update content rating
CREATE OR REPLACE FUNCTION update_content_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE content 
    SET 
        rating = (
            SELECT AVG(rating)::DECIMAL(3,2) 
            FROM reviews 
            WHERE content_id = NEW.content_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE content_id = NEW.content_id
        )
    WHERE id = NEW.content_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update content rating after review
CREATE TRIGGER update_content_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW 
    WHEN (NEW.content_id IS NOT NULL OR OLD.content_id IS NOT NULL)
    EXECUTE FUNCTION update_content_rating();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add activity logging triggers
CREATE TRIGGER log_content_activity
    AFTER INSERT OR UPDATE OR DELETE ON content
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_order_activity
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Materials', 'materials', 'Educational materials and summaries', 'fas fa-book', '#3B82F6'),
('Projects', 'projects', 'Ready-made projects and code', 'fas fa-code', '#10B981'),
('Presentations', 'presentations', 'PowerPoint presentations', 'fas fa-presentation', '#8B5CF6'),
('Electronics', 'electronics', 'Electronic devices and accessories', 'fas fa-microchip', '#F59E0B'),
('Books', 'books', 'Textbooks and references', 'fas fa-book-open', '#EF4444'),
('Stationery', 'stationery', 'Office and study supplies', 'fas fa-pen', '#6B7280');

-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(admin_email TEXT, admin_password TEXT)
RETURNS UUID AS $$
DECLARE
    admin_id UUID;
BEGIN
    -- This function should be called by a superuser to create admin accounts
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    )
    RETURNING id INTO admin_id;
    
    INSERT INTO profiles (id, email, full_name, user_type, is_approved, profile_completed)
    VALUES (
        admin_id,
        admin_email,
        'System Administrator',
        'admin',
        true,
        true
    );
    
    RETURN admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views for easier data access

-- Content with creator info
CREATE VIEW content_with_creator AS
SELECT 
    c.*,
    p.full_name as creator_name,
    p.user_type as creator_type,
    p.university as creator_university
FROM content c
LEFT JOIN profiles p ON c.created_by = p.id;

-- Popular content view
CREATE VIEW popular_content AS
SELECT 
    c.*,
    p.full_name as creator_name,
    (c.view_count * 0.3 + c.download_count * 0.7 + c.rating * c.rating_count * 0.1) as popularity_score
FROM content c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.is_approved = true
ORDER BY popularity_score DESC;

-- Store statistics view
CREATE VIEW store_statistics AS
SELECT 
    s.*,
    COUNT(p.id) as product_count,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_revenue
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
LEFT JOIN orders o ON s.id = o.store_id AND o.status = 'completed'
GROUP BY s.id;

-- User analytics view
CREATE VIEW user_analytics AS
SELECT 
    p.*,
    COUNT(DISTINCT c.id) as content_count,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT r.id) as review_count,
    AVG(r.rating) as avg_rating_received
FROM profiles p
LEFT JOIN content c ON p.id = c.created_by
LEFT JOIN orders o ON p.id = o.customer_id
LEFT JOIN reviews r ON p.id = r.freelancer_id OR p.id = (SELECT created_by FROM content WHERE id = r.content_id)
GROUP BY p.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT ON content_with_creator TO authenticated;
GRANT SELECT ON content_with_creator TO anon;
GRANT SELECT ON popular_content TO authenticated;
GRANT SELECT ON popular_content TO anon;
GRANT SELECT ON store_statistics TO authenticated;
GRANT SELECT ON user_analytics TO authenticated;

-- Comment the tables
COMMENT ON TABLE profiles IS 'Extended user profiles with additional information';
COMMENT ON TABLE content IS 'Educational content including materials, projects, and presentations';
COMMENT ON TABLE stores IS 'Online stores managed by store owners';
COMMENT ON TABLE products IS 'Products sold in stores';
COMMENT ON TABLE orders IS 'Customer orders for products and content';
COMMENT ON TABLE downloads IS 'Track user downloads of purchased content';
COMMENT ON TABLE reviews IS 'User reviews and ratings';
COMMENT ON TABLE messages IS 'Private messages between users';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE activity_logs IS 'Audit trail of user activities';
COMMENT ON TABLE favorites IS 'User bookmarks and favorites';
COMMENT ON TABLE content_access IS 'Content access permissions and restrictions';