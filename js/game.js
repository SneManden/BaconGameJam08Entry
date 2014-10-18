var Game = function(debug) {
    this.background = 0x66ff99;
    this.width = 800; //1024;
    this.height = 480; //576;
    this.STATES = {
        LOADING: 0,
        MENU: 1,
        PLAY: 2
    }
    this.assets = [
        "img/spritesheet.json",
        "img/background.png",
        "img/grass.png",
        "img/woodtile.png",
        "img/black.png"
    ];
    // this.entitiesContainer = new PIXI.DisplayObjectContainer();
    // this.solidsContainer = new PIXI.DisplayObjectContainer();
    this.cameraStage = new PIXI.DisplayObjectContainer();
    this.borderHorStage = new PIXI.DisplayObjectContainer();
    this.borderVerStage = new PIXI.DisplayObjectContainer();
    this.backStage = new PIXI.DisplayObjectContainer();
    this.world = new PIXI.DisplayObjectContainer();
    this.camera = null;
    this.entities = [];
    this.solids = [];

    this.keysDown = {};
    Util.debug = debug;

    this.ticks = 0;

    this.scenes = [
        {
            name: "house",
            border: {left: 0, right: 1600, top: 0, bottom: 1200},
            background: {img:this.assets[3], tileScale:3}
        }
    ];
    this.scene = 0;
};
Game.prototype = {

    init: function(container) {
        Util.log("Game initializing");
        this.state = this.STATES.LOAD;
        // Set proper pixel scaling
        PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
        // Set stage and renderer
        this.stage = new PIXI.Stage(this.background);
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height);
        // Add renderer (canvas element) to container
        container.appendChild(this.renderer.view);
        this.setupKeyboard();
        // World & camera (order here is important)
        this.stage.addChild(this.backStage);
        this.stage.addChild(this.borderHorStage);
        this.stage.addChild(this.borderVerStage);
        this.stage.addChild(this.world);
        this.stage.addChild(this.cameraStage);
        this.camera = new Camera(this, this.width, this.height);
        // Loading
        this.loader = new PIXI.AssetLoader(this.assets);
        this.loader.onComplete = partial(this.onAssetsLoaded, this);
        this.loader.load();
        setTimeout(gameLoop, 0);
    },

    setupKeyboard: function() {
        document.onkeydown = partial(this.handleKeyDown, this);
        document.onkeyup = partial(this.handleKeyUp, this);
        document.onkeypress = partial(this.handleKeyPress, this);
    },

    handleKeyDown: function(self, e) {
        Util.log("down: " + e.keyIdentifier + " ("+e.keyCode+")", 1);
        self.keysDown[e.keyCode] = true;
        // Suppress default action of arrow keys
        if ([37,38,39,40].indexOf(e.keyCode) > -1)
            e.preventDefault();
    },

    handleKeyUp: function(self, e) {
        self.keysDown[e.keyCode] = false;
        // Handle that arrow keys are pressed
        if ([37,38,39,40].indexOf(e.keyCode) > -1)
            self.handleKeyPress(self, e);

        if (self.player) // why does .prototype not work? (using .__proto__)
            self.player.__proto__.handleKeyUp.call(self.player, e.keyCode);
        if (self.player) // why does .prototype not work? (using .__proto__)
            self.player.__proto__.handleKeyPressed.call(self.player, e.keyCode);
    },

    handleKeyPress: function(self, e) {
        Util.log("press: " + e.keyIdentifier + " ("+e.keyCode+")", 1);
    },

    addEntity: function(entity) {
        this.entities.push(entity);
        this.world.addChild(entity.sprite);
        Util.log("Entities: " + this.entities.length);
    },

    addSolid: function(solid) {
        this.solids.push(solid);
        this.world.addChild(solid.sprite);
        Util.log("Solids: " + this.solids.length);
    },

    onAssetsLoaded: function(self) {
        Util.log("Assets loaded");
        self.start();
    },

    setupMenu: function() {
        this.state = this.STATES.MENU;
    },

    setScene: function() {
        var scene = this.scenes[this.scene];
        // Tiling background
        var backtex = PIXI.Texture.fromImage(scene.background.img);
        this.background = new PIXI.TilingSprite(backtex, this.width, this.height);
        this.background.tileScale.x = scene.background.tileScale;
        this.background.tileScale.y = scene.background.tileScale;
        this.backStage.addChild(this.background);
        // Set border
        var borderTex = PIXI.Texture.fromImage("img/black.png");
        this.borderSprites = [];
        var border = scene.border;
        for (var i=0; i<4; i++) {
            borderSprite = new PIXI.TilingSprite(borderTex, this.width, this.height);
            switch (i) {
                case 2: borderSprite.position.y = border.top-this.height; // top
                        this.borderVerStage.addChild(borderSprite); break;
                case 0: borderSprite.position.x = border.right; // right
                        this.borderHorStage.addChild(borderSprite); break;
                case 3: borderSprite.position.y = border.bottom; // bottom
                        this.borderVerStage.addChild(borderSprite); break;
                case 1: borderSprite.position.x = border.left-this.width; //left
                        this.borderHorStage.addChild(borderSprite); break;
            }
            this.borderSprites.push(borderSprite);
        }

        // Enemies
        var numEnemies = 500;
        for (var j=0; j<2; j++) {
            var left = (j==0 ? 0 : (scene.border.left+scene.border.right)/2);
            var right = (j==0 ? (scene.border.left+scene.border.right)/2 : scene.border.right);
            for (var i=0; i<numEnemies; i++) {
                var pos = {
                        x: Util.getRandomInt(left+100, right-100),
                        y: Util.getRandomInt(100, scene.border.bottom-250)
                    }, enemy = new Enemy(this, pos).init();
                this.addEntity(enemy);
            }
        }
    },

    start: function() {
        Util.log("Game started");
        this.state = this.STATES.PLAY;

        this.setScene();

        // Player
        this.player = new Player(this, {x:this.width/2,y:this.height/2}).init();
        this.addEntity(this.player);
    },

    animate: function() {
        for (var i in this.entities) {
            if (this.entities[i] !== null)
                this.entities[i].animate();
        }

        // Follow player
        if (!this.player) return;
        this.camera.follow(this.player.sprite);
        // Set tiling background
        this.background.tilePosition.x = this.world.position.x/3;
        this.background.tilePosition.y = this.world.position.y/3;
        // Set tiling border
        for (var i in this.borderSprites) {
            if (i == 2 || i == 3)
                this.borderSprites[i].tilePosition.x = this.world.position.x;
            if (i == 0 || i == 1)
                this.borderSprites[i].tilePosition.y = this.world.position.y;
        }


        // Sort by "depth" once a second (for correct order of drawing entities)
        if (this.ticks % 10 == 0)
            this.world.children.sort(function(a,b) {
                if (a.position.y < b.position.y) return -1;
                if (a.position.y > b.position.y) return 1;
                return 0;
            });
        this.ticks++;
    },

    animateLoading: function() {
        //
    },

    animateMenu: function() {
        //
    },

    animatePlay: function() {
        //
    },

    tick: function() {
        this.animate();
        this.renderer.render(this.stage);
    }

};



/**
 * Gameloop
 */
function gameLoop() {
    requestAnimFrame(gameLoop);
    game.tick();
}



/**
 * Start game
 */
var game;
window.onload = function() {
    game = new Game(true);
    game.init(document.querySelector("#canvascontainer"));
};