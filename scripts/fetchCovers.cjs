const fs = require('fs');
const path = require('path');
const https = require('https');

const mockDataPath = path.join(__dirname, '../src/utils/mockData.ts');
const content = fs.readFileSync(mockDataPath, 'utf-8');

const bookMatches = content.match(/\{ id: '(\d+)', title: '([^']+)', author: '([^']+)', category: '([^']+)', isbn: '[^']*', description: '[^']*', cover_url: generateCover\('[^']+', '[^']+', \d+\), total_copies: \d+, available_copies: \d+, module_id: '(\d+)', created_at: '[^']+', updated_at: '[^']+' \}/g);

const books = bookMatches.map(match => {
  const idMatch = match.match(/id: '(\d+)'/);
  const titleMatch = match.match(/title: '([^']+)'/);
  const authorMatch = match.match(/author: '([^']+)'/);
  const categoryMatch = match.match(/category: '([^']+)'/);
  const moduleIdMatch = match.match(/module_id: '([^']+)'/);
  return {
    id: idMatch[1],
    title: titleMatch[1],
    author: authorMatch[1],
    category: categoryMatch[1],
    module_id: moduleIdMatch[1],
  };
});

console.log(`Found ${books.length} books`);

function fetchWithRetry(url, retries = 3, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    const attempt = (count) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            if (count > 0) {
              setTimeout(() => attempt(count - 1), delayMs);
            } else {
              resolve(null);
            }
          }
        });
      }).on('error', (e) => {
        if (count > 0) {
          setTimeout(() => attempt(count - 1), delayMs);
        } else {
          resolve(null);
        }
      });
    };
    attempt(retries);
  });
}

async function getCoverFromGoogleBooks(title, author) {
  try {
    const cleanTitle = title.replace(/（.*）|（全）|（上）|（下）|全集\d+/g, '').trim();
    const cleanAuthor = author.replace(/\[.*\]/g, '').trim();
    const query = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
    
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
    const result = await fetchWithRetry(url);
    
    if (result && result.items && result.items.length > 0) {
      const volumeInfo = result.items[0].volumeInfo;
      if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
        return volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=2');
      }
      if (volumeInfo.imageLinks && volumeInfo.imageLinks.small) {
        return volumeInfo.imageLinks.small;
      }
    }
  } catch (e) {
    console.log(`Google Books error for ${title}:`, e.message);
  }
  return null;
}

async function getCoverFromOpenLibrary(title, author) {
  try {
    const cleanTitle = title.replace(/（.*）|（全）|（上）|（下）|全集\d+/g, '').trim();
    const cleanAuthor = author.replace(/\[.*\]/g, '').trim();
    const query = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
    
    const url = `https://openlibrary.org/search.json?q=${query}&limit=3`;
    const result = await fetchWithRetry(url);
    
    if (result && result.docs && result.docs.length > 0) {
      const doc = result.docs[0];
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      } else if (doc.isbn && doc.isbn[0]) {
        return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
      }
    }
  } catch (e) {
    console.log(`Open Library error for ${title}:`, e.message);
  }
  return null;
}

function generateAICover(title, author, index) {
  const prompt = encodeURIComponent(`book cover design for "${title}" by ${author}, elegant literary style, hardcover, minimalist design, classic book cover, vertical portrait`);
  const seed = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=portrait_4_3&seed=${seed}`;
}

async function getCoverUrl(title, author, index) {
  const cover = await getCoverFromGoogleBooks(title, author);
  if (cover) return cover;
  
  const cover2 = await getCoverFromOpenLibrary(title, author);
  if (cover2) return cover2;
  
  return generateAICover(title, author, index);
}

async function main() {
  const updatedBooks = [];
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`Processing ${i + 1}/${books.length}: ${book.title} by ${book.author}`);
    
    const coverUrl = await getCoverUrl(book.title, book.author, i + 1);
    updatedBooks.push({
      ...book,
      cover_url: coverUrl,
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const mockBooksArray = updatedBooks.map(book => 
    `  { id: '${book.id}', title: '${book.title}', author: '${book.author}', category: '${book.category}', isbn: '', description: '', cover_url: '${book.cover_url}', total_copies: 1, available_copies: 1, module_id: '${book.module_id}', created_at: '2024-07-19', updated_at: '2024-07-19' }`
  ).join(',\n');

  const newContent = content.replace(
    /export const mockBooks: Book\[\] = \[\s*[\s\S]*?\n\];/,
    `export const mockBooks: Book[] = [\n${mockBooksArray}\n];`
  );

  fs.writeFileSync(mockDataPath, newContent, 'utf-8');
  console.log('Updated mockData.ts with cover URLs');
}

main().catch(e => console.error(e));