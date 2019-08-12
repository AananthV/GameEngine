let canvas = document.querySelector('#game');
boundingRect = canvas.getBoundingClientRect();
let images = {
  'plane': 'sample/plane.jpg',
  'missile': 'sample/missile.png'
};
let colors = {
  'red': 'red',
  'black': 'black'
};
let sounds = {
  'background': 'sample/8bitwin.mp3',
  'explosion': 'sample/explosion.mp3'
};

let planeRadius = 20;
let missileRadius = 10;

let missileAcceleration = 0.25;
let maxMissileVelocity = 6;

let interval = 0;
let missileSpawnInterval = 150;

let planeX = 0;
let planeY = 0;

let createMissile = function() {
  let mCenter = [];
  if(Math.random() > 0.5) {
    if(Math.random() > 0.5) {
      mCenter = [Math.round(Math.random() * canvas.width), 0]
    } else {
      mCenter = [Math.round(Math.random() * canvas.width), canvas.height]
    }
  } else {
    if(Math.random() > 0.5) {
      mCenter = [0, Math.round(Math.random() * canvas.height)]
    } else {
      mCenter = [canvas.width, Math.round(Math.random() * canvas.height)]
    }
  }
  /*
  let missile = new Circle(
    mCenter,
    missileRadius,
    [0, 0],
    [0, 0],
    "red",
    gameEngine.images.missile
  );
  */
  let missile = new Rect(
    mCenter,
    [missileRadius*2, missileRadius],
    [0, 0],
    [0, 0],
    0.5,
    "red"
  );
  missile.onUpdate = function() {
    this.acceleration = getMissileAcceleration(this);
    this.velocity[0] = this.velocity[0] > maxMissileVelocity ? maxMissileVelocity : this.velocity[0];
    this.velocity[1] = this.velocity[1] > maxMissileVelocity ? maxMissileVelocity : this.velocity[1];
  }
  missile.onCollide = function(object, gameEngine) {
    gameEngine.deleteObject(this.id);
    gameEngine.sounds.explosion.play();
  }
  return missile;
}

let getMissileAcceleration = function(missile) {
  let dX = planeX - missile.center[0];
  let dY = planeY - missile.center[1];

  let mag = Math.sqrt(dX * dX + dY * dY);

  return [
    dX * missileAcceleration / mag,
    dY * missileAcceleration / mag,
  ];
}

let gameFunctions = {
  'onStart': function(gameEngine) {
    /*
    let plane = new Circle(
      [0, 0],
      planeRadius,
      [0, 0],
      [0, 0],
      "black",
      gameEngine.images.plane
    );
    */

    interval = 0;

    let plane = new Rect(
      [60, 60],
      [planeRadius*2, planeRadius],
      [0, 0],
      [0, 0],
      1,
      "black"
    );

    plane.onUpdate = function(gameEngine) {
      [planeX, planeY] = this.center;
    }

    plane.onCollide = function(object, gameEngine) {
      gameEngine.gameStarted = false;
    }

    plane.id = "plane";

    plane.center = [
      Math.round(canvas.width/2),
      Math.round(canvas.height/2)
    ];

    gameEngine.objects = [plane];
  },
  'onStop': function(gameEngine) {
    gameEngine.startGame();
  },
  'onUpdate': function(gameEngine) {
    interval++;
		if(interval == missileSpawnInterval) {
			gameEngine.addObject(createMissile());
			interval = 0;
		}
  }
}

let keyControls = {
  'keydown': {},
  'keyup': {}
}

let gameEngine = new GameEngine(canvas, keyControls, gameFunctions, colors, images, sounds);

document.onmousemove = function(e) {
  let pX = e.clientX - boundingRect.left;
  let pY = e.clientY - boundingRect.top;
  pX = pX > planeRadius ? pX : planeRadius;
  pY = pY > planeRadius ? pY : planeRadius;
  pX = pX < canvas.width - planeRadius? pX : canvas.width - planeRadius;
  pY = pY < canvas.height - planeRadius ? pY : canvas.height - planeRadius;
  planeX = pX;
  planeY = pY;

  gameEngine.getObjectById('plane').center = [planeX, planeY];
}

gameEngine.startGame();
