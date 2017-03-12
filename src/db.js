class User {}
User.schema = {
  name: 'User',
  properties: {
    id:  'string',
    name: 'string'
  }
};

class Game {}
Game.schema = {
  name: 'Game',
  properties: {
    id:  'string',
    users: {type: 'list', objectType: 'User'},
    state: 'string'
  }
};