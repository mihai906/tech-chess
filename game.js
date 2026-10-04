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
      image.draggable = false;
      if (piece.color === game.turn()) {
        image.classList.add("movable-piece");
      }

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
const promotionDialog = document.querySelector("#promotion-dialog");
const promotionButtons = promotionDialog.querySelectorAll("[data-promotion]");
let whiteTimeLeft = timeMinutes * 60 * 1000;
let blackTimeLeft = timeMinutes * 60 * 1000;
let lastClockUpdate = 0;
let clockInterval = null;
let timeWinner = null;
let selectedSquare = null;
let pendingPromotion = null;
let activeDrag = null;
let ignoreNextClick = false;

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

function clearSelection() {
  for (const marked of board.querySelectorAll(".selected, .possible-move")) {
    marked.classList.remove("selected", "possible-move");
  }
  selectedSquare = null;
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
    clockInterval = null;
    pendingPromotion = null;
    if (promotionDialog.open) {
      promotionDialog.close();
    }
    clearSelection();
    updateStatus();
  }
}

function startClock() {
  if (clockInterval !== null) {
    window.clearInterval(clockInterval);
  }
  clockInterval = null;
  lastClockUpdate = Date.now();
  if (timeMinutes > 0) {
    clockInterval = window.setInterval(tickClock, 200);
  }
}

function finishMove(move) {
  tickClock();
  if (timeWinner !== null) {
    return;
  }

  game.move(move);
  lastClockUpdate = Date.now();
  clearSelection();
  renderBoard();
  updateStatus();
  renderClocks();

  if (game.isGameOver() && clockInterval !== null) {
    window.clearInterval(clockInterval);
    clockInterval = null;
  }
}

function selectSquare(square) {
  clearSelection();
  if (timeWinner !== null || game.isGameOver() || pendingPromotion !== null) {
    return false;
  }

  const coordinate = square.dataset.square;
  const piece = game.get(coordinate);
  if (piece === undefined || piece.color !== game.turn()) {
    return false;
  }

  selectedSquare = coordinate;
  square.classList.add("selected");
  for (const move of game.moves({ square: coordinate, verbose: true })) {
    const destination = board.querySelector(`[data-square="${move.to}"]`);
    destination.classList.add("possible-move");
  }
  return true;
}

function attemptMove(from, to) {
  if (timeWinner !== null || game.isGameOver() || pendingPromotion !== null) {
    return;
  }

  const piece = game.get(from);
  if (piece === undefined || piece.color !== game.turn()) {
    return;
  }

  let legal = false;
  let promotion = false;
  for (const move of game.moves({ square: from, verbose: true })) {
    if (move.to === to) {
      legal = true;
      if (move.promotion !== undefined) {
        promotion = true;
      }
    }
  }

  if (!legal) {
    clearSelection();
    return;
  }

  if (promotion) {
    tickClock();
    if (timeWinner !== null) {
      return;
    }

    pendingPromotion = { from, to };
    for (const button of promotionButtons) {
      const image = button.querySelector("img");
      image.src = `pieces/${game.turn()}${button.dataset.promotion.toUpperCase()}.svg`;
    }
    promotionDialog.showModal();
    return;
  }

  finishMove({ from, to });
}

function newGame() {
  pendingPromotion = null;
  if (promotionDialog.open) {
    promotionDialog.close();
  }

  game.reset();
  whiteTimeLeft = timeMinutes * 60 * 1000;
  blackTimeLeft = timeMinutes * 60 * 1000;
  timeWinner = null;
  clearSelection();
  renderBoard();
  updateStatus();
  renderClocks();
  startClock();
}

renderBoard();
updateStatus();
renderClocks();
startClock();

board.addEventListener("click", (event) => {
  if (ignoreNextClick) {
    ignoreNextClick = false;
    return;
  }

  const square = event.target.closest(".game-square");
  if (square === null || pendingPromotion !== null) {
    return;
  }

  if (selectedSquare !== null && square.classList.contains("possible-move")) {
    attemptMove(selectedSquare, square.dataset.square);
    return;
  }

  selectSquare(square);
});

function stopDragging() {
  if (activeDrag === null) {
    return;
  }

  if (activeDrag.preview !== null) {
    activeDrag.preview.remove();
    activeDrag.image.style.opacity = "";
  }
  activeDrag = null;
}

board.addEventListener("pointerdown", (event) => {
  if (activeDrag !== null || event.button !== 0) {
    return;
  }

  const image = event.target.closest(".movable-piece");
  if (image === null || timeWinner !== null || game.isGameOver() || pendingPromotion !== null) {
    return;
  }

  activeDrag = {
    image,
    square: image.closest(".game-square"),
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    preview: null
  };
  image.setPointerCapture(event.pointerId);
});

board.addEventListener("pointermove", (event) => {
  if (activeDrag === null || event.pointerId !== activeDrag.pointerId) {
    return;
  }

  if (activeDrag.preview === null) {
    const distance = Math.hypot(
      event.clientX - activeDrag.startX,
      event.clientY - activeDrag.startY
    );
    if (distance < 6) {
      return;
    }

    if (!selectSquare(activeDrag.square)) {
      stopDragging();
      return;
    }

    const image = activeDrag.image;
    const bounds = image.getBoundingClientRect();
    const preview = image.cloneNode();
    preview.className = "drag-preview";
    preview.style.width = `${bounds.width}px`;
    preview.style.height = `${bounds.height}px`;
    document.body.append(preview);
    activeDrag.preview = preview;
    image.style.opacity = "0";
  }

  activeDrag.preview.style.left = `${event.clientX}px`;
  activeDrag.preview.style.top = `${event.clientY}px`;
  event.preventDefault();
});

board.addEventListener("pointerup", (event) => {
  if (activeDrag === null || event.pointerId !== activeDrag.pointerId) {
    return;
  }

  if (activeDrag.preview === null) {
    activeDrag = null;
    return;
  }

  const from = activeDrag.square.dataset.square;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  let destination = null;
  if (target !== null) {
    destination = target.closest(".game-square");
  }

  stopDragging();
  ignoreNextClick = true;
  window.setTimeout(() => {
    ignoreNextClick = false;
  }, 0);

  if (destination !== null && destination.classList.contains("possible-move")) {
    attemptMove(from, destination.dataset.square);
  } else {
    clearSelection();
  }
});

function cancelDragging(event) {
  if (activeDrag === null || event.pointerId !== activeDrag.pointerId) {
    return;
  }

  const wasDragging = activeDrag.preview !== null;
  stopDragging();
  if (wasDragging) {
    clearSelection();
  }
}

board.addEventListener("pointercancel", cancelDragging);
board.addEventListener("lostpointercapture", cancelDragging);

for (const button of promotionButtons) {
  button.addEventListener("click", () => {
    if (pendingPromotion === null) {
      return;
    }

    const move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: button.dataset.promotion
    };
    pendingPromotion = null;
    promotionDialog.close();
    finishMove(move);
  });
}

promotionDialog.addEventListener("close", () => {
  if (pendingPromotion !== null) {
    pendingPromotion = null;
    clearSelection();
  }
});

document.querySelector("#cancel-promotion").addEventListener("click", () => {
  promotionDialog.close();
});

document.querySelector("#new-game").addEventListener("click", newGame);
