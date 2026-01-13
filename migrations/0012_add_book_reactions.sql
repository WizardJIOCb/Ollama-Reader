-- Add bookId column to reactions table to support book reactions
ALTER TABLE reactions 
ADD COLUMN book_id VARCHAR;

-- Add foreign key constraint
ALTER TABLE reactions
ADD CONSTRAINT reactions_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id);

-- Add comment for documentation
COMMENT ON COLUMN reactions.book_id IS 'Links reaction to a book (optional - one of commentId, reviewId, newsId, or bookId must be set)';
