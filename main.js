import "./style.css";
import Phaser from "phaser";

const sizes = {
  width: 500,
  height: 500,
};

const speedDown = 300;

const gameStartDiv = document.querySelector("#gameStartDiv");
const gameStartBtn = document.querySelector("#gameStartBtn");
const gameEndDiv = document.querySelector("#gameEndDiv");
const gameEndBtn = document.querySelector("#gameEndBtn"); 
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan");
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan");

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.cursor;
    this.playerSpeed = speedDown + 100;
    this.target;
    this.points = 0;
    this.textScore;
    this.textTime;
    this.timedEvent;
    this.remainingTime;
    this.coinMusic;
    this.bgMusic;
    this.emitter;
  }

  preload() {
    this.load.image("bg", "/assets/bg.png");
    this.load.image("basket", "/assets/basket.png");
    this.load.image("apple", "/assets/apple.png");
    this.load.image("sparkle", "/assets/sparkle.png");
    this.load.audio("coin", "/assets/coin.mp3");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");
  }

  create() {
    // Reset points when the scene creates/restarts
    this.points = 0;

    this.targets = this.physics.add.group();

    this.coinMusic = this.sound.add("coin");
    
    // Only play background music if it isn't already playing (stops music overlapping on restart)
    if (!this.sound.get("bgMusic")) {
      this.bgMusic = this.sound.add("bgMusic");
      this.bgMusic.play({ loop: true });
    } else {
      this.bgMusic = this.sound.get("bgMusic");
    }

    this.add.image(0, 0, "bg").setOrigin(0, 0);
    this.player = this.physics.add
      .image(0, sizes.height - 100, "basket")
      .setOrigin(0, 0);
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.player.setCollideWorldBounds(true);
    this.player.setSize(this.player.width - this.player.width / 4, this.player.height / 6).
      setOffset(this.player.width / 10, this.player.height - this.player.height / 3);

    this.target = this.physics.add
      .image(0, 0, "apple")
      .setOrigin(0, 0);
    this.target.setMaxVelocity(0, speedDown);

    this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);
    
    this.cursor = this.input.keyboard.createCursorKeys();

    this.input.on('pointermove', (pointer) => {
      this.player.x = Phaser.Math.Clamp(
        pointer.x - this.player.width / 2,
        0,
        sizes.width - this.player.width
      );
    });

    this.textScore = this.add.text(sizes.width - 120, 10, "Score: 0", {
      font: "25px Arial",
      fill: "#000000",
    });

    this.textTime = this.add.text(10, 10, "Remaining Time: 00", {
      font: "25px Arial",
      fill: "#000000",
    });

    this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);
  
    this.emitter = this.add.particles(0, 0, "sparkle", {
      speed: 100,
      gravityY: speedDown - 200,
      scale: 0.04,
      duration: 100,
      emitting: false
    });
    this.emitter.startFollow(this.player, this.player.width / 2, this.player.height / 2, true);

  }

  update() {
    this.remainingTime = this.timedEvent.getRemainingSeconds();
    this.textTime.setText(`Remaining Time: ${Math.round(this.remainingTime).toString()}`);

    if (this.target.y >= sizes.height) {
      this.target.setY(0);
      this.target.setX(this.getRandomX());
    }

    const { left, right } = this.cursor;

    if (left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
  }

  getRandomX() {
    return Math.floor(Math.random() * 480);
  }

  targetHit() {
    this.coinMusic.play();
    this.emitter.start();

    const hitX = this.target.x;
    const hitY = this.target.y;

    const plusOne = this.add.text(
        hitX,
        hitY,
        "+1",
        {
          fontSize: "24px",
          color: "#00ff00",
          fontStyle: "bold"
        }
      );

    this.tweens.add({
        targets: plusOne,
        y: hitY - 50,
        alpha: 0,
        duration: 500,
        onComplete: () => plusOne.destroy()
    });

    this.tweens.add({
      targets: this.player,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true
    });

    this.cameras.main.shake(100, 0.002);

    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.points++;
    this.textScore.setText(`Score: ${this.points}`);
    
  }

  gameOver() {
    this.scene.pause("scene-game");

    const isWin = this.points >= 10;

    if (isWin) {
      gameEndScoreSpan.textContent = this.points;
      gameWinLoseSpan.textContent = "Win!";
      this.triggerConfetti();
    } else {
      gameEndScoreSpan.textContent = this.points;
      gameWinLoseSpan.innerHTML = 'Lose! <i class="fa-solid fa-face-frown"></i>'; 
    }

    gameEndDiv.style.display = "flex";
    
  }

  triggerConfetti() {
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.6 }
      });
    }, 250);
  }
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: document.querySelector("#gameCanvas"), // Added explicit element selection selector
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: speedDown },
      debug: false,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

setTimeout(() => {
  game.scene.pause("scene-game");
}, 100);

// Start Button Handler
gameStartBtn.addEventListener("click", () => {
  gameStartDiv.style.display = "none";
  game.scene.resume("scene-game");
});

// Try Again Button Handler - FIXED FREEZE
gameEndBtn.addEventListener("click", () => {
  // 1. Hide the End Game UI overlay
  gameEndDiv.style.display = "none";
  
  // 2. Safely grab the active game scene instance
  const currentScene = game.scene.keys["scene-game"];
  
  if (currentScene) {
    // 3. Force resume FIRST so the engine updates its internal loop state
    game.scene.resume("scene-game");
    
    // 4. Trigger the fresh scene wipe and restart
    currentScene.scene.restart();
  }
});

const installBtn = document.querySelector("#installBtn");

installBtn.addEventListener("click", () => {
  alert("Store page would open here");
});

