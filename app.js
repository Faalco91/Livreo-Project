let books = [];

function showFeedback(message, type = 'info') {
  const feedback = document.getElementById('feedback-message');
  feedback.textContent = message;
  feedback.className = `feedback-message feedback-${type}`;
  feedback.classList.remove('hidden');
  
  // Masquer automatiquement après 3 secondes
  setTimeout(() => {
    feedback.classList.add('hidden');
  }, 3000);
}

function showLoading(message = 'Chargement...') {
  showFeedback(message, 'loading');
}

function showError(message) {
  showFeedback(message, 'error');
}

function showSuccess(message) {
  showFeedback(message, 'success');
}

function fetchBooks() {
  showLoading('Chargement des livres...');
  
  fetch('https://keligmartin.github.io/api/books.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      return response.json();
    })
    .then(data => {
      books = data.map(book => ({
        ...book,
        status: 'to-read'
      }));
      renderBooks();
      showSuccess(`${books.length} livres chargés avec succès !`);
    })
    .catch(error => {
      console.error('Erreur chargement de API livres', error);
      books = [];
      renderBooks();
      showError('Erreur lors du chargement des livres. Veuillez réessayer.');
    });
}

// Filtres globaux
let currentSearch = '';
let currentAuthor = '';
let currentRating = '';
let currentStatus = '';
let currentMinPages = '';
let currentMaxPages = '';

function applyFilters(books) {
  return books.filter(book => {
    const searchMatch =
      !currentSearch ||
      book.title.toLowerCase().includes(currentSearch) ||
      book.author.toLowerCase().includes(currentSearch);
    const authorMatch = !currentAuthor || book.author === currentAuthor;
    const ratingMatch = !currentRating || (book.rating || 0) >= parseInt(currentRating);
    const statusMatch = !currentStatus || book.status === currentStatus;
    const minPagesMatch = !currentMinPages || (book.pages || 0) >= parseInt(currentMinPages);
    const maxPagesMatch = !currentMaxPages || (book.pages || 0) <= parseInt(currentMaxPages);
    return searchMatch && authorMatch && ratingMatch && statusMatch && minPagesMatch && maxPagesMatch;
  });
}

function renderBooks() {
  ["to-read", "reading", "read"].forEach(status => {
    const list = document.getElementById(status);
    if (!list) return;
    list.innerHTML = "";
    let columnBooks = books.filter(book => book.status === status);
    columnBooks = applyFilters(columnBooks);
    const sortType = getColumnAutoSort(status);
    if (sortType !== 'none') {
      columnBooks = sortBooks(columnBooks, sortType);
    }
    columnBooks.forEach(book => {
      const div = document.createElement("div");
      div.className = "book-card";
      div.innerHTML = `
        <div>
          <strong>${book.title}</strong><br>
          <em>${book.author}</em>
        </div>
        <button class="detail-btn" onclick="openBookDetailModal('${book.isbn}')">Voir détails</button>
      `;
      list.appendChild(div);
    });
  });
}

function sortBooks(books, sortType) {
  return [...books].sort((a, b) => {
    switch (sortType) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'author':
        return a.author.localeCompare(b.author);
      case 'rating':
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA; // Tri décroissant (meilleures notes en premier)
      case 'date':
        // Utiliser l'ISBN comme proxy pour la date (les nouveaux ont des timestamps plus récents)
        const dateA = parseInt(a.isbn.replace('u', '')) || 0;
        const dateB = parseInt(b.isbn.replace('u', '')) || 0;
        return dateB - dateA; // Tri décroissant (plus récents en premier)
      default:
        return 0;
    }
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
        status: form.status.value
      };
      books.push(book);
      saveBooks && saveBooks(); 
      closeModal();
      renderBooks();
      showSuccess(`"${book.title}" ajouté avec succès !`);
    };
  }
  
  function closeModal() {
    const modal = document.getElementById("modal");
    modal.classList.add("hidden");
    modal.innerHTML = "";
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addBookBtn").onclick = openAddBookModal;
    document.getElementById("showHiddenColumnsBtn").onclick = openHiddenColumnsModal;
    updateHiddenColumnsButton();
  });

function openBookDetailModal(isbn) {
  const book = books.find(b => b.isbn === isbn);
  if (!book) return;

  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-content book-detail-modal">
      <button class="close-modal" onclick="closeModal()">×</button>
      <h2>Détails du livre</h2>
      <form id="bookDetailForm">
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
            <button class="save-btn" type="submit">Sauvegarder</button>
            <button class="delete-btn" type="button" onclick="deleteBook('${isbn}')">Supprimer</button>
          </div>
        </div>
      </div>
      </form>
    </div>
  `;
  modal.classList.remove("hidden");
  document.getElementById("bookDetailForm").onsubmit = function(e) {
    e.preventDefault();
    saveBookChanges(isbn);
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
    // Mettre à jour l'affichage des étoiles
    const starsContainer = document.querySelector('.rating-stars');
    if (starsContainer) {
      starsContainer.innerHTML = generateRatingStars(rating, isbn);
    }
  }
}

function saveBookChanges(isbn) {
  console.log('saveBookChanges appelée pour', isbn);
  const book = books.find(b => b.isbn === isbn);
  if (!book) {
    console.log('Livre non trouvé');
    return;
  }

  // Récupérer les nouvelles valeurs
  const newStatus = document.getElementById(`status-${isbn}`).value;
  const newComment = document.getElementById(`comment-${isbn}`).value;
  console.log('Nouveau status:', newStatus, 'Nouveau commentaire:', newComment);

  // Mettre à jour le livre
  book.status = newStatus;
  book.comment = newComment;
  console.log('Livre mis à jour', book);

  // Sauvegarder et fermer la modale
  if (typeof saveBooks === 'function') {
    saveBooks();
    console.log('saveBooks appelée');
  }
  closeModal();
  console.log('closeModal appelée');
  renderBooks();
  showSuccess(`Modifications de "${book.title}" sauvegardées !`);
}

function deleteBook(isbn) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
    const book = books.find(b => b.isbn === isbn);
    const bookTitle = book ? book.title : 'Ce livre';
    
    books = books.filter(b => b.isbn !== isbn);
    saveBooks && saveBooks();
    closeModal();
    renderBooks();
    showSuccess(`"${bookTitle}" supprimé avec succès !`);
  }
}

function openColumnCustomizeModal(status) {
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-content column-custom-modal">
      <button class="close-modal" onclick="closeModal()">×</button>
      <h2>Personnaliser la colonne "${getColumnName(status)}"</h2>
      <form id="customizeColumnForm">
        <div class="customize-row">
          <label>Nom de la colonne <input name="columnName" value="${getColumnName(status)}"></label>
        </div>
        <div class="customize-row">
          <label>Icône de la colonne 
            <select name="columnIcon">
              <option value="📚" ${getColumnIcon(status) === '📚' ? 'selected' : ''}>📚 Livres</option>
              <option value="⏳" ${getColumnIcon(status) === '⏳' ? 'selected' : ''}>⏳ En attente</option>
              <option value="✅" ${getColumnIcon(status) === '✅' ? 'selected' : ''}>✅ Terminé</option>
              <option value="🔥" ${getColumnIcon(status) === '🔥' ? 'selected' : ''}>🔥 Populaire</option>
              <option value="⭐" ${getColumnIcon(status) === '⭐' ? 'selected' : ''}>⭐ Favoris</option>
              <option value="📖" ${getColumnIcon(status) === '📖' ? 'selected' : ''}>📖 Lecture</option>
              <option value="💡" ${getColumnIcon(status) === '💡' ? 'selected' : ''}>💡 Idées</option>
              <option value="🎯" ${getColumnIcon(status) === '🎯' ? 'selected' : ''}>🎯 Objectifs</option>
            </select>
          </label>
        </div>
        <div class="customize-row">
          <label>Couleur de fond <input type="color" name="columnColor" value="${getColumnColor(status)}"></label>
        </div>
        <div class="customize-row">
          <label>Couleur du texte <input type="color" name="textColor" value="${getColumnTextColor(status)}"></label>
        </div>
        <div class="customize-row">
          <label>Largeur de la colonne
            <select name="columnWidth">
              <option value="narrow" ${getColumnWidth(status) === 'narrow' ? 'selected' : ''}>Étroite</option>
              <option value="normal" ${getColumnWidth(status) === 'normal' ? 'selected' : ''}>Normale</option>
              <option value="wide" ${getColumnWidth(status) === 'wide' ? 'selected' : ''}>Large</option>
            </select>
          </label>
        </div>
        <div class="customize-row">
          <label>Tri automatique des livres
            <select name="autoSort">
              <option value="none" ${getColumnAutoSort(status) === 'none' ? 'selected' : ''}>Aucun tri</option>
              <option value="title" ${getColumnAutoSort(status) === 'title' ? 'selected' : ''}>Par titre</option>
              <option value="author" ${getColumnAutoSort(status) === 'author' ? 'selected' : ''}>Par auteur</option>
              <option value="rating" ${getColumnAutoSort(status) === 'rating' ? 'selected' : ''}>Par note</option>
              <option value="date" ${getColumnAutoSort(status) === 'date' ? 'selected' : ''}>Par date d'ajout</option>
            </select>
          </label>
        </div>
        <div class="customize-row">
          <label>
            <input type="checkbox" name="columnVisible" ${isColumnVisible(status) ? 'checked' : ''}>
            Afficher cette colonne
          </label>
        </div>
        <button type="submit">Sauvegarder</button>
      </form>
    </div>
  `;
  modal.classList.remove("hidden");

  document.getElementById("customizeColumnForm").onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
    
    prefs[status] = {
      name: form.columnName.value,
      icon: form.columnIcon.value,
      color: form.columnColor.value,
      textColor: form.textColor.value,
      width: form.columnWidth.value,
      autoSort: form.autoSort.value,
      visible: form.columnVisible.checked
    };
    
    localStorage.setItem('columnPrefs', JSON.stringify(prefs));
    closeModal();
    renderBooks();
    renderColumnHeaders();
    showSuccess(`Colonne "${form.columnName.value}" personnalisée !`);
  };
}

function isColumnVisible(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return prefs[status] ? (prefs[status].visible !== false) : true;
}

function getColumnName(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return (prefs[status] && prefs[status].name) || defaultColumnNames[status];
}

function getColumnColor(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return (prefs[status] && prefs[status].color) || defaultColumnColors[status];
}

function getColumnIcon(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return (prefs[status] && prefs[status].icon) || defaultColumnIcons[status];
}

function getColumnTextColor(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return (prefs[status] && prefs[status].textColor) || defaultColumnTextColors[status];
}

function getColumnWidth(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return (prefs[status] && prefs[status].width) || defaultColumnWidths[status];
}

function getColumnAutoSort(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  return (prefs[status] && prefs[status].autoSort) || defaultColumnAutoSorts[status];
}

const defaultColumnNames = {
  'to-read': 'À lire',
  'reading': 'En cours',
  'read': 'Lu'
};

const defaultColumnColors = {
  'to-read': '#e6fffa',
  'reading': '#fffbe6',
  'read': '#e6ffe6'
};

const defaultColumnIcons = {
  'to-read': '📚',
  'reading': '⏳',
  'read': '✅'
};

const defaultColumnTextColors = {
  'to-read': '#004d40',
  'reading': '#66512c',
  'read': '#00695c'
};

const defaultColumnWidths = {
  'to-read': 'normal',
  'reading': 'normal',
  'read': 'normal'
};

const defaultColumnAutoSorts = {
  'to-read': 'none',
  'reading': 'none',
  'read': 'none'
};

function renderColumnHeaders() {
  ["to-read", "reading", "read"].forEach(status => {
    const column = document.getElementById(status).parentElement;
    const h2 = column.querySelector('h2');
    
    // Appliquer le nom et l'icône
    h2.textContent = `${getColumnIcon(status)} ${getColumnName(status)}`;
    
    // Appliquer les couleurs
    h2.style.background = getColumnColor(status);
    h2.style.color = getColumnTextColor(status);
    
    // Appliquer la largeur
    const widthClass = getColumnWidth(status);
    column.className = `column column-${widthClass}`;
    
    // Masquer/afficher la colonne
    if (isColumnVisible(status)) {
      column.style.display = 'flex';
    } else {
      column.style.display = 'none';
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderColumnHeaders();
});

document.addEventListener("DOMContentLoaded", fetchBooks);

function openHiddenColumnsModal() {
  const hiddenColumns = ["to-read", "reading", "read"].filter(status => !isColumnVisible(status));
  
  if (hiddenColumns.length === 0) {
    alert("Aucune colonne n'est actuellement masquée.");
    return;
  }

  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="modal-content hidden-columns-modal">
      <button class="close-modal" onclick="closeModal()">×</button>
      <h2>Colonnes masquées</h2>
      <div class="hidden-columns-list">
        ${hiddenColumns.map(status => `
          <div class="hidden-column-item">
            <span>${getColumnName(status)}</span>
            <button onclick="showColumn('${status}')" class="show-column-btn">Afficher</button>
          </div>
        `).join('')}
      </div>
      <button onclick="closeModal()" class="close-btn">Fermer</button>
    </div>
  `;
  modal.classList.remove("hidden");
}

function showColumn(status) {
  const prefs = JSON.parse(localStorage.getItem('columnPrefs') || '{}');
  if (!prefs[status]) prefs[status] = {};
  prefs[status].visible = true;
  localStorage.setItem('columnPrefs', JSON.stringify(prefs));
  
  renderColumnHeaders();
  updateHiddenColumnsButton();
  closeModal();
  showSuccess(`Colonne "${getColumnName(status)}" réaffichée !`);
  
  // Rouvrir la modale des colonnes masquées si il y en a encore
  setTimeout(() => {
    const remainingHidden = ["to-read", "reading", "read"].filter(s => !isColumnVisible(s));
    if (remainingHidden.length > 0) {
      openHiddenColumnsModal();
    }
  }, 100);
}

// Initialisation des filtres et recherche
function updateAuthorFilterOptions() {
  const select = document.getElementById('authorFilter');
  if (!select) return;
  // Récupérer tous les auteurs uniques
  const authors = Array.from(new Set(books.map(b => b.author))).sort();
  select.innerHTML = '<option value="">Tous les auteurs</option>' +
    authors.map(a => `<option value="${a}">${a}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      currentSearch = e.target.value.trim().toLowerCase();
      renderBooks();
    });
  }
  // Dropdown filtres
  const filterBtn = document.getElementById('filterBtn');
  const filterDropdown = document.getElementById('filterDropdown');
  if (filterBtn && filterDropdown) {
    filterBtn.addEventListener('click', () => {
      filterDropdown.classList.toggle('show');
      filterBtn.classList.toggle('active');
      if (filterDropdown.classList.contains('show')) {
        updateAuthorFilterOptions();
      }
    });
    // Fermer la dropdown si clic en dehors
    document.addEventListener('click', (e) => {
      if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
        filterDropdown.classList.remove('show');
        filterBtn.classList.remove('active');
      }
    });
  }
  // Filtres avancés
  const authorFilter = document.getElementById('authorFilter');
  if (authorFilter) {
    authorFilter.addEventListener('change', e => {
      currentAuthor = e.target.value;
      renderBooks();
    });
  }
  const ratingFilter = document.getElementById('ratingFilter');
  if (ratingFilter) {
    ratingFilter.addEventListener('change', e => {
      currentRating = e.target.value;
      renderBooks();
    });
  }
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', e => {
      currentStatus = e.target.value;
      renderBooks();
    });
  }
  const minPagesFilter = document.getElementById('minPagesFilter');
  if (minPagesFilter) {
    minPagesFilter.addEventListener('input', e => {
      currentMinPages = e.target.value;
      renderBooks();
    });
  }
  const maxPagesFilter = document.getElementById('maxPagesFilter');
  if (maxPagesFilter) {
    maxPagesFilter.addEventListener('input', e => {
      currentMaxPages = e.target.value;
      renderBooks();
    });
  }
  updateAuthorFilterOptions();
});

// Mettre à jour les options d'auteurs après chargement des livres
const oldFetchBooks = fetchBooks;
fetchBooks = function() {
  oldFetchBooks.apply(this, arguments);
  setTimeout(updateAuthorFilterOptions, 500);
};