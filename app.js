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


function openAddBookModal() {
    const modal = document.getElementById("modal");
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close-modal" onclick="closeModal()">×</button>
        <h2>Ajouter un livre</h2>
        <form id="addBookForm">
          <label>Titre <input name="title" required></label><br>
          <label>Auteur <input name="author" required></label><br>
          <label>Status
            <select name="status">
              <option value="to-read">À lire</option>
              <option value="reading">En cours</option>
              <option value="read">Lu</option>
            </select>
          </label><br>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    `;
    modal.classList.remove("hidden");
  
    document.getElementById("addBookForm").onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const book = {
        isbn: "u" + Date.now(),
        title: form.title.value,
        author: form.author.value,
        status: form.status.value
      };
      books.push(book);
      saveBooks && saveBooks(); 
      closeModal();
      renderBooks();
    };
  }
  
  function closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
    modal.innerHTML = "";
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addBookBtn").onclick = openAddBookModal;
  });

  

document.addEventListener("DOMContentLoaded", fetchBooks);
