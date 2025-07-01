let books = [];

function saveBooks() {
  try {
    localStorage.setItem('livreo_books', JSON.stringify(books));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
  }
}

function loadBooks() {
  try {
    const savedBooks = localStorage.getItem('livreo_books');
    if (savedBooks) {
      books = JSON.parse(savedBooks);
      return true;
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
  }
  return false;
}

function fetchBooks() {
  if (loadBooks()) {
    renderBooks();
    return;
  }

  fetch('https://keligmartin.github.io/api/books.json')
    .then(response => response.json())
    .then(data => {
      books = data.map(book => ({
        ...book,
        status: 'to-read',
        rating: 0,
        comment: ''
      }));
      saveBooks();
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
      
      div.draggable = true;
      div.dataset.isbn = book.isbn;
      
      const starsDisplay = generateStarsDisplay(book.rating || 0);
      
      div.innerHTML = `
      <div class="book-content">
        <div class="book-text">
          <strong>${book.title}</strong><br>
          <em>${book.author}</em>
        </div>
        <div class="rating-display">${starsDisplay}</div>
      </div>
      <div class="card-actions">
        <button class="modal-btn"
                onclick="openBookViewModal('${book.isbn}')">
          Voir détails
        </button>
      </div>
    `;
    
      
      div.addEventListener('dragstart', handleDragStart);
      div.addEventListener('dragend', handleDragEnd);
      
      list.appendChild(div);
    });
  });
  
  setupDropZones();
}

function generateStarsDisplay(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? 'star-display filled' : 'star-display';
    stars += `<span class="${starClass}">★</span>`;
  }
  return stars;
}

let draggedBook = null;

function handleDragStart(e) {
  draggedBook = e.target.dataset.isbn;
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragEnd(e) {
  e.target.style.opacity = '1';
  draggedBook = null;
}

function setupDropZones() {
  const columns = document.querySelectorAll('.column');
  columns.forEach(column => {
    column.removeEventListener('dragover', handleDragOver);
    column.removeEventListener('drop', handleDrop);
    column.removeEventListener('dragenter', handleDragEnter);
    column.removeEventListener('dragleave', handleDragLeave);
    
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragenter', handleDragEnter);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (e.target.closest('.column')) {
    e.target.closest('.column').classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  if (e.target.closest('.column') && !e.target.closest('.column').contains(e.relatedTarget)) {
    e.target.closest('.column').classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  const column = e.target.closest('.column');
  if (column) {
    column.classList.remove('drag-over');
  }
  
  if (!draggedBook) return;
  
  const newStatus = column.querySelector('.books-list').id;
  const book = books.find(b => b.isbn === draggedBook);
  
  if (book && book.status !== newStatus) {
    book.status = newStatus;
    saveBooks();
    renderBooks();
  }
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
        <label>Nombre de pages <input name="pages" type="number" min="1" placeholder="Ex: 300"></label><br>
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
      pages: form.pages.value ? parseInt(form.pages.value) : null,
      status: form.status.value,
      rating: 0,
      comment: ''
    };
    books.push(book);
    saveBooks();
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
  document.getElementById("clearDataBtn").onclick = clearAllDataWithConfirmation;
});


function openBookViewModal(isbn) {
  const book = books.find(b => b.isbn === isbn);
  if (!book) return;

  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-content book-view-modal" role="dialog" aria-modal="true">
        <button class="modal-btn"
                onclick="openBookEditModal('${book.isbn}')">
          ...
        </button>
      <button class="close-modal" onclick="closeModal()">×</button>
      <h2>Détails du livre</h2>
      <div class="book-info">
        <h3>${book.title}</h3>
        <p><strong>Auteur :</strong> ${book.author}</p>
        ${book.pages ? `<p><strong>Pages :</strong> ${book.pages}</p>` : ''}
        <p><strong>Status :</strong> ${getStatusLabel(book.status)}</p>
        <p><strong>ISBN :</strong> ${book.isbn}</p>
        <p><strong>Note :</strong> ${generateStarsDisplay(book.rating)}</p>
        ${book.comment ? `<p><strong>Commentaire :</strong><br>${book.comment}</p>` : ''}
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
}

function openBookEditModal(isbn) {
  const book = books.find(b => b.isbn === isbn);
  if (!book) return;

  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-content book-edit-modal" role="dialog" aria-modal="true">
      <button class="close-modal" onclick="closeModal()">×</button>
      <h2>Modifier le livre</h2>
      <form id="editBookForm">
        <label>Titre
          <input name="title" value="${book.title}" required>
        </label><br>
        <label>Auteur
          <input name="author" value="${book.author}" required>
        </label><br>
        <label>Nombre de pages
          <input name="pages" type="number" min="1" value="${book.pages || ''}">
        </label><br>
        <label>Status
          <select name="status">
            <option value="to-read" ${book.status==='to-read'?'selected':''}>À lire</option>
            <option value="reading" ${book.status==='reading'?'selected':''}>En cours</option>
            <option value="read" ${book.status==='read'?'selected':''}>Lu</option>
          </select>
        </label><br>
        <label>Note
          <div class="rating-stars">
            ${generateRatingStars(book.rating, isbn)}
          </div>
        </label><br>
        <label>Commentaire
          <textarea name="comment" rows="4">${book.comment || ''}</textarea>
        </label><br>
        <div class="action-buttons">
          <button type="submit" class="save-btn">Sauvegarder</button>
          <button type="button" class="delete-btn" onclick="deleteBook('${isbn}')">Supprimer</button>
        </div>
      </form>
    </div>
  `;
  modal.classList.remove("hidden");

  document.getElementById("editBookForm").onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    book.title   = form.title.value;
    book.author  = form.author.value;
    book.pages   = form.pages.value ? parseInt(form.pages.value) : null;
    book.status  = form.status.value;
    book.comment = form.comment.value;
    // la note est déjà mise à jour via setRating()
    saveBooks();
    closeModal();
    renderBooks();
  };
}


function getStatusLabel(status) {
  const labels = {
    'to-read': 'À lire',
    'reading': 'En cours',
    'read': 'Lu'
  };
  return labels[status] || status;
}

function generateRatingStars(rating, isbn) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? 'star filled' : 'star';
    stars += `<span class="${starClass}" onclick="setRating('${isbn}', ${i})">★</span>`;
  }
  return stars;
}

function setRating(isbn, rating) {
  const book = books.find(b => b.isbn === isbn);
  if (book) {
    book.rating = rating;
    saveBooks();
    const starsContainer = document.querySelector('.rating-stars');
    if (starsContainer) {
      starsContainer.innerHTML = generateRatingStars(rating, isbn);
    }
  }
}

function saveBookChanges(isbn) {
  const book = books.find(b => b.isbn === isbn);
  if (!book) return;

  const newStatus = document.getElementById(`status-${isbn}`).value;
  const newComment = document.getElementById(`comment-${isbn}`).value;

  book.status = newStatus;
  book.comment = newComment;

  saveBooks();
  closeModal();
  renderBooks();
}

function deleteBook(isbn) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
    books = books.filter(b => b.isbn !== isbn);
    saveBooks();
    closeModal();
    renderBooks();
  }
}

function clearAllDataWithConfirmation() {
  const movedBooks = books.filter(b => b.status !== 'to-read').length;
  const ratedBooks = books.filter(b => b.rating > 0).length;
  const commentedBooks = books.filter(b => b.comment && b.comment.trim()).length;
  const addedBooks = books.filter(b => b.isbn.startsWith('u')).length;
  
  const message = `⚠️ ATTENTION ! Cette action va réinitialiser vos modifications :

📚 ${movedBooks} livre(s) déplacé(s) → retour "À lire"
⭐ ${ratedBooks} note(s) → supprimées
💭 ${commentedBooks} commentaire(s) → supprimés
➕ ${addedBooks} livre(s) ajouté(s) → supprimés

Les livres originaux seront remis dans "À lire".

Tapez "RESET" pour confirmer :`;

  const userInput = prompt(message);
  
  if (userInput === "RESET") {
    localStorage.removeItem('livreo_books');
    books = [];
    renderBooks();
    alert('✅ Vos modifications ont été réinitialisées.\nLa page va se recharger pour récupérer les données initiales.');
    window.location.reload();
  } else if (userInput !== null) {
    alert('❌ Réinitialisation annulée.\nVous devez taper exactement "RESET" pour confirmer.');
  }
}

function clearAllData() {
  if (confirm('⚠️ ATTENTION ! Cela va supprimer TOUS vos livres, notes et commentaires. Continuer ?')) {
    localStorage.removeItem('livreo_books');
    books = [];
    renderBooks();
  }
}

function showStats() {
  const stats = {
    total: books.length,
    toRead: books.filter(b => b.status === 'to-read').length,
    reading: books.filter(b => b.status === 'reading').length,
    read: books.filter(b => b.status === 'read').length,
    rated: books.filter(b => b.rating > 0).length,
    commented: books.filter(b => b.comment && b.comment.trim()).length
  };
  
  alert(`📚 Votre bibliothèque:\n\n📖 Total: ${stats.total} livres\n📚 À lire: ${stats.toRead}\n📖 En cours: ${stats.reading}\n✅ Lus: ${stats.read}\n⭐ Notés: ${stats.rated}\n💭 Commentés: ${stats.commented}`);
}

document.addEventListener("DOMContentLoaded", fetchBooks);