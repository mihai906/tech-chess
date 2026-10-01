const board = document.querySelector(".chessboard");
const ranks = board.dataset.fen.split("/");
const pieces = document.createDocumentFragment();

ranks.forEach((rank, row) => {
    let column = 0;

    for (const symbol of rank) {
        if (symbol >= "1" && symbol <= "8") {
            column += Number(symbol);
            continue;
        }

        let color;

        if (symbol === symbol.toUpperCase()) {
            color = "w";
        } else {
            color = "b";
        }

        const piece = document.createElement("img");
        piece.src = `pieces/${color}${symbol.toUpperCase()}.svg`;
        piece.alt = "";
        piece.className = "board-piece";
        piece.style.gridRow = row + 1;
        piece.style.gridColumn = column + 1;

        pieces.append(piece);
        column++;
    }
});

board.append(pieces);
