const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://umzgbhepbzlejtmbhgy.supabase.co';
const supabaseKey = 'sb_publishable_XtAHd2Ag1Qhh15Sd7UfpUg_mFHtiIZa';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('开始创建安全策略...');
  
  const policies = [
    'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE books ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE families ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE family_books ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE modules ENABLE ROW LEVEL SECURITY',
    
    'CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true)',
    'CREATE POLICY "Allow public read on books" ON books FOR SELECT USING (true)',
    'CREATE POLICY "Allow public read on borrow_records" ON borrow_records FOR SELECT USING (true)',
    'CREATE POLICY "Allow public read on families" ON families FOR SELECT USING (true)',
    'CREATE POLICY "Allow public read on family_books" ON family_books FOR SELECT USING (true)',
    'CREATE POLICY "Allow public read on modules" ON modules FOR SELECT USING (true)',
    
    'CREATE POLICY "Allow authenticated insert on users" ON users FOR INSERT WITH CHECK (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated update on users" ON users FOR UPDATE USING (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated delete on users" ON users FOR DELETE USING (auth.role() = \'authenticated\')',
    
    'CREATE POLICY "Allow authenticated insert on books" ON books FOR INSERT WITH CHECK (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated update on books" ON books FOR UPDATE USING (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated delete on books" ON books FOR DELETE USING (auth.role() = \'authenticated\')',
    
    'CREATE POLICY "Allow authenticated insert on borrow_records" ON borrow_records FOR INSERT WITH CHECK (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated update on borrow_records" ON borrow_records FOR UPDATE USING (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated delete on borrow_records" ON borrow_records FOR DELETE USING (auth.role() = \'authenticated\')',
    
    'CREATE POLICY "Allow authenticated insert on families" ON families FOR INSERT WITH CHECK (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated update on families" ON families FOR UPDATE USING (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated delete on families" ON families FOR DELETE USING (auth.role() = \'authenticated\')',
    
    'CREATE POLICY "Allow authenticated insert on family_books" ON family_books FOR INSERT WITH CHECK (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated update on family_books" ON family_books FOR UPDATE USING (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated delete on family_books" ON family_books FOR DELETE USING (auth.role() = \'authenticated\')',
    
    'CREATE POLICY "Allow authenticated insert on modules" ON modules FOR INSERT WITH CHECK (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated update on modules" ON modules FOR UPDATE USING (auth.role() = \'authenticated\')',
    'CREATE POLICY "Allow authenticated delete on modules" ON modules FOR DELETE USING (auth.role() = \'authenticated\')',
  ];
  
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: policy });
      if (error) {
        console.log(`策略执行失败 (忽略): ${policy.substring(0, 50)}...`);
        console.log(`  错误: ${error.message}`);
      } else {
        console.log(`策略创建成功: ${policy.substring(0, 50)}...`);
      }
    } catch (e) {
      console.log(`策略执行失败 (异常): ${policy.substring(0, 50)}...`);
    }
  }
  
  console.log('所有安全策略创建完成！');
}

runMigrations().catch(console.error);