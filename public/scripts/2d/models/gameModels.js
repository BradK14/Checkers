function dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

export function Piece(element, position, deps) {
    this.allowedtomove = true;
    this.element = element;
    this.position = position;
    this.player = Number(this.element.id) < 12 ? 1 : 2;
    this.king = false;

    this.makeKing = function () {
      // Hint:
      // 1) Update the piece sprite to the king image for this.player.
      let kingImg = document.createElement('img');
      kingImg.src = `../../../images/king${this.player}.png`;
      kingImg.alt = 'King';
      this.element.appendChild(kingImg);
      // 2) Set this.king = true so movement rules allow backward moves.
      this.king = true;
    };

    this.move = function (tile) {
      this.element.classList.remove('selected');
      if (!deps.board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;
      if (this.player == 1 && this.king == false && tile.position[0] < this.position[0]) return false;
      if (this.player == 2 && this.king == false && tile.position[0] > this.position[0]) return false;

      deps.board.board[this.position[0]][this.position[1]] = 0;
      deps.board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      this.element.style.top = deps.board.dictionary[this.position[0]];
      this.element.style.left = deps.board.dictionary[this.position[1]];

      if (!this.king && (this.position[0] == 0 || this.position[0] == 7)) {
        this.makeKing();
      }
      return true;
    };

    this.canJumpAny = function () {
      return (
        this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] - 2])
      );
    };

    this.canOpponentJump = function (newPosition) {
      const dx = newPosition[1] - this.position[1];
      const dy = newPosition[0] - this.position[0];
      if (this.player == 1 && this.king == false && newPosition[0] < this.position[0]) return false;
      if (this.player == 2 && this.king == false && newPosition[0] > this.position[0]) return false;

      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;

      const tileToCheckx = this.position[1] + dx / 2;
      const tileToChecky = this.position[0] + dy / 2;
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;

      if (!deps.board.isValidPlacetoMove(tileToChecky, tileToCheckx) && deps.board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        for (let pieceIndex in deps.pieces) {
          if (deps.pieces[pieceIndex].position[0] == tileToChecky && deps.pieces[pieceIndex].position[1] == tileToCheckx) {
            if (this.player != deps.pieces[pieceIndex].player) {
              return deps.pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    };

    this.opponentJump = function (tile) {
      const pieceToRemove = this.canOpponentJump(tile.position);
      if (pieceToRemove) {
        pieceToRemove.remove();
        return true;
      }
      return false;
    };

    this.remove = function () {
      this.element.style.display = 'none';
      if (this.player == 1) {
        deps.dom.player2Element.insertAdjacentHTML('beforeend', "<div class='capturedPiece'></div>");
        deps.board.score.player2 += 1;
      }
      if (this.player == 2) {
        deps.dom.player1Element.insertAdjacentHTML('beforeend', "<div class='capturedPiece'></div>");
        deps.board.score.player1 += 1;
      }
      deps.board.board[this.position[0]][this.position[1]] = 0;
      this.position = [];
      const playerWon = deps.board.checkifAnybodyWon();
      if (playerWon) {
        deps.dom.winnerElement.textContent = 'Player ' + playerWon + ' has won!';
      }
    };
  }

export function Tile(element, position, deps) {
    this.element = element;
    this.position = position;

    this.inRange = function (piece) {
      for (let k of deps.pieces) {
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      }
      if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';

      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        return 'regular';
      }
      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        return 'jump';
      }
      return 'wrong';
    };
  }

