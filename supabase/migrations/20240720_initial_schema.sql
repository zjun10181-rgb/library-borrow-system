CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  isbn VARCHAR(20),
  description TEXT,
  cover_url TEXT,
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  module_id VARCHAR(36) REFERENCES modules(id),
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS families (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  approved BOOLEAN DEFAULT false,
  family_id VARCHAR(36) REFERENCES families(id),
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS borrow_records (
  id VARCHAR(36) PRIMARY KEY,
  book_id VARCHAR(36) REFERENCES books(id),
  user_id VARCHAR(36) REFERENCES users(id),
  borrow_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status VARCHAR(20) DEFAULT 'borrowed',
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS family_books (
  id VARCHAR(36) PRIMARY KEY,
  family_id VARCHAR(36) REFERENCES families(id),
  book_id VARCHAR(36) REFERENCES books(id),
  donated_by VARCHAR(36) REFERENCES users(id),
  created_at DATE DEFAULT CURRENT_DATE
);

INSERT INTO modules (id, name, description, icon) VALUES
('m1', '图书管理', '管理图书馆的所有图书', 'BookOpen'),
('m2', '家庭图书', '管理家庭共享的图书', 'Home'),
('m3', '借阅管理', '管理图书借阅和归还', 'RotateCcw');

INSERT INTO users (id, email, name, role, approved) VALUES
('u1', 'admin@library.com', '管理员', 'admin', true);

INSERT INTO books (id, title, author, category, description, cover_url, total_copies, available_copies, module_id) VALUES
('b1', '红楼梦', '曹雪芹', '文学经典', '中国古典四大名著之一', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Honglou%20Meng%20Chinese%20classic%20literature%20book%20cover%2C%20traditional%20ink%20painting%20style%2C%20elegant%20calligraphy%2C%20cultural%20heritage%2C%20scholarly%20design&image_size=portrait_4_3', 1, 1, 'm1'),
('b2', '三国演义', '罗贯中', '文学经典', '中国古典四大名著之一', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Romance%20of%20the%20Three%20Kingdoms%20Chinese%20classic%20literature%20book%20cover%2C%20historical%20battle%20scene%2C%20ancient%20warriors%2C%20epic%20style&image_size=portrait_4_3', 1, 1, 'm1'),
('b3', '西游记', '吴承恩', '文学经典', '中国古典四大名著之一', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Journey%20to%20the%20West%20Chinese%20classic%20literature%20book%20cover%2C%20monkey%20king%2C%20mythical%20creatures%2C%20fantasy%20adventure&image_size=portrait_4_3', 1, 1, 'm1'),
('b4', '水浒传', '施耐庵', '文学经典', '中国古典四大名著之一', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Water%20Margin%20Chinese%20classic%20literature%20book%20cover%2C%20108%20heroes%2C%20martial%20arts%2C%20brotherhood&image_size=portrait_4_3', 1, 1, 'm1');