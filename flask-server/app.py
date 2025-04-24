from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

def fetch_wikipedia_summary(title, author):
    try:
        # Step 1: Search Wikipedia to find the correct page title
        clean_title = re.sub(r'[^\w\s]', '', title).replace(' ', '+')
        clean_author = re.sub(r'[^\w\s]', '', author).replace(' ', '+')
        # Simplify the search query to just the title and author
        search_query = f"{clean_title}+inauthor:{clean_author}"
        search_url = f"https://en.wikipedia.org/w/index.php?search={search_query}&title=Special:Search&fulltext=1"
        print(f"Searching Wikipedia with URL: {search_url}")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(search_url, headers=headers, timeout=(10, 10))
        if not response.ok:
            print(f"Wikipedia search failed with status: {response.status_code} - {response.reason}")
            return None, f"Wikipedia search failed: {response.reason}"

        soup = BeautifulSoup(response.text, 'html.parser')
        search_results = soup.find_all('div', class_='mw-search-result-heading')
        if not search_results:
            print("No search results found on Wikipedia.")
            return None, "No search results found on Wikipedia."

        # Log all search result titles for debugging
        print("Search results found:")
        for result in search_results:
            result_title = result.get_text(strip=True)
            print(f"- {result_title}")

        # Find the first result that likely matches the book title
        wiki_page_title = None
        normalized_title = re.sub(r'[^\w\s]', '', title).lower()
        for result in search_results:
            result_title = result.get_text(strip=True).lower()
            # Relax the matching criteria: check if the title is a substring of the result or vice versa
            if normalized_title in result_title or result_title in normalized_title or 'novel' in result_title:
                link = result.find('a')
                if link and 'href' in link.attrs:
                    wiki_page_title = link['href'].split('/')[-1]
                    print(f"Matched Wikipedia page: {wiki_page_title}")
                    break

        if not wiki_page_title:
            print("No matching Wikipedia page found after checking results.")
            return None, "No matching Wikipedia page found."

        # Step 2: Fetch the Wikipedia page
        wiki_url = f"https://en.wikipedia.org/wiki/{wiki_page_title}"
        print(f"Fetching Wikipedia page: {wiki_url}")

        response = requests.get(wiki_url, headers=headers, timeout=(10, 10))
        if not response.ok:
            print(f"Wikipedia fetch failed with status: {response.status_code} - {response.reason}")
            return None, f"Wikipedia fetch failed: {response.reason}"

        soup = BeautifulSoup(response.text, 'html.parser')
        content = soup.find('div', class_='mw-parser-output')
        if not content:
            print("No content found on Wikipedia page.")
            return None, "No content found on Wikipedia page."

        # Extract the first few paragraphs (usually the summary)
        paragraphs = content.find_all('p')
        summary = ' '.join(p.get_text(strip=True) for p in paragraphs[:3] if p.get_text(strip=True))
        if not summary:
            print("No summary text extracted from Wikipedia.")
            return None, "No summary text extracted from Wikipedia."

        print("Wikipedia summary fetched successfully.")
        return summary.lower(), None
    except Exception as e:
        print(f"Error fetching Wikipedia summary: {str(e)}")
        return None, f"Error fetching Wikipedia summary: {str(e)}"

def extract_entities(text):
    words = text.split()
    entities = set()
    for word in words:
        if word[0].isupper() and word.lower() not in ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'and', 'or', 'but']:
            entities.add(word)
    return entities

def validate_entities(entities, wiki_summary):
    if not wiki_summary:
        return False, "No Wikipedia summary available for entity validation."

    missing_entities = []
    wiki_text = wiki_summary.lower()
    for entity in entities:
        if entity.lower() not in wiki_text:
            missing_entities.append(entity)

    if missing_entities:
        print(f"Entities not found in Wikipedia summary: {missing_entities}")
        return False, f"Potential hallucination detected: the following entities were not found in the book's Wikipedia summary: {', '.join(missing_entities)}."
    return True, None

@app.route('/validate-summary', methods=['POST'])
def validate_summary():
    data = request.get_json()
    title = data.get('title')
    author = data.get('author')
    summary = data.get('summary')

    if not title or not author or not summary:
        return jsonify({"error": "Title, author, and summary are required."}), 400

    wiki_summary, wiki_error = fetch_wikipedia_summary(title, author)
    if wiki_error:
        return jsonify({"is_valid": False, "error": wiki_error})

    entities = extract_entities(summary)
    print(f"Extracted entities: {entities}")
    is_valid, validation_error = validate_entities(entities, wiki_summary)

    return jsonify({
        "is_valid": is_valid,
        "error": validation_error
    })

@app.route('/generate-summary', methods=['POST'])
def generate_summary():
    data = request.get_json()
    title = data.get('title')
    author = data.get('author')
    chapter_start = data.get('chapter_start')
    chapter_end = data.get('chapter_end')

    if not title or not author or chapter_start is None or chapter_end is None:
        return jsonify({"error": "Title, author, chapter_start, and chapter_end are required."}), 400

    if chapter_start < 1 or chapter_end < chapter_start:
        return jsonify({"error": "Invalid chapter range. Please enter a valid range (e.g., 1-3)."}), 400

    return jsonify({
        "title": title,
        "author": author,
        "chapter_start": chapter_start,
        "chapter_end": chapter_end
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555, debug=True)