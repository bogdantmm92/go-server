var db = require('./db');
var _ = require('lodash');

var _x = [0, 0, 1, -1];
var _y = [1, -1, 0, 0];

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
  if (!isWithinBounds(move.x, move.y, game.board_size)) {
    return {ok: false, msg: 'Move is out of bounds'};
  }

  // Crete board with the previous game moves
  var board = boardWithGame(game);

  // Check if there is no stone on the current position
  if (board[move.x][move.y] !== 0) {
    return {ok: false, msg: 'Invalid move, there is already a stone in this position!'};
  }

  // Chech if move is suicidal
  // Put stone on the board
  board[move.x][move.y] = move.color;

  var visitedHash = matrix(game.board_size, false);
  var liberties = findGroupLiberties(board, move.x, move.y, move.color, visitedHash);
  if (liberties == 0) {
    return {ok: false, msg: 'Suicidal move'};
  }
  // Remove stone from the board
  board[move.x][move.y] = 0;

  return {ok: true, msg: 'Valid move'};
}

/**
* Returns the new list of moves
*/
function doMove(userId, game, move) {
  var newMoves = game.moves;
  newMoves.push(createMove(move));

  var board = boardWithGame(game);

  // Try to remove the dead surounding groups
  for (var i = 0; i < 4; i ++) {
    var x = move.x + _x[i];
    var y = move.y + _y[i];
    // Check if position is within bounds
    if (!isWithinBounds(x, y, game.board_size)) {
        continue;
    }
    // Ignore the same color neighbours
    if (board[x][y] == move.color) {
      continue;
    }
    var visitedHash = matrix(game.board_size, false);
    var liberties = findGroupLiberties(board, x, y, board[x][y], visitedHash);
    if (liberties == 0) {
      // Capture the group
      _.each(newMoves, (mv) => {
        if (visitedHash[mv.x][mv.y]) {
          mv.captured = true;
          // Remove the stone from the board
          board[mv.x][mv.y] = 0;
        }
      });
    }
  }
  return newMoves;
}

function printMatrix(matrix) {
    for (var i = 0; i < matrix.length; i ++) {
      var line = "";
      for (var j = 0; j < matrix[i].length; j ++) {
        line = line + matrix[i][j] + (matrix[i][j] == -1 ? " " : "  ");
      }
      console.log(line + "\n");
    }
    console.log("\n\n");
}

function createMove(move) {
  var currentDate = new Date();
  return new db.Move({
    'x': move.x,
    'y': move.y,
    'captured': false,
    'color': move.color,
    'created_at': currentDate
  });
}

function findGroupLiberties(board, x, y, color, visitedHash) {
  if (!isWithinBounds(x, y, board.length)) {
    return 0;
  }
  if (visitedHash[x][y]) {
    // We've been here already
    return 0;
  }
  if (board[x][y] == 0) {
    // Liberty found
    return 1;
  }
  if (board[x][y] != color) {
    // Border with enemy
    return 0;
  }

  visitedHash[x][y] = true;

  var liberties = 0;
  for (var i = 0; i < 4; i ++) {
    var x1 = x + _x[i];
    var y1 = y + _y[i];
    liberties += findGroupLiberties(board, x1, y1, color, visitedHash);
  }
  return liberties;
}

function isWithinBounds(x, y, size) {
  return 0 <= x && x < size && 0 <= y && y < size;
}

function boardWithGame(game) {
  var board = matrix(game.board_size, 0);
  var playerToMove = 1;
  _.each(game.moves, (move) => {
    // Only mark if move was not captured
    if (!move.captured) {
      board[move.x][move.y] = playerToMove;
    }
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
  checkValidMove,
  doMove
}
