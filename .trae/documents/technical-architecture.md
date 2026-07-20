## 1. Architecture Design

```
flowchart TB
    subgraph Frontend [React + Vite]
        A[Login Page]
        B[Dashboard]
        C[Book List]
        D[Book Detail]
        E[Admin Panel]
        F[Borrow/Return Forms]
    end
    
    subgraph Backend [Supabase]
        G[Authentication]
        H[Database]
        I[Storage]
    end
    
    Frontend --> G
    Frontend --> H
    Frontend --> I
```

## 2. Technology Description
- Frontend: React@18 + TypeScript + TailwindCSS@3 + Vite
- State Management: Zustand
- Routing: React Router DOM
- Backend: Supabase (Authentication + PostgreSQL Database)
- Icons: Lucide React

## 3. Route Definitions
| Route | Purpose | Protected |
|-------|---------|-----------|
| /login | User login | Public |
| /register | User registration | Public |
| / | Dashboard / Module selection | Authenticated |
| /library | School library book list | Authenticated |
| /library/book/:id | Book detail page | Authenticated |
| /library/book/add | Add new book | Admin only |
| /library/book/:id/edit | Edit book | Admin only |
| /library/borrow | Borrow form | Authenticated |
| /library/return | Return form | Authenticated |
| /my-borrowing | Personal borrowing records | Authenticated |
| /family/:id | Family book module | Authenticated |
| /admin | Admin panel | Admin only |
| /admin/users | User management | Admin only |
| /admin/books | Book management | Admin only |
| /admin/statistics | Statistics dashboard | Admin only |

## 4. Data Model

### 4.1 Data Model Definition

```
erDiagram
    USER ||--o{ BORROW_RECORD : "borrows"
    BOOK ||--o{ BORROW_RECORD : "is borrowed"
    MODULE ||--o{ BOOK : "contains"
    MODULE ||--o{ USER : "has members"
    
    USER {
        uuid id PK
        text email UK
        text password_hash
        text name
        text role "student/teacher/admin"
        boolean approved
        timestamp created_at
        timestamp updated_at
    }
    
    MODULE {
        uuid id PK
        text name
        text type "school/family"
        uuid owner_id FK
        boolean is_public
        timestamp created_at
    }
    
    BOOK {
        uuid id PK
        text title
        text author
        text category
        text isbn
        text description
        text cover_url
        integer total_copies
        integer available_copies
        uuid module_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    BORROW_RECORD {
        uuid id PK
        uuid book_id FK
        uuid user_id FK
        date borrow_date
        date due_date
        date return_date
        text status "borrowed/returned/overdue"
        timestamp created_at
    }
```

### 4.2 Data Definition Language

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Modules table
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'school',
    owner_id UUID REFERENCES users(id),
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT,
    isbn TEXT,
    description TEXT,
    cover_url TEXT,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    module_id UUID REFERENCES modules(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Borrow records table
CREATE TABLE borrow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id),
    user_id UUID REFERENCES users(id),
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status TEXT NOT NULL DEFAULT 'borrowed',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_module ON books(module_id);
CREATE INDEX idx_borrow_user ON borrow_records(user_id);
CREATE INDEX idx_borrow_book ON borrow_records(book_id);
CREATE INDEX idx_borrow_status ON borrow_records(status);

-- Initial data: Create default school module
INSERT INTO modules (name, type, is_public) VALUES ('学校图书馆藏书', 'school', true);
```

## 5. Supabase RLS Policies

### Users Table
```sql
-- Public can view (for login)
CREATE POLICY "Public users can view" ON users FOR SELECT USING (true);

-- Authenticated users can update their own profile
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Admin can manage all users
CREATE POLICY "Admin can manage users" ON users FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

### Modules Table
```sql
-- Public can view public modules
CREATE POLICY "Public can view public modules" ON modules FOR SELECT USING (is_public = true);

-- Authenticated users can view all modules
CREATE POLICY "Authenticated can view all modules" ON modules FOR SELECT TO authenticated USING (true);

-- Owners can manage their modules
CREATE POLICY "Owners can manage modules" ON modules FOR ALL USING (auth.uid() = owner_id);

-- Admin can manage all modules
CREATE POLICY "Admin can manage modules" ON modules FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

### Books Table
```sql
-- Public can view books in public modules
CREATE POLICY "Public can view books in public modules" ON books FOR SELECT USING (
    EXISTS (SELECT 1 FROM modules WHERE modules.id = books.module_id AND modules.is_public = true)
);

-- Authenticated users can view all books
CREATE POLICY "Authenticated can view all books" ON books FOR SELECT TO authenticated USING (true);

-- Admin can manage all books
CREATE POLICY "Admin can manage books" ON books FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Module owners can manage their books
CREATE POLICY "Module owners can manage books" ON books FOR ALL USING (
    EXISTS (SELECT 1 FROM modules WHERE modules.id = books.module_id AND modules.owner_id = auth.uid())
);
```

### Borrow Records Table
```sql
-- Authenticated users can view their own borrow records
CREATE POLICY "Users can view their own borrows" ON borrow_records FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admin can view all borrow records
CREATE POLICY "Admin can view all borrows" ON borrow_records FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Admin can create borrow records
CREATE POLICY "Admin can create borrows" ON borrow_records FOR INSERT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Users can return their own books
CREATE POLICY "Users can return their own books" ON borrow_records FOR UPDATE TO authenticated USING (
    auth.uid() = user_id AND return_date IS NULL
);
```

## 6. API Definitions

### Authentication APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/signin | Login user |
| POST | /api/auth/signout | Logout user |
| GET | /api/auth/user | Get current user |

### Book APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/books | Get book list with filters |
| GET | /api/books/:id | Get book detail |
| POST | /api/books | Create new book |
| PUT | /api/books/:id | Update book |
| DELETE | /api/books/:id | Delete book |

### Borrow APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/borrow | Create borrow record |
| PUT | /api/borrow/:id/return | Return book |
| GET | /api/borrow/my | Get my borrow records |
| GET | /api/borrow/all | Get all borrow records (admin) |

### Module APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/modules | Get available modules |
| POST | /api/modules | Create new module |
| PUT | /api/modules/:id | Update module |
| DELETE | /api/modules/:id | Delete module |

### User APIs (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | Get all users |
| PUT | /api/admin/users/:id/approve | Approve user |
| PUT | /api/admin/users/:id/role | Update user role |

## 7. Frontend Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── common/
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Badge.tsx
│   ├── book/
│   │   ├── BookCard.tsx
│   │   ├── BookList.tsx
│   │   ├── BookForm.tsx
│   │   └── BookDetail.tsx
│   ├── borrow/
│   │   ├── BorrowForm.tsx
│   │   ├── ReturnForm.tsx
│   │   └── BorrowRecord.tsx
│   ├── module/
│   │   ├── ModuleCard.tsx
│   │   └── ModuleList.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── BookList.tsx
│   ├── BookDetail.tsx
│   ├── BookAdd.tsx
│   ├── BookEdit.tsx
│   ├── MyBorrowing.tsx
│   ├── AdminPanel.tsx
│   └── Statistics.tsx
├── store/
│   └── authStore.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useBooks.ts
│   └── useBorrow.ts
├── utils/
│   ├── supabase.ts
│   └── helpers.ts
├── types/
│   └── index.ts
└── App.tsx
```

## 8. Deployment
- Frontend: Vercel or Netlify
- Backend: Supabase (managed PostgreSQL + Auth)
- Environment Variables: SUPABASE_URL, SUPABASE_ANON_KEY