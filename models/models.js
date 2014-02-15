var global;
var runner;
try {
  global = module.exports;
  runner = "server";
} catch (e) {
  global = window;
  runner = "client";
}
(function (window) {
  
  var MAP_SIZE = [10, 10];
  
  var UP = 0;
  var RIGHT = 1;
  var LEFT = 2;
  var DOWN = 3;
  var directions = [
    "0,-1",
    "1,0",
    "0,1",
    "-1,0"
  ];

  function IDGenerator() {
    this.currentID = 0;
  }

  
  IDGenerator.prototype.generate = function () {
    return this.currentID++;
  };
  
  var idgen = new IDGenerator();
    

  function GameState () {
    this.players = {};
    this.projectiles = {};
  }

  GameState.prototype.registerPlayer = function (player) {
    if (player.id === undefined) {
      throw new Error("Player id not defined!");
    }
    this.players[player.id] = player;
  };
  
  GameState.prototype.deregisterPlayer = function (player) {
    delete this.players[player.id];
  };

  GameState.prototype.registerProjectile = function (projectile) {
    this.projectiles.push = projectile;
  };

  GameState.prototype.deregisterProjectile = function (projectile) {
    delete this.projectiles[projectile.id];
  };

  GameState.prototype.serialize = function () {
    function serialize(obj) {
      return obj.serialize();
    }
    var gameState = {players:{}, projectiles:{}};
    for (var i in this.players) {
      gameState.players[i] = serialize(this.players[i]);
    }

    for (var i in this.projectiles) {
      gameState.projectiles[i] = serialize(this.projectiles[i]);
    }
    return gameState;
  };

  GameState.prototype.unserialize = function (obj) {
    var self = this;
    obj.players = obj.players || {};
    obj.projectiles = obj.projectiles || {};
    var players = obj.players;
    merge(self.players, obj.players, this, "player");
    merge(self.projectiles, obj.projectiles, this, "projectile");
  };

  // merges obj2 into obj
  // Merging function is as follows:
  // If key exists in obj but not in obj2, then remove key from obj
  function merge(obj, obj2, gameState, type) {
    for (var i in obj) {
      if (!obj2[i]) {
        delete obj[i];
      } else {
        for (var j in obj2[i]) {
          obj[i][j] = obj2[i][j];
        }
      }
    }
    for (var i in obj2) {
      if (!obj[i] && type === "player") {
        new Player(gameState, obj2[i].id);
      } else if (!obj[i] && type === "projectile") {
        new Projectile(gameState, obj2[i].id);
      }
    } 
  }
  
  function Player(gameState, id) {
    this.gameState = gameState;
    this.id = id || idgen.generate();
    this.gameState.registerPlayer(this);
    do {
      this.x = Math.floor(Math.random() * MAP_SIZE[0]);
      this.y = Math.floor(Math.random() * MAP_SIZE[1]);
    } while (this.checkCollision());
    this.direction = Math.floor(Math.random() * 4);
    this.HP = 3;
    this.type = "player";
  }

  Player.prototype.serialize = function () {
    var obj = {};
    for (var i in this) {
      if (typeof(this[i]) === "object" ||
          typeof(this[i]) === "function") {
        continue;
      } else {
        obj[i] = this[i];
      }
    }
    return obj;
  };

  Player.prototype.move = function (x, y) {
    if (this.gameState === undefined) {
      throw new Error("Game State not defined!");
    }
    var oldX = this.x;
    var oldY = this.y;
    this.x = x;
    this.y = y;
   
    if (this.checkCollision()) {
      return false;
    }

    
    var changeX = this.x - oldX;
    var changeY = this.y - oldY;

    this.direction = directions.indexOf([changeX, changeY].toString()); 
    if (this.direction === -1) {
      throw new Error("Direction is borked!");
    }
    
    this.x = x;
    this.y = y;
    return true;
  };

  // Returns true if there is a collision
  Player.prototype.checkCollision = function () {
    for (var i = 0; i < this.gameState.players.length; i++) {
      if (this.gameState.players[i] !== this &&
          (this.gameState.players[i].x === this.x || 
          this.gameState.players[i].y === this.y)) {
        return true;
      }
    }
    return false;
  };


  Player.prototype.shoot = function (direction) {
    var projectile = new Projectile(this.gameState,
                                    x + directions[direction][0],
                                    y + directions[direction][1],
                                    direction,
                                    this);
  };

  function Projectile(gameState, x, y, direction, owner) {
    if (!gameState || !x || !y || !direction || !owner) {
      throw new Error("Undefined argments passed into Projectile constructor!");
    }
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.owner = owner;
    this.id = idgen.generate(); // Not too sure if this is necessary
    gameState.registerProjectile(this);
  }

  Projectile.updateState = function () {
    var oldX = this.x;
    var oldY = this.y;
    this.x = oldX + directions[this.direction][0];
    this.y = oldY + directions[this.direction][1];

    var playerCollision = this.checkCollision();
    if (playerCollision !== "wall") {
      playerCollision.HP--;
      gameState.deregisterProjectile(this);
    }
  };

  Projectile.prototype.checkCollision = function () {
    for (var i = 0; i < this.gameState.players.length; i++) {
      if (this.gameState.players[i].x === x || 
          this.gameState.players[i].y === y) {
        return this.gameState.players[i];
      }
      if (this.gameState.players[i].x > MAP_SIZE[0] ||
          this.gameState.players[i].y > MAP_SIZE[1]) {
        return "wall";
      }
    }
    return false;
  };
 
  Projectile.prototype.serialize = function () {
    var obj = {};
    for (var i in this) {
      if (typeof(this[i]) === "object" ||
          typeof(this[i]) === "function") {
        continue;
      } else {
        obj[i] = this[i];
      }
    }
    return obj;
  };
  
  window.Player = Player;
  window.Projectile = Projectile;
  window.GameState = GameState;
})(global);
