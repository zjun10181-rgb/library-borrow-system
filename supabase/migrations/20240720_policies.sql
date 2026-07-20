-- 启用所有表的行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- 创建公开读取策略（所有表）
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read on books" ON books FOR SELECT USING (true);
CREATE POLICY "Allow public read on borrow_records" ON borrow_records FOR SELECT USING (true);
CREATE POLICY "Allow public read on families" ON families FOR SELECT USING (true);
CREATE POLICY "Allow public read on family_books" ON family_books FOR SELECT USING (true);
CREATE POLICY "Allow public read on modules" ON modules FOR SELECT USING (true);

-- 创建认证用户写入策略（所有表）
CREATE POLICY "Allow authenticated insert on users" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on users" ON users FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on users" ON users FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on books" ON books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on books" ON books FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on books" ON books FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on borrow_records" ON borrow_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on borrow_records" ON borrow_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on borrow_records" ON borrow_records FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on families" ON families FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on families" ON families FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on families" ON families FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on family_books" ON family_books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on family_books" ON family_books FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on family_books" ON family_books FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on modules" ON modules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on modules" ON modules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on modules" ON modules FOR DELETE USING (auth.role() = 'authenticated');

-- 更新管理员用户的ID为认证用户的UID
UPDATE users SET id = (SELECT id FROM auth.users WHERE email = 'admin@library.com');

-- 插入初始模块数据
INSERT INTO modules (id, name, description, icon, created_at, updated_at) VALUES
('m1', '图书管理', '管理图书馆的所有图书', 'BookOpen', CURRENT_DATE, CURRENT_DATE),
('m2', '家庭图书', '管理家庭共享的图书', 'Home', CURRENT_DATE, CURRENT_DATE),
('m3', '借阅管理', '管理图书借阅和归还', 'RotateCcw', CURRENT_DATE, CURRENT_DATE),
('1', '文学经典', '经典文学作品', 'BookOpen', CURRENT_DATE, CURRENT_DATE),
('2', '科技科普', '科技科普读物', 'Globe', CURRENT_DATE, CURRENT_DATE),
('3', '人文历史', '人文历史书籍', 'BookOpen', CURRENT_DATE, CURRENT_DATE),
('4', '儿童读物', '儿童图书', 'Smile', CURRENT_DATE, CURRENT_DATE),
('5', '世界名著', '世界名著', 'BookOpen', CURRENT_DATE, CURRENT_DATE),
('6', '科普读物', '科普读物', 'FlaskConical', CURRENT_DATE, CURRENT_DATE);

SELECT '所有安全策略已创建完成！' AS result;