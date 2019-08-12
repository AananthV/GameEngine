let canvas = document.querySelector('#game');
boundingRect = canvas.getBoundingClientRect();

let images = {};

let colors = {
  'player1': 'red',
  'player2': 'blue'
};

let sounds = {
  'background': 'sample/8bitwin.mp3',
  'explosion': 'sample/explosion.mp3'
};

class Ball extends Circle {
  constructor(playerNum, center) {
    super(
      center,
      20,
      [0, 0],
      [0, 0],
      "black"
    );
    this.playerNum = playerNum;
  }

  onUpdate(gameEngine) {
    if(
      this.center[0] - this.radius < 0 ||
      this.center[0] + this.radius > gameEngine.gameWidth ||
      this.center[1] + this.radius > gameEngine.gameHeight
    ) {
      gameEngine.deleteObject(this.id);
    }
  }

  onCollide(object, gameEngine) {
    if(object.playerNum != this.playerNum) {
      if(object.type == OBJECT_CIRCLE) {
        gameEngine.getObjectById('player' + object.playerNum).hasBall = false;
      }
      gameEngine.deleteObject(this.id);
      gameEngine.sounds.explosion.play();
    }
  }

  launch(velocity) {
    this.velocity = velocity;
    this.acceleration = [0, gameGravity];
  }
}

class Player extends Rect {
  constructor(playerNumber, playerColor) {
    let center = [150, 500]
    if(playerNumber == 2) {
      center = [750, 500];
    }

    super(
      center,
      [40, 200],
      [0, 0],
      [0, gameGravity],
      0,
      playerColor
    );

    this.playerNum = playerNumber;
    this.id = 'player' + playerNumber;

    this.moveRange = [20, 280];
    if(playerNumber == 2) {
      this.moveRange = [620, 880];
    }

    this.score = 0;
    this.ballSpawnInterval = 200;
    this.interval = 0;

    this.jumping = false;
    this.ball = undefined;
    this.hasBall = false;
  }

  onUpdate(gameEngine) {
    if(!this.hasBall) {
        this.interval++;
    }
    if(this.center[0] < this.moveRange[0]) {
      this.center[0] = this.moveRange[0];
    }
    if(this.center[0] > this.moveRange[1]) {
      this.center[0] = this.moveRange[1];
    }
    if(this.hasBall) {
      this.ball.center = this.vecSub(this.center, [0, 120]);
    }
    if(this.center[1] + 100 > gameEngine.gameHeight) {
      this.center[1] = 500;
      this.velocity[1] = 0;
      this.jumping = false;
    }
    if(this.interval >= this.ballSpawnInterval && this.hasBall == false) {
      this.interval = 0;
      this.spawnBall();
      gameEngine.addObject(this.ball);
    }

    if(this.playerNum == 2) {
      let choice = Math.random();
      if(choice > 0.6) {
        this.velocity[0] = 0;
      } else if (choice > 0.3) {
        this.velocity[0] = 5;
      } else {
        this.velocity[0] = -5;
      }

      if(Math.random() > 0.9 && this.jumping == false) {
        this.velocity[1] = -20;
        this.jumping = true;
      }

      if(Math.random() > 0.75 && this.hasBall && this.velocity[1] > 0 && this.velocity[0] < 0) {
        this.launchBall([-25, 0]);
      }
    }
  }

  onCollide(ball, gameEngine) {
    if(ball.playerNum != this.playerNum) {
      let oppositePlayer = gameEngine.getObjectById('player' + ball.playerNum);
      oppositePlayer.score++;
      document.querySelector('#p' + ball.playerNum + 'score').innerHTML = oppositePlayer.score;
    }
  }

  spawnBall() {
    this.ball = new Ball(
      this.playerNum,
      [this.center[0], this.center[1] - 120]
    );
    this.hasBall = true;
  }

  launchBall(velocity) {
    if(this.hasBall) {
      this.ball.launch(this.vecAdd(velocity, this.velocity));
      this.hasBall = false;
    }
  }
}

let playerHeight = 200;
let playerWidth = 40;
let ballRadius = 20;

let gameGravity = 1;

let playerNum = 1;

let keyControls = {
  'keydown': {
    '37': function(gameEngine) {
      gameEngine.getObjectById('player' + playerNum).velocity[0] = -5;
    },
    '38': function(gameEngine) {
      let player = gameEngine.getObjectById('player' + playerNum);
      if(player.jumping == false) {
        player.velocity[1] = -20;
        player.jumping = true;
      }
    },
    '39': function(gameEngine) {
      gameEngine.getObjectById('player' + playerNum).velocity[0] = 5;
    },
    '40': function(gameEngine) {
    },
    '65': function() { //a

    },
    '68': function() { //d

    },
    '32': function() {
      let player = gameEngine.getObjectById('player' + playerNum);
      player.launchBall([25, 0]);
    }
  },
  'keyup': {
    '37': function(gameEngine) {
      gameEngine.getObjectById('player' + playerNum).velocity[0] = 0;
    },
    '38': function(gameEngine) {
    },
    '39': function(gameEngine) {
      gameEngine.getObjectById('player' + playerNum).velocity[0] = 0;
    },
    '40': function(gameEngine) {
    },
    '65': function() { //a

    },
    '68': function() { //d

    }
  }
}

let gameFunctions = {
  'onStart': function(gameEngine) {
    gameEngine.objects = [];
    let player1 = new Player(1, gameEngine.colors.player1);
    let player2 = new Player(2, gameEngine.colors.player2);
    gameEngine.objects.push(player1);
    gameEngine.objects.push(player2);
    gameEngine.sounds.background.play();
  },
  'onUpdate': function(gameEngine) {
    gameEngine.interval++;
  },
  'onStop': function(gameEngine) {
    gameEngine.startGame();
  }
}

let gameEngine = new GameEngine(canvas, keyControls, gameFunctions, colors, images, sounds);
gameEngine.startGame();
