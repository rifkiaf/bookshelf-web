const books = [];
const RENDER_EVENT = "render-book";
const STORAGE_KEY = "BOOKSHELF_APPS";

function isStorageExist() {
  if (typeof Storage === "undefined") {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
  return {
    id,
    title,
    author,
    year,
    isComplete,
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const submitForm = document.getElementById("bookForm");

  submitForm.addEventListener("submit", function (event) {
    event.preventDefault();
    addBook();
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }

  document.getElementById("searchSubmit").addEventListener("click", function (event) {
    event.preventDefault();

    const searchQuery = document.getElementById("searchBookTitle").value.toLowerCase();

    const filteredBooks = books.filter(book => {
      return book.title.toLowerCase().includes(searchQuery);
    });

    renderBooks(filteredBooks); 
  });
});

function addBook() {
  const title = document.getElementById("bookFormTitle").value;
  const author = document.getElementById("bookFormAuthor").value;
  const year = parseInt(document.getElementById("bookFormYear").value, 10);
  const isComplete = document.getElementById("bookFormIsComplete").checked;

  const generatedID = generateId();
  const bookObject = generateBookObject(generatedID, title, author, year, isComplete);
  books.push(bookObject);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();

  document.getElementById("bookFormTitle").value = "";
  document.getElementById("bookFormAuthor").value = "";
  document.getElementById("bookFormYear").value = "";
  document.getElementById("bookFormIsComplete").checked = false;
}

let editingBookId = null;

function makeBookElement(bookObject) {
  const titleElement = document.createElement("h3");
  titleElement.setAttribute("data-testid", "bookItemTitle");

  const authorElement = document.createElement("p");
  authorElement.setAttribute("data-testid", "bookItemAuthor");

  const yearElement = document.createElement("p");
  yearElement.setAttribute("data-testid", "bookItemYear");

  const container = document.createElement("div");
  container.classList.add("book-item");
  container.setAttribute("data-bookid", bookObject.id);
  container.setAttribute("data-testid", "bookItem");

  if (bookObject.id === editingBookId) {
    titleElement.innerHTML = `
      <label for="bookTitle" class="edit-label">Judul:</label>
      <input type="text" value="${bookObject.title}" data-testid="bookItemTitleInput" />
    `;
    authorElement.innerHTML = `
      <label for="bookAuthor" class="edit-label">Penulis:</label>
      <input type="text" value="${bookObject.author}" data-testid="bookItemAuthorInput" />
    `;
    yearElement.innerHTML = `
      <label for="bookYear" class="edit-label">Tahun:</label>
      <input type="number" value="${bookObject.year}" data-testid="bookItemYearInput" />
    `;

    const buttonContainer = document.createElement("div");

    const saveButton = document.createElement("button");
    saveButton.innerText = "Simpan";
    saveButton.setAttribute("data-testid", "bookItemSaveButton");
    saveButton.classList.add("saveButton");
    saveButton.addEventListener("click", function () {
      saveEdit(bookObject.id); 
    });

    const cancelButton = document.createElement("button");
    cancelButton.innerText = "Batal";
    cancelButton.setAttribute("data-testid", "bookItemCancelButton");
    cancelButton.classList.add("cancelButton");
    cancelButton.addEventListener("click", function () {
      cancelEdit(); 
    });

    buttonContainer.append(saveButton, cancelButton);
    container.append(titleElement, authorElement, yearElement, buttonContainer);
  } else {
    titleElement.innerText = bookObject.title;
    authorElement.innerText = `Penulis: ${bookObject.author}`;
    yearElement.innerText = `Tahun: ${bookObject.year}`;

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("action-buttons");

    if (bookObject.isComplete) {
      const undoButton = document.createElement("button");
      undoButton.classList.add("undoButton");
      undoButton.setAttribute("data-testid", "bookItemIsCompleteButton");
      undoButton.innerText = "Belum Selesai";
      undoButton.addEventListener("click", function () {
        undoBookFromComplete(bookObject.id);
      });

      buttonContainer.append(undoButton);
    } else {
      const completeButton = document.createElement("button");
      completeButton.classList.add("completeButton");
      completeButton.setAttribute("data-testid", "bookItemIsCompleteButton");
      completeButton.innerText = "Selesai";
      completeButton.addEventListener("click", function () {
        moveBookToComplete(bookObject.id);
      });

      buttonContainer.append(completeButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("deleteButton");
    deleteButton.setAttribute("data-testid", "bookItemDeleteButton");
    deleteButton.innerText = "Hapus";
    deleteButton.addEventListener("click", function () {
      removeBook(bookObject.id);
    });

    const editButton = document.createElement("button");
    editButton.classList.add("editButton");
    editButton.setAttribute("data-testid", "bookItemEditButton");
    editButton.innerText = "Edit";
    editButton.addEventListener("click", function () {
      startEdit(bookObject.id);
    });

    buttonContainer.append(deleteButton, editButton);
    container.append(titleElement, authorElement, yearElement, buttonContainer);
  }

  return container;
}

function startEdit(bookId) {
  editingBookId = bookId;
  document.dispatchEvent(new Event(RENDER_EVENT)); 
}

function cancelEdit() {
  editingBookId = null;
  document.dispatchEvent(new Event(RENDER_EVENT)); 
}

function saveEdit(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  const newTitle = document.querySelector(`[data-bookid="${bookId}"] [data-testid="bookItemTitleInput"]`).value;
  const newAuthor = document.querySelector(`[data-bookid="${bookId}"] [data-testid="bookItemAuthorInput"]`).value;
  const newYear = document.querySelector(`[data-bookid="${bookId}"] [data-testid="bookItemYearInput"]`).value;

  bookTarget.title = newTitle;
  bookTarget.author = newAuthor;
  bookTarget.year = parseInt(newYear, 10);  

  editingBookId = null;  
  document.dispatchEvent(new Event(RENDER_EVENT)); 
  saveData();  
}

function moveBookToComplete(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  bookTarget.isComplete = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function undoBookFromComplete(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  bookTarget.isComplete = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function removeBook(bookId) {
  const bookTargetIndex = findBookIndex(bookId);
  if (bookTargetIndex === -1) return;

  books.splice(bookTargetIndex, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function findBook(bookId) {
  return books.find(book => book.id === bookId);
}

function findBookIndex(bookId) {
  return books.findIndex(book => book.id === bookId);
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
  }
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  if (serializedData == null) return;

  const data = JSON.parse(serializedData);
  for (const book of data) {
    books.push(book);
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

function renderBooks(bookArray) {
  const incompleteBookList = document.getElementById("incompleteBookList");
  incompleteBookList.innerHTML = "";

  const completeBookList = document.getElementById("completeBookList");
  completeBookList.innerHTML = "";

  for (const book of bookArray) {
    const bookElement = makeBookElement(book);
    if (book.isComplete) {
      completeBookList.append(bookElement);
    } else {
      incompleteBookList.append(bookElement);
    }
  }
}

document.addEventListener(RENDER_EVENT, function () {
  renderBooks(books);
});
