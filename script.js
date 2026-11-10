// Your custom words mapped to their corresponding photos
const wordData = {
  sortie: ["images/dogs1.jpg", "images/dogs2.jpg"],
  gugels: ["images/europe1.jpg", "images/europe2.jpg", "images/europe3.jpg"],
  arches: ["images/mango1.jpg"],
  roscoe: ["images/dogs1.jpg", "images/dogs2.jpg"],
  snowy: ["images/europe1.jpg", "images/europe2.jpg", "images/europe3.jpg"],
  marmot: ["images/mango1.jpg"],
  legos: ["images/mango1.jpg"],
};

const words = Object.keys(wordData);
let currentWord = words[Math.floor(Math.random() * words.length)];
let wordLength = currentWord.length;

const playView = document.getElementById("play-view");
const winScreen = document.getElementById("win-screen");
const loseScreen = document.getElementById("lose-screen");
const targetWordEl = document.getElementById("target-word");

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const messageContainer = document.getElementById("message-container");

let currentRow = 0;
let currentTile = 0;
let isGameOver = false;

const keyboardRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

function initGame() {
  currentRow = 0;
  currentTile = 0;
  isGameOver = false;

  currentWord = words[Math.floor(Math.random() * words.length)];
  wordLength = currentWord.length;

  playView.classList.remove("hidden");
  winScreen.classList.add("hidden");
  loseScreen.classList.add("hidden");
  messageContainer.textContent = "";

  buildBoard();
  buildKeyboard();
}

function buildBoard() {
  board.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.classList.add("board-row");
    row.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;

    for (let j = 0; j < wordLength; j++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.setAttribute("data-row", i);
      tile.setAttribute("data-tile", j);
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function buildKeyboard() {
  keyboard.innerHTML = "";
  keyboardRows.forEach((rowKeys, rowIndex) => {
    const rowElement = document.createElement("div");
    rowElement.classList.add("keyboard-row");

    // Add half-key spacer at start of Row 2 (A-L) to match Wordle spacing
    if (rowIndex === 1) {
      const spacerLeft = document.createElement("div");
      spacerLeft.classList.add("key-spacer");
      rowElement.appendChild(spacerLeft);
    }

    rowKeys.forEach((key) => {
      const keyElement = document.createElement("button");
      keyElement.textContent = key === "backspace" ? "⌫" : key;
      keyElement.classList.add("key");
      keyElement.setAttribute("data-key", key);

      if (key === "enter" || key === "backspace") {
        keyElement.classList.add("wide-key");
      }

      keyElement.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handleKeyPress(key);
      });

      rowElement.appendChild(keyElement);
    });

    // Add half-key spacer at end of Row 2 (A-L)
    if (rowIndex === 1) {
      const spacerRight = document.createElement("div");
      spacerRight.classList.add("key-spacer");
      rowElement.appendChild(spacerRight);
    }

    keyboard.appendChild(rowElement);
  });
}

// Physical keyboard listener for laptops
document.addEventListener("keydown", (e) => {
  if (isGameOver) return;

  if (e.key === "Enter") {
    handleKeyPress("enter");
  } else if (e.key === "Backspace") {
    handleKeyPress("backspace");
  } else {
    const key = e.key.toLowerCase();
    if (/^[a-z]$/.test(key)) {
      handleKeyPress(key);
    }
  }
});

function handleKeyPress(key) {
  if (isGameOver) return;

  if (key === "enter") {
    checkWord();
  } else if (key === "backspace") {
    deleteLetter();
  } else {
    addLetter(key);
  }
}

function addLetter(letter) {
  if (currentTile < wordLength) {
    const tile = document.querySelector(
      `[data-row="${currentRow}"][data-tile="${currentTile}"]`
    );
    if (tile) {
      tile.textContent = letter;
      currentTile++;
    }
  }
}

function deleteLetter() {
  if (currentTile > 0) {
    currentTile--;
    const tile = document.querySelector(
      `[data-row="${currentRow}"][data-tile="${currentTile}"]`
    );
    if (tile) {
      tile.textContent = "";
    }
  }
}

function checkWord() {
  const rowTiles = document.querySelectorAll(`[data-row="${currentRow}"]`);
  const guess = Array.from(rowTiles)
    .map((tile) => tile.textContent.trim())
    .join("");

  if (guess.length < wordLength) {
    showMessage(`Not enough letters! (Need ${wordLength})`);
    return;
  }

  const isCorrect = guess === currentWord;
  flipTiles(guess, isCorrect);
}

function flipTiles(guess, isCorrect) {
  const guessArray = guess.split("");
  const wordArray = currentWord.split("");
  const statusArray = new Array(wordLength).fill(""); // FIXED: properly initialized array

  // Track frequency of letters in the target word
  const letterCount = {};
  wordArray.forEach((letter) => {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  });

  // PASS 1: Check for Greens (Exact matches)
  guessArray.forEach((letter, index) => {
    if (letter === wordArray[index]) {
      statusArray[index] = "correct";
      letterCount[letter]--; // Reduce available count
    }
  });

  // PASS 2: Check for Yellows (Present) and Grays (Absent)
  guessArray.forEach((letter, index) => {
    if (statusArray[index] === "correct") return; // Skip already green tiles

    if (wordArray.includes(letter) && letterCount[letter] > 0) {
      statusArray[index] = "present";
      letterCount[letter]--; // Reduce available count
    } else {
      statusArray[index] = "absent";
    }
  });

  // Animate and apply classes using the computed statuses
  guessArray.forEach((letter, index) => {
    const tile = document.querySelector(
      `[data-row="${currentRow}"][data-tile="${index}"]`
    );
    const status = statusArray[index];

    setTimeout(() => {
      tile.classList.add("flip");
      setTimeout(() => {
        tile.classList.add(status);
        updateKeyboard(letter, status);
        tile.classList.remove("flip");

        if (index === wordLength - 1) {
          if (isCorrect) {
            isGameOver = true;
            setTimeout(showWinScreen, 800);
          } else {
            currentRow++;
            currentTile = 0;
            if (currentRow === 6) {
              isGameOver = true;
              setTimeout(showLoseScreen, 800);
            }
          }
        }
      }, 150);
    }, index * 250);
  });
}

function updateKeyboard(letter, status) {
  const key = document.querySelector(`.key[data-key="${letter}"]`);
  if (key) {
    // If the key is already correct, never downgrade it to present or absent
    if (key.classList.contains("correct")) return;
    if (status === "correct") {
      key.classList.remove("present", "absent");
      key.classList.add("correct");
    } else if (status === "present" && !key.classList.contains("present")) {
      key.classList.remove("absent");
      key.classList.add("present");
    } else if (
      !key.classList.contains("present") &&
      !key.classList.contains("absent")
    ) {
      key.classList.add("absent");
    }
  }
}

function showMessage(message) {
  messageContainer.textContent = message;
  setTimeout(() => {
    if (messageContainer.textContent === message) {
      messageContainer.textContent = "";
    }
  }, 2000);
}

function showWinScreen() {
  playView.classList.add("hidden");
  winScreen.classList.remove("hidden");

  const photoGallery = document.getElementById("photo-gallery");
  photoGallery.innerHTML = "";

  const photos = wordData[currentWord] || [];

  if (photos.length > 0) {
    photos.forEach((photoSrc) => {
      const img = document.createElement("img");
      img.src = photoSrc;
      img.alt = `Memory for ${currentWord}`;
      photoGallery.appendChild(img);
    });
  } else {
    photoGallery.innerHTML = `<p class="photo-placeholder">Great job guessing ${currentWord.toUpperCase()}!</p>`;
  }
}

function showLoseScreen() {
  targetWordEl.textContent = currentWord.toUpperCase();
  playView.classList.add("hidden");
  loseScreen.classList.remove("hidden"); // FIXED: properly reveals the lose screen
}

document.querySelectorAll(".restart-btn").forEach((btn) => {
  btn.addEventListener("click", initGame);
});

buildBoard();
buildKeyboard();
