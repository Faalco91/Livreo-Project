let books = [];

function fetchBooks() {
  fetch('https://keligmartin.github.io/api/books.json')
    .then(response => response.json())
    .then(data => {
      books = data.map(book => ({
        ...book,
        status: 'to-read',
        rating: 0,
        comment: ''
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
      
      // Ajout des attributs pour le drag & drop
      div.draggable = true;
      div.dataset.isbn = book.isbn;
      
      // Affichage de la note sous forme d'étoiles
      const starsDisplay = generateStarsDisplay(book.rating || 0);
      
      div.innerHTML = `
        <div class="book-content">
          <div class="book-text">
            <strong>${book.title}</strong><br>
            <em>${book.author}</em>
          </div>
          <div class="rating-display">${starsDisplay}</div>
        </div>
        <button class="detail-btn" onclick="openBookDetailModal('${book.isbn}')">Voir détails</button>
      `;
      
      // Ajout des événements drag & drop
      div.addEventListener('dragstart', handleDragStart);
      div.addEventListener('dragend', handleDragEnd);
      
      list.appendChild(div);
    });
  });
  
  // Configuration des zones de drop
  setupDropZones();
}

// Fonction pour afficher les étoiles (lecture seule sur les cartes)
function generateStarsDisplay(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? 'star-display filled' : 'star-display';
    stars += `<span class="${starClass}">★</span>`;
  }
  return stars;
}

// Variables pour le drag & drop
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
    // Supprimer les anciens événements pour éviter les doublons
    column.removeEventListener('dragover', handleDragOver);
    column.removeEventListener('drop', handleDrop);
    column.removeEventListener('dragenter', handleDragEnter);
    column.removeEventListener('dragleave', handleDragLeave);
    
    // Ajouter les nouveaux événements
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
    renderBooks();
    console.log(`Livre "${book.title}" déplacé vers ${newStatus}`);
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

function openBookDetailModal(isbn) {
  const book = books.find(b => b.isbn === isbn);
  if (!book) return;

  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-content book-detail-modal">
      <button class="close-modal" onclick="closeModal()">×</button>
      <h2>Détails du livre</h2>
      <div class="book-detail-content">
        <div class="book-info">
          <h3>${book.title}</h3>
          <p class="author"><strong>Auteur :</strong> ${book.author}</p>
          ${book.pages ? `<p class="pages"><strong>Nombre de pages :</strong> ${book.pages}</p>` : ''}
          <p class="status"><strong>Status :</strong> ${getStatusLabel(book.status)}</p>
          ${book.isbn ? `<p class="isbn"><strong>ISBN :</strong> ${book.isbn}</p>` : ''}
        </div>
        
        <div class="book-actions">
          <div class="rating-section">
            <label><strong>Note :</strong></label>
            <div class="rating-stars">
              ${generateRatingStars(book.rating || 0, isbn)}
            </div>
          </div>
          
          <div class="comment-section">
            <label><strong>Commentaire :</strong></label>
            <textarea id="comment-${isbn}" placeholder="Ajouter un commentaire..." rows="4">${book.comment || ''}</textarea>
          </div>
          
          <div class="status-change">
            <label><strong>Changer le status :</strong></label>
            <select id="status-${isbn}">
              <option value="to-read" ${book.status === 'to-read' ? 'selected' : ''}>À lire</option>
              <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>En cours</option>
              <option value="read" ${book.status === 'read' ? 'selected' : ''}>Lu</option>
            </select>
          </div>
          
          <div class="action-buttons">
            <button class="save-btn" onclick="saveBookChanges('${isbn}')">Sauvegarder</button>
            <button class="delete-btn" onclick="deleteBook('${isbn}')">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
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

  closeModal();
  renderBooks();
  
  console.log(`Livre "${book.title}" mis à jour:`, {
    status: newStatus,
    rating: book.rating,
    comment: newComment
  });
}

function deleteBook(isbn) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
    books = books.filter(b => b.isbn !== isbn);
    closeModal();
    renderBooks();
  }
}

document.addEventListener("DOMContentLoaded", fetchBooks);