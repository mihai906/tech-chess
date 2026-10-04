import { Chess } from "https://esm.run/chess.js@1.4.0";

const game = new Chess();

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

board.addEventListener("click", (event) => {
  const square = event.target.closest(".game-square");

  if (square === null) {
    return;
  }

  console.log(square.dataset.square);
});
