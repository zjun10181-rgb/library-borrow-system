import {
  getCurrentUser as mockGetCurrentUser,
  login as mockLogin,
  logout as mockLogout,
  signUp as mockSignUp,
  insertUser as mockInsertUser,
  getUserByEmail as mockGetUserByEmail,
  getModules as mockGetModules,
  getBooks as mockGetBooks,
  getBookById as mockGetBookById,
  createBook as mockCreateBook,
  updateBook as mockUpdateBook,
  deleteBook as mockDeleteBook,
  getBorrowRecords as mockGetBorrowRecords,
  createBorrowRecord as mockCreateBorrowRecord,
  returnBook as mockReturnBook,
  getUsers as mockGetUsers,
  approveUser as mockApproveUser,
  updateUserRole as mockUpdateUserRole,
  deleteUser as mockDeleteUser,
  getFamilies as mockGetFamilies,
  getFamilyById as mockGetFamilyById,
  createFamily as mockCreateFamily,
  addFamilyMember as mockAddFamilyMember,
  getFamilyBooks as mockGetFamilyBooks,
  updatePassword as mockUpdatePassword,
  resetPassword as mockResetPassword,
} from './mockSupabase';

export const supabase = {
  auth: {
    getUser: mockGetCurrentUser,
    signInWithPassword: mockLogin,
    signOut: mockLogout,
    signUp: mockSignUp,
  },
};

export const getCurrentUser = mockGetCurrentUser;
export const login = mockLogin;
export const logout = mockLogout;
export const signUp = mockSignUp;
export const insertUser = mockInsertUser;
export const getUserByEmail = mockGetUserByEmail;
export const getModules = mockGetModules;
export const getBooks = mockGetBooks;
export const getBookById = mockGetBookById;
export const createBook = mockCreateBook;
export const updateBook = mockUpdateBook;
export const deleteBook = mockDeleteBook;
export const getBorrowRecords = mockGetBorrowRecords;
export const createBorrowRecord = mockCreateBorrowRecord;
export const returnBook = mockReturnBook;
export const getUsers = mockGetUsers;
export const approveUser = mockApproveUser;
export const updateUserRole = mockUpdateUserRole;
export const deleteUser = mockDeleteUser;
export const getFamilies = mockGetFamilies;
export const getFamilyById = mockGetFamilyById;
export const createFamily = mockCreateFamily;
export const addFamilyMember = mockAddFamilyMember;
export const getFamilyBooks = mockGetFamilyBooks;
export const updatePassword = mockUpdatePassword;
export const resetPassword = mockResetPassword;