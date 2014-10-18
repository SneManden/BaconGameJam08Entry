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
        "img/background.png"
    ];
    // this.entitiesContainer = new PIXI.DisplayObjectContainer();
    // this.solidsContainer = new PIXI.DisplayObjectContainer();
    this.backStage = new PIXI.DisplayObjectContainer();
    this.world = new PIXI.DisplayObjectContainer();
    this.camera = null;
    this.entities = [];
    this.solids = [];

    this.keysDown = {};
    Util.debug = debug;
};
Game.prototype = {

    init: function(container) {
        Util.log("Game initializing");
        this.state = this.STATES.LOAD;
        // Set stage and renderer
        this.stage = new PIXI.Stage(this.background);
        this.renderer = PIXI.autoDetectRenderer(this.width, this.height);
        // Add renderer (canvas element) to container
        container.appendChild(this.renderer.view);
        this.setupKeyboard();
        // World & camera
        this.stage.addChild(this.backStage);
        this.stage.addChild(this.world);
        this.camera = new Camera(this, this.width, this.height);
        // this.stage.addChild(this.entitiesContainer);
        // this.stage.addChild(this.solidsContainer);
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
        Util.log("down: " + e.keyIdentifier + " ("+e.keyCode+")");
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
        Util.log("press: " + e.keyIdentifier + " ("+e.keyCode+")");

        // if (self.player) // why does .prototype not work? (using .__proto__)
        //     self.player.__proto__.handleKeyPressed.call(self.player, e.keyCode);
    },

    addEntity: function(entity) {
        this.entities.push(entity);
        // this.entitiesContainer.addChild(entity.sprite);
        this.world.addChild(entity.sprite);
        Util.log("Entities: " + this.entities.length);
    },

    addSolid: function(solid) {
        this.solids.push(solid);
        // this.solidsContainer.addChild(solid.sprite);
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

    start: function() {
        Util.log("Game started");
        this.state = this.STATES.PLAY;

        var backtex = PIXI.Texture.fromImage("img/background.png");
        this.background = new PIXI.TilingSprite(backtex, this.width, this.height);
        this.background.tileScale.x = 2;
        this.background.tileScale.y = 2;
        this.backStage.addChild(this.background);

        this.player = new Player(this).init();
        this.addEntity(this.player);
    },

    animate: function() {
        for (var i in this.entities) {
            this.entities[i].animate();
        }

        // Follow player
        if (!this.player) return;
        this.camera.follow(this.player.sprite);
        this.background.tilePosition.x = this.world.position.x;
        this.background.tilePosition.y = this.world.position.y;

        // switch (this.state) {
        //     case this.STATES.LOAD: this.animateLoading(); break;
        //     case this.STATES.MENU: this.animateMenu(); break;
        //     case this.STATES.PLAY: this.animatePlay(); break;
        //     default: break;
        // }
    },

    animateLoading: function() {
        //
    },

    animateMenu: function() {
        //
    },

    animatePlay: function() {
        
    },

    tick: function() {
        this.animate();
        this.renderer.render(this.stage);
    }

};


var Camera = function(game, width, height) {
    this.game = game;
    this.width = width;
    this.height = height;
    this.position = {x:0, y:0};
};
Camera.prototype = {
    // <object> must have position attribute with .x and .y attributes
    follow: function(follower) {
        // Move camera
        this.position.x = -follower.position.x + this.width/2;
        this.position.y = -follower.position.y + this.height/2;
        // Move world (simulates viewport)
        this.game.world.position.x = this.position.x;
        this.game.world.position.y = this.position.y;
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