export interface Borrow {
  id: number;
  borrower_name: string;
  book_id: string;
  book_title: string;
  book_authors: string[];
  book_thumbnail: string | null;
  book_description: string | null;
  book_publisher: string | null;
  book_published_date: string | null;
  book_page_count: number | null;
  book_categories: string[] | null;
  book_isbn: string | null;
  book_rating: number | null;
  borrowed_at: string;
  returned_at: string | null;
  notes: string | null;
  // new columns
  user_id: string | null;
  status: 'pending' | 'active' | 'returned' | 'rejected';
  taken_date: string | null;
  due_date: string | null;
  returned_date: string | null;
  rejection_reason: string | null;
  user_page_count: number | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface ReadingLog {
  id: number;
  user_id: string;
  borrow_id: number;
  log_date: string;
  pages_read: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  type: 'request_approved' | 'request_rejected' | 'due_soon' | 'waitlist_ready';
  message: string;
  read: boolean;
  created_at: string;
}

export interface Book {
  id: number;
  book_id: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  description: string | null;
  publisher: string | null;
  published_date: string | null;
  page_count: number | null;
  categories: string[] | null;
  isbn: string | null;
  rating: number | null;
  added_at: string;
  ebook_url: string | null;
  borrowed_by?: string | null;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type SidebarTab   = 'toc' | 'bookmarks' | 'highlights';

export interface EbookProgress {
  id: number;
  user_id: string;
  book_id: string;
  cfi: string;
  updated_at: string;
}

export interface EbookBookmark {
  id: number;
  user_id: string;
  book_id: string;
  cfi: string;
  label: string | null;
  created_at: string;
}

export interface EbookHighlight {
  id: number;
  user_id: string;
  book_id: string;
  cfi_range: string;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  created_at: string;
}

export interface GoogleBook {
  id: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  description: string | null;
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  categories: string[] | null;
  isbn: string | null;
  rating: number | null;
}
