-- Supabase Schema for TAS Jewellers Jewellery Inventory Management System

-- Drop tables if they exist (clean setup)
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS ledger;
DROP TABLE IF EXISTS sales_entries;
DROP TABLE IF EXISTS stock_entries;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;

-- 1. categories table
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 2. subcategories table
CREATE TABLE subcategories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    CONSTRAINT unique_category_subcategory UNIQUE (category_id, name)
);

-- 3. variants table
CREATE TABLE variants (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    subcategory_id BIGINT REFERENCES subcategories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    CONSTRAINT unique_category_subcategory_variant UNIQUE (category_id, subcategory_id, name)
);

-- 4. stock_entries table
CREATE TABLE stock_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    subcategory_id BIGINT REFERENCES subcategories(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES variants(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL DEFAULT 0.0,
    quantity INTEGER NOT NULL DEFAULT 0,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. sales_entries table
CREATE TABLE sales_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    subcategory_id BIGINT REFERENCES subcategories(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES variants(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL DEFAULT 0.0,
    quantity INTEGER NOT NULL DEFAULT 0,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ledger table
CREATE TABLE ledger (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('ADD', 'SELL')),
    category_name TEXT NOT NULL,
    subcategory_name TEXT,
    variant_name TEXT,
    weight NUMERIC NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. purchases table (Purchase history)
CREATE TABLE purchases (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    variant TEXT,
    detail TEXT,
    weight NUMERIC NOT NULL DEFAULT 0.0,
    quantity INTEGER NOT NULL DEFAULT 0,
    rate NUMERIC NOT NULL DEFAULT 0.0,
    amount NUMERIC NOT NULL DEFAULT 0.0,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. sales table (Sales history)
CREATE TABLE sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name TEXT NOT NULL,
    mobile TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    variant TEXT,
    detail TEXT,
    weight NUMERIC NOT NULL DEFAULT 0.0,
    quantity INTEGER NOT NULL DEFAULT 0,
    rate NUMERIC NOT NULL DEFAULT 0.0,
    discount_amount NUMERIC NOT NULL DEFAULT 0.0,
    amount NUMERIC NOT NULL DEFAULT 0.0,
    bill_id TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. returns table (Returns history)
CREATE TABLE returns (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_id TEXT,
    product_id BIGINT,
    product_code TEXT,
    qty INTEGER NOT NULL DEFAULT 0,
    weight NUMERIC NOT NULL DEFAULT 0.0,
    reason TEXT,
    refund NUMERIC NOT NULL DEFAULT 0.0
);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow full public access for testing and bypass account compatibility)
CREATE POLICY "Allow select categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow insert categories" ON categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select subcategories" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Allow insert subcategories" ON subcategories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select variants" ON variants FOR SELECT USING (true);
CREATE POLICY "Allow insert variants" ON variants FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select stock" ON stock_entries FOR SELECT USING (true);
CREATE POLICY "Allow insert stock" ON stock_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update stock" ON stock_entries FOR UPDATE USING (true);
CREATE POLICY "Allow delete stock" ON stock_entries FOR DELETE USING (true);

CREATE POLICY "Allow select sales_entries" ON sales_entries FOR SELECT USING (true);
CREATE POLICY "Allow insert sales_entries" ON sales_entries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select ledger" ON ledger FOR SELECT USING (true);
CREATE POLICY "Allow insert ledger" ON ledger FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow insert sales" ON sales FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select returns" ON returns FOR SELECT USING (true);
CREATE POLICY "Allow insert returns" ON returns FOR INSERT WITH CHECK (true);

-- Enable Realtime for crucial tables
ALTER PUBLICATION supabase_realtime ADD TABLE stock_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE returns;

-- ─────────────────────────────────────────────────────────────────────────────
-- MASTER DATA SEEDING
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Insert Categories
INSERT INTO categories (name) VALUES 
('கொலுசு'),
('கொடி'),
('மெட்டி'),
('தண்டை'),
('வெள்ளி பொருட்கள்'),
('வெள்ளி செயின்'),
('கைச் செயின்'),
('மற்றவை');

-- 2. Insert Subcategories
-- For கொலுசு
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='கொலுசு'), 'அளவு'),
((SELECT id FROM categories WHERE name='கொலுசு'), 'பாம்பே கொலுசு வகைகள்');

-- For கொடி
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='கொடி'), 'வகைகள்');

-- For மெட்டி
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='மெட்டி'), 'வகைகள்');

-- For தண்டை
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='தண்டை'), 'வகைகள்');

-- For வெள்ளி பொருட்கள்
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'கம்மல்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'டாலர்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'தாயத்து'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'வெள்ளி காயின்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'வெள்ளி மோதிரம்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'வெள்ளி வேல்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), 'காப்பு');

-- For வெள்ளி செயின்
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி செயின்'), 'வகைகள்');

-- For கைச் செயின்
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='கைச் செயின்'), 'வகைகள்');

-- For மற்றவை
INSERT INTO subcategories (category_id, name) VALUES 
((SELECT id FROM categories WHERE name='மற்றவை'), 'பொருட்கள்');


-- 3. Insert Variants

-- For கொலுசு -> அளவு (5" to 12" variants)
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='கொலுசு'),
    (SELECT id FROM subcategories WHERE name='அளவு' AND category_id = (SELECT id FROM categories WHERE name='கொலுசு')),
    name
FROM (VALUES 
    ('5" கொலுசுகள்'), ('5 1/2" கொலுசுகள்'), ('6" கொலுசுகள்'), ('6 1/2" கொலுசுகள்'),
    ('7" கொலுசுகள்'), ('7 1/2" கொலுசுகள்'), ('8" கொலுசுகள்'), ('8 1/2" கொலுசுகள்'),
    ('9" கொலுசுகள்'), ('9 1/2" கொலுசுகள்'), ('10" கொலுசுகள்'), ('10 1/2" கொலுசுகள்'),
    ('11" கொலுசுகள்'), ('11 1/2" கொலுசுகள்'), ('12" கொலுசுகள்')
) AS v(name);

-- For கொலுசு -> பாம்பே கொலுசு வகைகள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='கொலுசு'),
    (SELECT id FROM subcategories WHERE name='பாம்பே கொலுசு வகைகள்' AND category_id = (SELECT id FROM categories WHERE name='கொலுசு')),
    name
FROM (VALUES 
    ('9" to 12" பாம்பே கொலுசுகள்'), 
    ('9" to 12" பால்ஸ் மாடல் கொலுசுகள்'), 
    ('5 1/2" to 12 1/2" பால்ஸ் மாடல் கொலுசுகள்'), 
    ('கிரிஸ்டல் கொலுசு'), 
    ('பாம்பே திருகு மாடல்')
) AS v(name);

-- For கொடி -> வகைகள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='கொடி'),
    (SELECT id FROM subcategories WHERE name='வகைகள்' AND category_id = (SELECT id FROM categories WHERE name='கொடி')),
    name
FROM (VALUES 
    ('முத்தர்னா கொடி'), 
    ('நாய் மணி காசு'),
    ('கொடி ரோல் 1000g'), 
    ('கொடி ரோல் 1500g'), 
    ('கொடி ரோல் 2000g'), 
    ('கொடி ரோல் 2500g'), 
    ('கொடி ரோல் 3000g')
) AS v(name);

-- For மெட்டி -> வகைகள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='மெட்டி'),
    (SELECT id FROM subcategories WHERE name='வகைகள்' AND category_id = (SELECT id FROM categories WHERE name='மெட்டி')),
    name
FROM (VALUES 
    ('சாதா மெட்டி'), 
    ('உருட்டு மெட்டி'), 
    ('உருட்டு நெளிவு மெட்டி'), 
    ('மாப்பிள்ளை மெட்டி'),
    ('பாம்பே மெட்டி'), 
    ('முத்துமெட்டி + ஜல்ரா மெட்டி')
) AS v(name);

-- For தண்டை -> வகைகள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='தண்டை'),
    (SELECT id FROM subcategories WHERE name='வகைகள்' AND category_id = (SELECT id FROM categories WHERE name='தண்டை')),
    name
FROM (VALUES 
    ('வெள்ளி தண்டை'), 
    ('வெள்ளி பாம்பே தண்டை'),
    ('கருகமணி வளையல்'), 
    ('வெள்ளி வளையல்'), 
    ('வெள்ளி வளையல் 92.5'), 
    ('சுருள் வளையல்')
) AS v(name);

-- For வெள்ளி பொருட்கள் -> கம்மல்
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='கம்மல்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'வெள்ளி கம்மல்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='கம்மல்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'வெள்ளி கம்மல் 92.5');

-- For வெள்ளி பொருட்கள் -> டாலர்
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='டாலர்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'வெள்ளி டாலர்');

-- For வெள்ளி பொருட்கள் -> தாயத்து
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='தாயத்து' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'வெள்ளி தாயத்து');

-- For வெள்ளி பொருட்கள் -> வெள்ளி காயின்
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='வெள்ளி காயின்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'சின்னது'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='வெள்ளி காயின்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'பெரியது');

-- For வெள்ளி பொருட்கள் -> வெள்ளி மோதிரம்
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='வெள்ளி மோதிரம்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'லேடீஸ் மோதிரம்'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='வெள்ளி மோதிரம்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'ஜென்ட்ஸ் மோதிரம்');

-- For வெள்ளி பொருட்கள் -> வெள்ளி வேல்
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='வெள்ளி வேல்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'சின்னது'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='வெள்ளி வேல்' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'பெரியது');

-- For வெள்ளி பொருட்கள் -> காப்பு
INSERT INTO variants (category_id, subcategory_id, name) VALUES 
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='காப்பு' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'வெள்ளி காப்பு'),
((SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்'), (SELECT id FROM subcategories WHERE name='காப்பு' AND category_id=(SELECT id FROM categories WHERE name='வெள்ளி பொருட்கள்')), 'வெள்ளி காப்பு 92.5');

-- For வெள்ளி செயின் -> வகைகள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='வெள்ளி செயின்'),
    (SELECT id FROM subcategories WHERE name='வகைகள்' AND category_id = (SELECT id FROM categories WHERE name='வெள்ளி செயின்')),
    name
FROM (VALUES 
    ('சாதா செயின்'), 
    ('92.5 வகை செயின்'),
    ('பேபி செயின் சாதா'), 
    ('பேபி செயின் 92.5'), 
    ('ஃபேன்சி செயின்')
) AS v(name);

-- For கைச் செயின் -> வகைகள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='கைச் செயின்'),
    (SELECT id FROM subcategories WHERE name='வகைகள்' AND category_id = (SELECT id FROM categories WHERE name='கைச் செயின்')),
    name
FROM (VALUES 
    ('கைச் செயின்'), 
    ('கைச் செயின் 92.5'), 
    ('பேபி கைச் செயின்')
) AS v(name);

-- For மற்றவை -> பொருட்கள்
INSERT INTO variants (category_id, subcategory_id, name)
SELECT 
    (SELECT id FROM categories WHERE name='மற்றவை'),
    (SELECT id FROM subcategories WHERE name='பொருட்கள்' AND category_id = (SELECT id FROM categories WHERE name='மற்றவை')),
    name
FROM (VALUES 
    ('காமாட்சி விளக்கு'), 
    ('வெள்ளி கிண்ணம்'), 
    ('வெள்ளி டம்ளர்'),
    ('மூக்குத்தி'), 
    ('கண்மலர்'), 
    ('நேத்திசாமான்கள்'), 
    ('வெள்ளி வாலி')
) AS v(name);
