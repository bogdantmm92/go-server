/*
white = -1
black = 1
open = 0
*/
function checkValidMove(game, move) {
  // Check if move is made by the correct color
  if (move.color !== game.current_turn) {
    return false;
  }

  var board = matrix(game.board_size, 0);
  var playerToMove = -1;

  for (var i in game.moves) {
    var move = game.moves[i];
    if (board[move.x][move.y] !== 0) {
      return false;
    }
    playerToMove = playerToMove == 1 ? -1 : 1;
  }
  return true;
}

function matrix(size, fill) {
  var board = new Array(size);
  for (var i = 0; i < size; i ++) {
    board[i] = new Array(size);
    for (var j = 0; j < size; j++) {
      board[i][j] = fill;
    }
  }
  return board;
}
