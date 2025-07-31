-- MASHROU3Y Database Schema
-- هيكل قاعدة بيانات منصة مشروعي

-- إنشاء جدول المتاجر
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- نوع المتجر: materials, projects, presentations
    category VARCHAR(100) NOT NULL, -- التخصص: هندسة، طب، تجارة، إلخ
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(name, type)
);

-- إنشاء جدول المستخدمين (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    university VARCHAR(255),
    faculty VARCHAR(255),
    department VARCHAR(255),
    year INTEGER,
    user_type VARCHAR(50) DEFAULT 'student', -- student, doctor, freelancer, admin, owner
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_completed BOOLEAN DEFAULT false,
    avatar_url TEXT,
    bio TEXT,
    social_links JSONB,
    preferences JSONB
);

-- إنشاء جدول المواد الدراسية
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    subject VARCHAR(255),
    faculty VARCHAR(255),
    year INTEGER,
    semester VARCHAR(50),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    tags TEXT[],
    thumbnail_url TEXT
);

-- إنشاء جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    subject VARCHAR(255),
    faculty VARCHAR(255),
    year INTEGER,
    semester VARCHAR(50),
    project_type VARCHAR(100), -- graduation, course, research
    technologies TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    tags TEXT[],
    thumbnail_url TEXT
);

-- إنشاء جدول العروض التقديمية
CREATE TABLE IF NOT EXISTS presentations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    subject VARCHAR(255),
    faculty VARCHAR(255),
    year INTEGER,
    semester VARCHAR(50),
    slides_count INTEGER,
    presentation_type VARCHAR(100), -- academic, business, creative
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    tags TEXT[],
    thumbnail_url TEXT
);

-- إنشاء جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type VARCHAR(50) NOT NULL, -- material, project, presentation
    product_id UUID NOT NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled, refunded
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- إنشاء جدول المراجعات
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type VARCHAR(50) NOT NULL, -- material, project, presentation
    product_id UUID NOT NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT false,
    UNIQUE(user_id, product_type, product_id)
);

-- إنشاء جدول نشاطات الأدمن
CREATE TABLE IF NOT EXISTS admin_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- user, material, project, presentation, store
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول إعدادات النظام
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_url TEXT,
    action_text VARCHAR(100)
);

-- إنشاء جدول جلسات الأدمن (للدخول كزائر)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_role VARCHAR(50) NOT NULL, -- student, doctor, freelancer
    store_id UUID REFERENCES stores(id),
    session_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_materials_store_id ON materials(store_id);
CREATE INDEX IF NOT EXISTS idx_projects_store_id ON projects(store_id);
CREATE INDEX IF NOT EXISTS idx_presentations_store_id ON presentations(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON presentations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إنشاء RLS Policies للأمان
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمتاجر
CREATE POLICY "المتاجر مرئية للجميع" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "الأدمن يمكنه إدارة المتاجر" ON stores FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_type IN ('admin', 'owner')
    )
);

-- سياسات الأمان للمستخدمين
CREATE POLICY "المستخدم يمكنه رؤية ملفه الشخصي" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "الأدمن يمكنه رؤية جميع المستخدمين" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_type IN ('admin', 'owner')
    )
);

-- سياسات الأمان للمواد الدراسية
CREATE POLICY "المواد المعتمدة مرئية للجميع" ON materials FOR SELECT USING (is_approved = true AND is_active = true);
CREATE POLICY "المستخدم يمكنه رؤية مواده" ON materials FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "الأدمن يمكنه إدارة جميع المواد" ON materials FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_type IN ('admin', 'owner')
    )
);

-- سياسات الأمان للمشاريع
CREATE POLICY "المشاريع المعتمدة مرئية للجميع" ON projects FOR SELECT USING (is_approved = true AND is_active = true);
CREATE POLICY "المستخدم يمكنه رؤية مشاريعه" ON projects FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "الأدمن يمكنه إدارة جميع المشاريع" ON projects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_type IN ('admin', 'owner')
    )
);

-- سياسات الأمان للعروض التقديمية
CREATE POLICY "العروض المعتمدة مرئية للجميع" ON presentations FOR SELECT USING (is_approved = true AND is_active = true);
CREATE POLICY "المستخدم يمكنه رؤية عروضه" ON presentations FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "الأدمن يمكنه إدارة جميع العروض" ON presentations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.user_type IN ('admin', 'owner')
    )
);

-- إدراج بيانات أولية للمتاجر
INSERT INTO stores (name, type, category, description, created_by) VALUES
('مشاريع هندسة مدنية', 'projects', 'هندسة', 'مشاريع تخرج وتمارين للهندسة المدنية', NULL),
('عروض محاسبة', 'presentations', 'تجارة', 'عروض PowerPoint لمادة المحاسبة', NULL),
('مواد برمجة', 'materials', 'هندسة', 'ملخصات ومحاضرات البرمجة', NULL),
('مشاريع طب', 'projects', 'طب', 'مشاريع وأبحاث طبية', NULL),
('عروض إدارة أعمال', 'presentations', 'تجارة', 'عروض لمادة إدارة الأعمال', NULL);

-- إدراج إعدادات النظام
INSERT INTO system_settings (key, value, description) VALUES
('site_name', '"MASHROU3Y"', 'اسم الموقع'),
('site_description', '"منصة الطلاب الجامعية"', 'وصف الموقع'),
('commission_rate', '0.1', 'نسبة العمولة (10%)'),
('min_approval_rating', '4.0', 'الحد الأدنى للتقييم للموافقة'),
('max_file_size', '10485760', 'الحد الأقصى لحجم الملف (10MB)'),
('allowed_file_types', '["pdf", "doc", "docx", "ppt", "pptx", "zip", "rar"]', 'أنواع الملفات المسموحة'); 