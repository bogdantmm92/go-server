var _ = require('lodash');

/*
white = -1
black = 1
open = 0
*/
function checkValidMove(userId, game, move) {
  // Check if move is made by the correct color
  if (game.current_turn == 1) {
    if (move.color != 1 || game.black !== userId) {
      return {ok: false, msg: "Invalid move, black's turn!"};
    }
  } else if (game.current_turn == -1) {
    if (move.color != -1 || game.white !== userId) {
      return {ok: false, msg: "Invalid move, white's turn!"};
    }
  }

  // Check if move is between bounds
  if (move.x < 0 || move.x >= game.board_size || move.y < 0 || move.y >= game.board_size) {
    return {ok: false, msg: 'Move is out of bounds'};
  }

  // Crete board with the previous game moves
  var board = boardWithGame(game);

  // Check if there is no stone on the current position
  if (board[move.x][move.y] !== 0) {
    return {ok: false, msg: 'Invalid move, there is already a stone in this position!'};
  }

  return {ok: true, msg: 'Valid move'};
}

function boardWithGame(game) {
  var board = matrix(game.board_size, 0);
  var playerToMove = 1;
  _.each(game.moves, (move) => {
    board[move.x][move.y] = playerToMove;
    playerToMove = playerToMove == 1 ? -1 : 1;
  });
  return board;
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
module.exports = {
  checkValidMove
}
