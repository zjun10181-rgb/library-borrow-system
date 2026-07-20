## 1. Product Overview
学校图书馆藏书管理系统，以学校图书馆为主体，通过降低借阅门槛、提升图书可发现性、建立正向反馈机制，解决图书资源利用率低下和阅读激励不足的根本问题。支持多藏书模块并列（学校图书馆+家庭私人藏书），零硬件投入，纯网页操作。

## 2. Core Features

### 2.1 User Roles
| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Student | Email registration + admin approval | Browse books, borrow/return books, view reading history |
| Teacher | Email registration + admin approval | Browse books, borrow/return books, manage class reading activities |
| Admin | System setup | Approve users, manage books, configure system settings, view statistics |

### 2.2 Feature Module
1. **Login/Register**: User authentication, role-based access
2. **Dashboard**: Module selection (school/library + family modules), quick stats
3. **Book Management**: Book entry (Excel import/manual), editing, deletion
4. **Book Search**: Keyword search, category browsing, status filtering
5. **Borrow Management**: Borrow registration, return registration, due date management
6. **Reading Statistics**: Personal reading stats, library-wide statistics
7. **Family Module**: Add/manage family book collections (after MVP validation)

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Login | Login Form | Email/password login, registration link |
| Register | Registration Form | Fill personal info, role selection, submit for approval |
| Dashboard | Module Selection | Grid of available book modules, quick stats cards |
| Book List | Search & Browse | Keyword search, category filter, status filter, pagination |
| Book Detail | Book Info | Book details, current status, borrow history |
| Book Add/Edit | Entry Form | Manual entry form, Excel import button |
| Borrow | Borrow Form | Select borrower, set due date, confirm |
| Return | Return Form | Search borrowed book, confirm return |
| My Borrowing | Personal Records | List of borrowed books, due date reminders |
| Admin Panel | User Management | Approve/reject registrations, manage user accounts |
| Admin Panel | Book Management | Add/edit/delete books, import books |
| Admin Panel | Statistics | Library-wide borrowing stats, reading trends |

## 3. Core Process

### User Flow: Borrow a Book
```
flowchart LR
    A[Login] --> B[Dashboard<br/>Select Module]
    B --> C[Book List<br/>Search/Browse]
    C --> D[Book Detail]
    D --> E{Borrowed?}
    E -->|No| F[Borrow Form<br/>Select Borrower]
    F --> G[Confirm Borrow]
    G --> H[Success]
    E -->|Yes| I[View Borrower Info]
```

### Admin Flow: Book Entry
```
flowchart LR
    A[Admin Login] --> B[Admin Panel]
    B --> C[Book Management]
    C --> D{Import or Manual?}
    D -->|Excel Import| E[Download Template]
    E --> F[Upload File]
    F --> G[Preview & Confirm]
    G --> H[Import Success]
    D -->|Manual Entry| I[Fill Book Info]
    I --> J[Submit]
    J --> H
```

## 4. User Interface Design

### 4.1 Design Style
- **Primary Color**: #b8562f (warm terracotta) - represents knowledge and warmth
- **Secondary Color**: #5a7c5e (soft green) - represents growth and reading
- **Neutral Colors**: #2c2418 (ink), #fdf8f3 (cream background), #e0d5c8 (divider)
- **Button Style**: Rounded corners (8px), solid fill for primary, outline for secondary
- **Font**: Instrument Sans for UI, Crimson Pro for headings
- **Layout**: Card-based design, clean white space, intuitive navigation
- **Icon Style**: Lucide icons, consistent 24px size

### 4.2 Page Design Overview
| Page Name | Module Name | UI Elements |
|-----------|-------------|-------------|
| Login | Hero | Full-width banner, centered login card, soft shadow |
| Dashboard | Module Grid | Card grid layout, hover effects, module icons |
| Book List | Search Bar | Top search bar, category chips, status badges |
| Book Detail | Info Card | Book cover placeholder, metadata list, action buttons |
| Admin Panel | Sidebar | Left sidebar navigation, content area |

### 4.3 Responsiveness
- Desktop-first design, responsive layout for tablets and mobile
- Mobile: Stacked cards, hamburger menu for navigation
- Touch optimization: Larger touch targets (minimum 44px)

### 4.4 Accessibility
- Semantic HTML structure
- WCAG AA color contrast
- Keyboard navigation support
- Screen reader compatible ARIA labels