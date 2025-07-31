-- تحديث قاعدة بيانات MASHROU3Y لدعم نظام المتاجر
-- MASHROU3Y Database Update for Stores System

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

-- إنشاء جدول جلسات الأدمن
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_role VARCHAR(50) NOT NULL, -- student, doctor, freelancer
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    session_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- إنشاء جدول نشاط الأدمن
CREATE TABLE IF NOT EXISTS admin_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تحديث جدول المواد الدراسية لإضافة store_id
ALTER TABLE materials ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- تحديث جدول المشاريع لإضافة store_id
ALTER TABLE projects ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- تحديث جدول العروض التقديمية لإضافة store_id
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_stores_type ON stores(type);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_materials_store_id ON materials(store_id);
CREATE INDEX IF NOT EXISTS idx_projects_store_id ON projects(store_id);
CREATE INDEX IF NOT EXISTS idx_presentations_store_id ON presentations(store_id);

-- إضافة قواعد RLS (Row Level Security)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمتاجر
CREATE POLICY "المتاجر مرئية للجميع" ON stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "الأدمن يمكنه إدارة المتاجر" ON stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email' 
            AND users.user_type IN ('admin', 'owner')
        )
    );

-- سياسات الأمان لجلسات الأدمن
CREATE POLICY "الأدمن يمكنه إدارة جلساته" ON admin_sessions
    FOR ALL USING (
        admin_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email' 
            AND users.user_type IN ('admin', 'owner')
        )
    );

-- سياسات الأمان لنشاط الأدمن
CREATE POLICY "الأدمن يمكنه تسجيل نشاطه" ON admin_activity
    FOR INSERT WITH CHECK (
        admin_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email' 
            AND users.user_type IN ('admin', 'owner')
        )
    );

CREATE POLICY "الأدمن يمكنه عرض نشاطه" ON admin_activity
    FOR SELECT USING (
        admin_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.email = auth.jwt() ->> 'email' 
            AND users.user_type IN ('admin', 'owner')
        )
    );

-- إدراج بيانات تجريبية للمتاجر
INSERT INTO stores (name, type, category, description, created_by) VALUES
('مشاريع هندسة الحاسبات', 'projects', 'هندسة', 'مشاريع تخرج وبرامج جاهزة لطلاب هندسة الحاسبات', auth.uid()),
('عروض محاسبة', 'presentations', 'تجارة', 'عروض PowerPoint احترافية لمادة المحاسبة', auth.uid()),
('ملخصات طب', 'materials', 'طب', 'ملخصات شاملة لطلاب كلية الطب', auth.uid()),
('مشاريع برمجية', 'projects', 'هندسة', 'مشاريع برمجية جاهزة للاستخدام', auth.uid()),
('عروض إدارة أعمال', 'presentations', 'تجارة', 'عروض تقديمية لمادة إدارة الأعمال', auth.uid())
ON CONFLICT (name, type) DO NOTHING;

-- تحديث المنتجات الموجودة لربطها بمتاجر
UPDATE materials SET store_id = (SELECT id FROM stores WHERE type = 'materials' LIMIT 1) WHERE store_id IS NULL;
UPDATE projects SET store_id = (SELECT id FROM stores WHERE type = 'projects' LIMIT 1) WHERE store_id IS NULL;
UPDATE presentations SET store_id = (SELECT id FROM stores WHERE type = 'presentations' LIMIT 1) WHERE store_id IS NULL; 