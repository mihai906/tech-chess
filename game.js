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

function updateStatus() {
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

let selectedSquare = null;

function clearSelection() {
  for (const marked of board.querySelectorAll(".selected, .possible-move")) {
    marked.classList.remove("selected", "possible-move");
  }
  selectedSquare = null;
}

renderBoard();
updateStatus();

board.addEventListener("click", (event) => {
  const square = event.target.closest(".game-square");

  if (square === null) {
    return;
  }

  const coordinate = square.dataset.square;

  if (selectedSquare !== null && square.classList.contains("possible-move")) {
    const movingPiece = game.get(selectedSquare);
    const move = { from: selectedSquare, to: coordinate };

    if (movingPiece.type === "p" && (coordinate[1] === "1" || coordinate[1] === "8")) {
      move.promotion = "q";
    }

    game.move(move);
    clearSelection();
    renderBoard();
    updateStatus();
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
