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
  borrowed_by?: string | null;
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
