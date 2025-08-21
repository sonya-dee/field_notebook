/* Field Notebook Renderer Script */

/* DOM loaded event to ensure all elements are available before running scripts

This script handles the theme selection, entry management, and inline link insertion
for a field notebook application. It uses localStorage to persist entries and themes.
The script is designed to work in an Electron environment but can also run in modern browsers
with some adjustments for external link handling. */

// Theme selection and application 
document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('themeSelect');
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    themeSelect.value = savedTheme;
    if (savedTheme !== 'default') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  themeSelect.addEventListener('change', function () {
    const selectedTheme = themeSelect.value;
    if (selectedTheme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', selectedTheme);
    }
    localStorage.setItem('theme', selectedTheme);
  });

  /* Entry management and display
  This section handles the creation, deletion, and navigation of field notebook entries.
  It uses localStorage to persist entries and allows for inline link insertion and image uploads. */

  let currentEntryIndex = 0;
  let entries = JSON.parse(localStorage.getItem('fieldEntries')) || [];

  const notesEl = document.getElementById('notes');
  const imageUpload = document.getElementById('imageUpload');
  const entryDisplay = document.getElementById('entryDisplay');

  function displayEntry() {
    if (entries.length === 0 || currentEntryIndex < 0 || currentEntryIndex >= entries.length) {
      entryDisplay.innerText = "No entries yet.";
      return;
    }
    const entry = entries[currentEntryIndex];
    entryDisplay.innerHTML = `
      <p><strong>Date:</strong> ${entry.date}</p>
      <p><strong>Weather:</strong> ${entry.weather}</p>
      <p><strong>Location:</strong> ${entry.location}</p>
      <div><strong>Notes:</strong><br>${entry.notes}</div>
    `;
  }

  if (entries.length > 0) {
    displayEntry();
  }

  window.saveEntry = function () {
    const entry = {
      date: document.getElementById('date').value,
      weather: document.getElementById('weather').value,
      location: document.getElementById('location').value,
      notes: notesEl.innerHTML
    };

    // Save or update current entry
    if (entries.length === 0) {
      entries.push(entry);
      currentEntryIndex = 0;
    } else {
      entries[currentEntryIndex] = entry;
    }

    localStorage.setItem('fieldEntries', JSON.stringify(entries));
    displayEntry();
  };

  // Delete Current Entry
  window.deleteEntry = function () {
    if (entries.length === 0) return;

    entries.splice(currentEntryIndex, 1);

    if (currentEntryIndex >= entries.length) {
      currentEntryIndex = entries.length - 1;
    }

    localStorage.setItem('fieldEntries', JSON.stringify(entries));
    displayEntry();
  };

  // Navigation through entries
  window.prevEntry = function () {
    if (entries.length === 0) return;
    currentEntryIndex = (currentEntryIndex - 1 + entries.length) % entries.length;
    displayEntry();
  };

  window.nextEntry = function () {
    if (entries.length === 0) return;
    currentEntryIndex = (currentEntryIndex + 1) % entries.length;
    displayEntry();
  };

  // Inline link insertion
  window.insertInlineLink = function () {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      alert("Please highlight text inside the notes to turn into a link.");
      return;
    }
    const range = selection.getRangeAt(0);
    if (!notesEl.contains(range.commonAncestorContainer)) {
      alert("Selected text must be inside the Notes section.");
      return;
    }
    const url = prompt("Enter the URL:");
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    const selectedText = range.extractContents();
    anchor.appendChild(selectedText);
    range.insertNode(anchor);

    range.setStartAfter(anchor);
    range.setEndAfter(anchor);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Image Upload and Insertion
  imageUpload.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('uploaded');
      insertImageAtCursor(img);
    };
    reader.readAsDataURL(file);
    this.value = '';
  });

  function insertImageAtCursor(imageElement) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(imageElement);
    range.setStartAfter(imageElement);
    range.setEndAfter(imageElement);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  notesEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
    }
  });

  window.formatText = function (command) {
    document.execCommand(command, false, null);
  };

  // Open external links in new tab - Browser Specific (for Electron)
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A' && target.href.startsWith('http')) {
      event.preventDefault();
      window.open(target.href, '_blank', 'noopener,noreferrer');
    }
  });

// Font Size Change 
function changeFontSize() {
  const notesEl = document.getElementById('notes');
  const fontSelect = document.getElementById('fontSizeSelect');
  const font = fontSelect.value;
  const selection = window.getSelection();
  
  if (!selection.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  if (!notesEl.contains(range.commonAncestorContainer)) return; 

  const span = document.createElement('span');
  span.style.fontSize = font;

  span.appendChild(range.extractContents());
  range.insertNode(span);

  range.setStartAfter(span);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

document.getElementById('fontSizeSelect').addEventListener('change', changeFontSize);

// Font Style Change 
function changeFontStyle () {
  const notesEl = document.getElementById('notes');
  const fontSelect = document.getElementById('fontStyleSelect');
  const font = fontSelect.value;
  const selection = window.getSelection();

  // Ensure selection is inside and not collapsed
  if (!selection.rangeCount || selection.isCollapsed) return;
  const range = selection.getRangeAt(0);
  if (!notesEl.contains(range.commonAncestorContainer)) return;

  // Create a span with the chosen font 
  const span = document.createElement('span');
  span.style.fontFamily = font; 

  // Extract the selected contents and wrap them 
  span.appendChild(range.extractContents());
  range.insertNode(span);

  // Move Cursor after the inserted span
  range.setStartAfter(span);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}
  document.getElementById('fontStyleSelect').addEventListener('change', changeFontStyle);

});












