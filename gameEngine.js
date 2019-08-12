(function() {
	var timeouts = [];
	var messageName = "zero-timeout-message";

	function setZeroTimeout(fn) {
		timeouts.push(fn);
		window.postMessage(messageName, "*");
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation();
			if (timeouts.length > 0) {
				var fn = timeouts.shift();
				fn();
			}
		}
	}

	window.addEventListener("message", handleMessage, true);

	window.setZeroTimeout = setZeroTimeout;
})();

const OBJECT_CIRCLE = 0;
const OBJECT_RECT = 1;
let imagesLoaded = false;

class GameObject {
  constructor(objectType, center, velocity, acceleration, color, image = undefined) {

    this.id = Math.random()*Math.pow(10, 20);

    this.center = center.slice(0);
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.type = objectType;
    this.color = color;
    this.image = image;

    // Define Vector Helper functions.
    this.vecAdd = (x, y) => [x[0] + y[0], x[1] + y[1]];
    this.vecSub = (x, y) => [x[0] - y[0], x[1] - y[1]];
    this.vecDot = (x, y) => x[0]*y[0] + x[1]*y[1];
    this.vecSlope = (x, y) => (y[1] - x[1])/(y[0] - x[0]);
    this.rotatePoint = function(point, angle) {
      return [
        point[0] * Math.cos(angle) - point[1] * Math.sin(angle),
        point[0] * Math.sin(angle) + point[1] * Math.cos(angle)
      ];
    };
    this.ptDist = (x, y) => Math.pow(
      Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2),
      0.5
    );
  }

  update() {
    this.velocity[0] += this.acceleration[0];
    this.velocity[1] += this.acceleration[1];
    this.center[0] += this.velocity[0];
    this.center[1] += this.velocity[1];
  }

  checkSATCollision(poly1, poly2, axisAngle) {
    let angleVec = [Math.cos(axisAngle), Math.sin(axisAngle)];
    let poly1Projected = poly1.map(pt => this.vecDot(pt, angleVec));
    let poly2Projected = poly2.map(pt => this.vecDot(pt, angleVec));

    let poly1Interval = [Math.min(...poly1Projected), Math.max(...poly1Projected)];
    let poly2Interval = [Math.min(...poly2Projected), Math.max(...poly2Projected)];

    return poly1Interval[0] <= poly2Interval[1] && poly2Interval[0] <= poly1Interval[1];
  }

  isCollideWithObject(object) {
    if(object.type == OBJECT_RECT) {
      return this.isCollideWithRect(object);
    } else if (object.type == OBJECT_CIRCLE) {
      return this.isCollideWithCircle(object);
    } else {
      console.log("Invalid Object Type, Returning False");
      return false;
    }
  }
}

class Circle extends GameObject {
  constructor(center, radius, velocity, acceleration, color, image = undefined) {
    super(OBJECT_CIRCLE, center, velocity, acceleration, color, image);
    this.radius = radius;
  }

  isCollideWithRect(rect) {
    // Axis Align the Rectangle.
    let circleCenterAligned = this.rotatePoint(
      this.vecSub(this.center, rect.center), rect.angle
    );

    let circleDistanceX = Math.abs(circleCenterAligned[0]);
    let circleDistanceY = Math.abs(circleCenterAligned[1]);

    if(circleDistanceX > (rect.dimensions[0]/2 + this.radius)) {
      return false;
    }
    if(circleDistanceY > (rect.dimensions[1]/2 + this.radius)) {
      return false;
    }

    if(circleDistanceX <= rect.dimensions[0]/2) {
      return true;
    }

    if(circleDistanceY <= rect.dimensions[1]/2) {
      return true;
    }

    let cornerDistanceSq = Math.pow(circleDistanceX - rect.dimensions[0]/2, 2) -
                        Math.pow(circleDistanceY - rect.dimensions[1]/2, 2);
    return (cornerDistanceSq <= Math.pow(this.radius, 2));
  }

  isCollideWithCircle(circle) {
    if(this.ptDist(this.center, circle.center) <= (this.radius + circle.radius)) {
      return true;
    } else {
      return false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(...this.center);
    ctx.arc(0, 0, this.radius, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();

    if(imagesLoaded && this.image != undefined) {
      ctx.drawImage(this.image, -this.radius, -this.radius, 2*this.radius, 2*this.radius);
    }

    ctx.restore();
  }
}

class Rect extends GameObject {
  constructor(center, dimensions, velocity, acceleration, angle, color, image = undefined) {
    super(OBJECT_RECT, center, velocity, acceleration, color, image);
    this.dimensions = dimensions;
    this.angle = angle;
  }

  /*
    Use Seperating Axis Theorem.
  */
  isCollideWithRect(rect) {
    let rect1 = this.returnRectangleCoordinates();
    let rect2 = rect.returnRectangleCoordinates();

    // Loop through first rect.
    for(let side = 0; side < 4; side++) {
      let axisAngle = Math.atan2(rect1[side][0] - rect1[(side + 1) % 4][0], rect1[(side + 1) % 4][1] - rect1[side][1]);
      if(!this.checkSATCollision(rect1, rect2, axisAngle)) return false;
    }

    // Loop through second rect.
    for(let side = 0; side < 4; side++) {
      let axisAngle = Math.atan2(rect2[side][0] - rect2[(side + 1) % 4][0], rect2[(side + 1) % 4][1] - rect2[side][1]);
      if(!this.checkSATCollision(rect2, rect1, axisAngle)) return false;
    }

    return true;
  }

  isCollideWithCircle(circle) {
    return circle.isCollideWithRect(this);
  }

  returnRectangleCoordinates() {
    let rectPts = [
      this.vecSub(this.center, this.rotatePoint([this.dimensions[0] / 2, this.dimensions[1] / 2], this.angle)),
      this.vecSub(this.center, this.rotatePoint([-this.dimensions[0] / 2, this.dimensions[1] / 2], this.angle)),
      this.vecSub(this.center, this.rotatePoint([-this.dimensions[0] / 2, -this.dimensions[1] / 2], this.angle)),
      this.vecSub(this.center, this.rotatePoint([this.dimensions[0] / 2, -this.dimensions[1] / 2], this.angle)),
    ];
    return rectPts;
  }

  returnDrawingCoordinates() {
    return [- Math.round(this.dimensions[0] / 2),
            - Math.round(this.dimensions[1] / 2),
            this.dimensions[0],
            this.dimensions[1]];
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(...this.center);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;

    if(imagesLoaded && this.image != undefined) {
      ctx.drawImage(
        this.image,
        - Math.round(this.dimensions[0]/2),
        - Math.round(this.dimensions[1]/2),
        ...this.dimensions
      );

      ctx.fillStyle = "transparent";
    }
    ctx.fillRect(...this.returnDrawingCoordinates());
    ctx.restore();
  }
}

let sound = function(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);
  this.play = function(){
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}

class GameEngine {
  constructor(canvas, keyControls, gameFunctions, colors, images, sounds) {
    this.FPS = 90;

    this.canvas = canvas;
    this.gameFunctions = gameFunctions;
    this.colors = colors;
    imagesLoaded = false;
    this.images = this.loadImages(images);
    this.sounds = this.loadSounds(sounds);

    this.ctx = canvas.getContext("2d");
    this.gameWidth = canvas.width;
    this.gameHeight = canvas.height;

    this.keyControls = keyControls;

    this.gameStarted = false;

    let self = this;
    document.addEventListener("keydown", function(e) { self.handleKeyPress(e, self, 'keydown') }, true);
    document.addEventListener("keyup", function(e) { self.handleKeyPress(e, self, 'keyup')}, true);
  }

  loadImages(sources) {
  	var nb = 0;
  	var loaded = 0;
  	var imgs = {};
  	for(var i in sources){
  		nb++;
  		imgs[i] = new Image();
  		imgs[i].src = sources[i];
  		imgs[i].onload = function(){
  			loaded++;
  			if(loaded == nb){
  				imagesLoaded = true;
  			}
  		}
  	}
    return imgs;
  }

  loadSounds(sources) {
    let sounds = [];
    for(let i in sources) {
      sounds[i] = new sound(sources[i]);
    }
    return sounds;
  }

  setFPS(fps) {
    this.FPS = parseInt(fps);
  }

  addObject(object) {
    this.objects.push(object);
  }

  deleteObject(object_id) {
    for(let i = 0; i < this.objects.length; i++) {
      if(this.objects[i].id == object_id) {
        this.objects.splice(i, 1);
      }
    }
  }

  getObjectById(object_id) {
    for(let i = 0; i < this.objects.length; i++) {
      if(this.objects[i].id == object_id) {
        return this.objects[i];
      }
    }
    return false;
  }

  startGame() {
    if(this.gameStarted == false) {
      this.gameStarted = true;
      if(typeof(this.gameFunctions.onStart) == typeof(Function)) {
        this.gameFunctions.onStart(this);
      }
      this.gameLoop();
    }
    this.sounds.background.play();
  }

  updateGame() {
    if(this.gameStarted == true) {
      for(let o = 0; o < this.objects.length; o++) {
        let object1 = this.objects[o];
        object1.update();
        if(typeof(object1.onUpdate) == typeof(Function)) {
          object1.onUpdate(this);
        }
        if(typeof(object1.onCollide) == typeof(Function)) {
          for(let p = o + 1; p < this.objects.length; p++) {
            let object2 = this.objects[p];
            if(object1.isCollideWithObject(object2)) {
              object1.onCollide(object2, this);
              if(typeof(object2.onCollide) == typeof(Function)) {
                object2.onCollide(object1, this);
              }
            }
          }
        }
      }

      if(typeof(this.gameFunctions.onUpdate) == typeof(Function)) {
        this.gameFunctions.onUpdate(this);
      }

      let self = this;

      setTimeout(function() {
        self.updateGame();
      }, 1000/this.FPS);
    } else {
      this.stopGame();
    }
  }

  stopGame() {
    if(typeof(this.gameFunctions.onStop) == typeof(Function)) {
      this.gameFunctions.onStop(this);
    }
  }

  drawGame() {
    if(this.gameStarted == true) {
      this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);

      /*
      if(this.images.background != undefined) {
        this.ctx.drawImage(this.background, 0, 0, this.width, this.height);
      }
      */

      for(let object of this.objects) {
        object.draw(this.ctx);
      }

      let self = this;

      requestAnimationFrame(function(){
        self.drawGame();
      });
    }
  }

  gameLoop() {
    if(this.gameStarted == true) {
      this.updateGame();
      this.drawGame();
    }
  }

  handleKeyPress(e, self, type) {
    if(this.gameStarted == true) {
      if(typeof(self.keyControls[type][e.keyCode]) == typeof(Function)) {
        self.keyControls[type][e.keyCode](self);
      }
    }
  }
}
