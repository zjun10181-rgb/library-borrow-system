const { Client } = require('pg');

const client = new Client({
  host: 'umzgbhepbzlejtmbhgy.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'sb_publishable_XtAHd2Ag1Qhh15Sd7UfpUg_mFHtiIZa',
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('数据库连接成功！');
    
    const sql = `
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE books ENABLE ROW LEVEL SECURITY;
      ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;
      ALTER TABLE families ENABLE ROW LEVEL SECURITY;
      ALTER TABLE family_books ENABLE ROW LEVEL SECURITY;
      ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
      CREATE POLICY "Allow public read on books" ON books FOR SELECT USING (true);
      CREATE POLICY "Allow public read on borrow_records" ON borrow_records FOR SELECT USING (true);
      CREATE POLICY "Allow public read on families" ON families FOR SELECT USING (true);
      CREATE POLICY "Allow public read on family_books" ON family_books FOR SELECT USING (true);
      CREATE POLICY "Allow public read on modules" ON modules FOR SELECT USING (true);
      
      CREATE POLICY "Allow authenticated write on users" ON users FOR ALL USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated write on books" ON books FOR ALL USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated write on borrow_records" ON borrow_records FOR ALL USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated write on families" ON families FOR ALL USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated write on family_books" ON family_books FOR ALL USING (auth.role() = 'authenticated');
      CREATE POLICY "Allow authenticated write on modules" ON modules FOR ALL USING (auth.role() = 'authenticated');
    `;
    
    await client.query(sql);
    console.log('所有安全策略创建成功！');
    
    await client.end();
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

runMigrations();