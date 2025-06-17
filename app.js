let books = [];

function fetchBooks() {
  fetch('https://keligmartin.github.io/api/books.json')
    .then(response => response.json())
    .then(data => {
      books = data.map(book => ({
        ...book,
        status: 'to-read'
      }));
      renderBooks();
    })
    .catch(error => {
      console.error('Erreur chargement de API livres', error);
      books = [];
      renderBooks();
    });
}

function renderBooks() {
  ["to-read", "reading", "read"].forEach(status => {
    const list = document.getElementById(status);
    if (!list) return;
    list.innerHTML = "";
    books.filter(book => book.status === status).forEach(book => {
      const div = document.createElement("div");
      div.className = "book-card";
      div.innerHTML = `
        <div>
          <strong>${book.title}</strong><br>
          <em>${book.author}</em>
        </div>
      `;
      list.appendChild(div);
    });
  });
}

document.addEventListener("DOMContentLoaded", fetchBooks);
