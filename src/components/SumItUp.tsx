// import os
// import tempfile
// import requests
// from libgen_api import LibgenSearch
// from openai import OpenAI
// from typing import List, Dict
// from pypdf import PdfReader
// from ebooklib import epub
// from bs4 import BeautifulSoup

// def get_book_download_link(book_title: str, author: str) -> str:
//     """
//     Search for a book on LibGen by title and author, and return its download link.
    
//     Args:
//         book_title (str): Title of the book.
//         author (str): Author of the book.
    
//     Returns:
//         str: Direct download link for the book, or None if not found.
//     """
//     s = LibgenSearch()
//     results = s.search_title(book_title)
//     for result in results:
//         if author.lower() in result.get("Author", "").lower():
//             download_links = s.resolve_download_links(result)
//             return download_links.get("GET")
//     return None

// def download_book(download_link: str) -> str:
//     """
//     Download a book file from a given URL to a temporary file.
    
//     Args:
//         download_link (str): URL to download the book from.
    
//     Returns:
//         str: Path to the temporary file, or None if download fails.
//     """
//     response = requests.get(download_link, stream=True)
//     if response.status_code == 200:
//         with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(download_link)[1]) as temp_file:
//             for chunk in response.iter_content(chunk_size=8192):
//                 temp_file.write(chunk)
//             return temp_file.name
//     return None

// def extract_pdf_chapters(file_path: str) -> List[tuple]:
//     """
//     Extract chapters from a PDF file using its outline (bookmarks).
    
//     Args:
//         file_path (str): Path to the PDF file.
    
//     Returns:
//         List[tuple]: List of (title, text) for each chapter.
//     """
//     reader = PdfReader(file_path)
//     outline = reader.outline
//     if not outline:
//         return []
//     chapters = []
//     for i, item in enumerate(outline):
//         start_page = reader.pages.index(item.page)
//         if i < len(outline) - 1:
//             end_page = reader.pages.index(outline[i+1].page) - 1
//         else:
//             end_page = len(reader.pages) - 1
//         text = ""
//         for page_num in range(start_page, end_page + 1):
//             page = reader.pages[page_num]
//             text += page.extract_text() + "\n"
//         chapters.append((item.title, text))
//     return chapters

// def extract_epub_chapters(file_path: str) -> List[tuple]:
//     """
//     Extract chapters from an EPUB file using its table of contents.
    
//     Args:
//         file_path (str): Path to the EPUB file.
    
//     Returns:
//         List[tuple]: List of (title, text) for each chapter.
//     """
//     book = epub.read_epub(file_path)
//     toc = book.get_toc()
//     chapters = []
//     for href, title, _ in toc:
//         item = book.get_item_with_href(href)
//         if item:
//             html_content = item.get_content()
//             soup = BeautifulSoup(html_content, 'html.parser')
//             text = soup.get_text()
//             chapters.append((title, text))
//     return chapters

// def generate_chapter_summaries(book_title: str, author: str, chapters: List[int], api_key: str) -> Dict:
//     """
//     Generate summaries for specified chapters of a book using LibGen API for text and Open AI API for summarization.
    
//     Args:
//         book_title (str): Title of the book.
//         author (str): Author of the book.
//         chapters (List[int]): List of chapter numbers to summarize.
//         api_key (str): Open AI API key.
    
//     Returns:
//         Dict: Dictionary with chapter numbers as keys and summaries as values.
//               Includes 'error' key if an error occurs.
//     """
//     # Input validation
//     if not book_title or not author or not chapters:
//         return {"error": "Book title, author, and chapters are required."}
//     if not all(isinstance(ch, int) and ch > 0 for ch in chapters):
//         return {"error": "Chapters must be positive integers."}
    
//     # Get book download link
//     download_link = get_book_download_link(book_title, author)
//     if not download_link:
//         return {"error": "Book not found on LibGen."}
    
//     # Download book
//     file_path = download_book(download_link)
//     if not file_path:
//         return {"error": "Failed to download book."}
    
//     # Determine file type and extract chapters
//     extension = os.path.splitext(file_path)[1].lower()
//     if extension == '.pdf':
//         chapter_list = extract_pdf_chapters(file_path)
//     elif extension == '.epub':
//         chapter_list = extract_epub_chapters(file_path)
//     else:
//         os.remove(file_path)
//         return {"error": "Unsupported file format. Only PDF and EPUB are supported."}
    
//     if not chapter_list:
//         os.remove(file_path)
//         return {"error": "Could not extract chapters from the book."}
    
//     # Initialize Open AI client
//     try:
//         client = OpenAI(api_key=api_key)
//     except Exception as e:
//         os.remove(file_path)
//         return {"error": f"Failed to initialize Open AI client: {str(e)}"}
    
//     # Generate summaries
//     summaries = {}
//     for chapter_num in chapters:
//         if 1 <= chapter_num <= len(chapter_list):
//             _, text = chapter_list[chapter_num - 1]
//             # Truncate text if too long for API
//             if len(text) > 4000:
//                 text = text[:4000] + "..."
//             prompt = f"Summarize the following text in 100-150 words: {text}"
//             try:
//                 response = client.chat.completions.create(
//                     model="gpt-4o-mini",
//                     messages=[
//                         {"role": "system", "content": "You are a helpful assistant that generates accurate and concise summaries."},
//                         {"role": "user", "content": prompt}
//                     ],
//                     max_tokens=200,
//                     temperature=0.7
//                 )
//                 summary = response.choices[0].message.content.strip()
//                 summaries[f"Chapter {chapter_num}"] = summary
//             except Exception as e:
//                 summaries[f"Chapter {chapter_num}"] = f"Error generating summary: {str(e)}"
//         else:
//             summaries[f"Chapter {chapter_num}"] = "Chapter not found."
    
//     # Clean up temporary file
//     os.remove(file_path)
    
//     return summaries

// # Example usage
// if __name__ == "__main__":
//     api_key = os.getenv("OPENAI_API_KEY", "your-api-key-here")
//     book_title = "Pride and Prejudice"
//     author = "Jane Austen"
//     chapters = [1, 3]
//     result = generate_chapter_summaries(book_title, author, chapters, api_key)
//     for chapter, summary in result.items():
//         print(f"{chapter}:\n{summary}\n")