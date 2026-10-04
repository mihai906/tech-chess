import { Chess } from "https://esm.run/chess.js@1.4.0";

const game = new Chess();
const settings = new URLSearchParams(window.location.search);

function playerName(parameter, defaultName) {
  const value = settings.get(parameter);
  if (value === null) {
    return defaultName;
  }

  const name = value.trim().slice(0, 24);
  if (name === "") {
    return defaultName;
  }

  return name;
}

const whitePlayer = playerName("player1", "Player 1");
const blackPlayer = playerName("player2", "Player 2");

let timeMinutes = 10;
const timeSetting = settings.get("time");
if (timeSetting !== null) {
  const requestedMinutes = Number(timeSetting);
  if ([0, 3, 5, 10, 15].includes(requestedMinutes)) {
    timeMinutes = requestedMinutes;
  }
}

document.querySelector("#white-player").textContent = `${whitePlayer} (White)`;
document.querySelector("#black-player").textContent = `${blackPlayer} (Black)`;

const board = document.querySelector("#game-board");
const files = "abcdefgh";

for (let row = 0; row < 8; row++) {
  for (let column = 0; column < 8; column++) {
    const square = document.createElement("button");
    square.type = "button";
    square.className = "game-square";
    square.dataset.square = files[column] + (8 - row);
    square.setAttribute("aria-label", square.dataset.square);

    board.append(square);
  }
}

const pieceNames = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king"
};

function renderBoard() {
  for (const square of board.querySelectorAll(".game-square")) {
    square.replaceChildren();
    square.setAttribute("aria-label", square.dataset.square);
  }

  for (const rank of game.board()) {
    for (const piece of rank) {
      if (piece === null) {
        continue;
      }

      const square = board.querySelector(`[data-square="${piece.square}"]`);
      const image = document.createElement("img");

      image.src = `pieces/${piece.color}${piece.type.toUpperCase()}.svg`;
      image.alt = "";

      let color = "Black";
      if (piece.color === "w") {
        color = "White";
      }

      square.setAttribute(
        "aria-label",
        `${color} ${pieceNames[piece.type]} on ${piece.square}`
      );
      square.append(image);
    }
  }
}

const status = document.querySelector("#game-status");
const whiteClock = document.querySelector("#white-clock");
const blackClock = document.querySelector("#black-clock");
let whiteTimeLeft = timeMinutes * 60 * 1000;
let blackTimeLeft = timeMinutes * 60 * 1000;
let lastClockUpdate = 0;
let clockInterval = null;
let timeWinner = null;

function updateStatus() {
  if (timeWinner !== null) {
    status.textContent = `${timeWinner} wins on time`;
    return;
  }

  let currentPlayer = "White";
  if (game.turn() === "b") {
    currentPlayer = "Black";
  }

  if (game.isCheckmate()) {
    let winner = "Black";
    if (currentPlayer === "Black") {
      winner = "White";
    }
    status.textContent = `${winner} wins by checkmate`;
    return;
  }

  if (game.isGameOver()) {
    status.textContent = "Draw";
    return;
  }

  if (game.inCheck()) {
    status.textContent = `${currentPlayer} to move — check`;
    return;
  }

  status.textContent = `${currentPlayer} to move`;
}

function formatTime(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function renderClocks() {
  if (timeMinutes === 0) {
    whiteClock.hidden = true;
    blackClock.hidden = true;
    return;
  }

  whiteClock.textContent = formatTime(whiteTimeLeft);
  blackClock.textContent = formatTime(blackTimeLeft);
  whiteClock.classList.remove("active");
  blackClock.classList.remove("active");

  if (timeWinner === null && !game.isGameOver()) {
    if (game.turn() === "w") {
      whiteClock.classList.add("active");
    } else {
      blackClock.classList.add("active");
    }
  }
}

function tickClock() {
  if (timeMinutes === 0 || timeWinner !== null || game.isGameOver()) {
    return;
  }

  const now = Date.now();
  const elapsed = Math.max(0, now - lastClockUpdate);
  lastClockUpdate = now;

  if (game.turn() === "w") {
    whiteTimeLeft = Math.max(0, whiteTimeLeft - elapsed);
    if (whiteTimeLeft === 0) {
      timeWinner = "Black";
    }
  } else {
    blackTimeLeft = Math.max(0, blackTimeLeft - elapsed);
    if (blackTimeLeft === 0) {
      timeWinner = "White";
    }
  }

  renderClocks();

  if (timeWinner !== null) {
    window.clearInterval(clockInterval);
    clearSelection();
    updateStatus();
  }
}

let selectedSquare = null;

function clearSelection() {
  for (const marked of board.querySelectorAll(".selected, .possible-move")) {
    marked.classList.remove("selected", "possible-move");
  }
  selectedSquare = null;
}

renderBoard();
updateStatus();
renderClocks();

if (timeMinutes > 0) {
  lastClockUpdate = Date.now();
  clockInterval = window.setInterval(tickClock, 200);
}

board.addEventListener("click", (event) => {
  const square = event.target.closest(".game-square");

  if (square === null || timeWinner !== null) {
    return;
  }

  const coordinate = square.dataset.square;

  if (selectedSquare !== null && square.classList.contains("possible-move")) {
    tickClock();
    if (timeWinner !== null) {
      return;
    }

    const movingPiece = game.get(selectedSquare);
    const move = { from: selectedSquare, to: coordinate };

    if (movingPiece.type === "p" && (coordinate[1] === "1" || coordinate[1] === "8")) {
      move.promotion = "q";
    }

    game.move(move);
    lastClockUpdate = Date.now();
    clearSelection();
    renderBoard();
    updateStatus();
    renderClocks();

    if (game.isGameOver()) {
      window.clearInterval(clockInterval);
    }
    return;
  }

  clearSelection();

  if (game.isGameOver()) {
    return;
  }

  const piece = game.get(coordinate);
  if (piece === undefined || piece.color !== game.turn()) {
    return;
  }

  selectedSquare = coordinate;
  square.classList.add("selected");

  for (const move of game.moves({ square: coordinate, verbose: true })) {
    const destination = board.querySelector(`[data-square="${move.to}"]`);
    destination.classList.add("possible-move");
  }
});
