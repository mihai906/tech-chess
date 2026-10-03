document.querySelectorAll(".chessboard").forEach((board) => {
    const ranks = board.dataset.fen.split("/");
    const content = document.createDocumentFragment();

    if (board.dataset.coordinates === "true") {
        for (let row = 0; row < 8; row++) {
            for (let column = 0; column < 8; column++) {
                const label = document.createElement("span");
                label.className = "board-coordinate";
                if ((row + column) % 2 === 0) {
                    label.classList.add("light-square");
                } else {
                    label.classList.add("dark-square");
                }
                label.textContent = "abcdefgh"[column] + (8 - row);
                label.style.gridRow = row + 1;
                label.style.gridColumn = column + 1;
                label.setAttribute("aria-hidden", "true");
                content.append(label);
            }
        }
    }

    function addMarker(square, kind) {
        const marker = document.createElement("span");
        marker.className = `board-marker ${kind}`;
        marker.style.gridColumn = "abcdefgh".indexOf(square[0]) + 1;
        marker.style.gridRow = 9 - Number(square[1]);
        marker.setAttribute("aria-hidden", "true");
        content.append(marker);
    }

    for (const square of (board.dataset.moves || "").split(/\s+/).filter(Boolean)) {
        addMarker(square, "move");
    }

    for (const square of (board.dataset.captures || "").split(/\s+/).filter(Boolean)) {
        addMarker(square, "capture");
    }

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

            content.append(piece);
            column++;
        }
    });

    board.append(content);
});
