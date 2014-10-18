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
        "img/spritesheet.json"
    ];
    this.entities = [];
    this.entitiesContainer = new PIXI.DisplayObjectContainer();
    this.solids = [];
    this.solidsContainer = new PIXI.DisplayObjectContainer();

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
        // World
        this.world = new PIXI.DisplayObjectContainer();
        this.stage.addChild(this.entitiesContainer);
        this.stage.addChild(this.solidsContainer);
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
    },

    handleKeyPress: function(self, e) {
        Util.log("press: " + e.keyIdentifier + " ("+e.keyCode+")");
    },

    addEntity: function(entity) {
        this.entities.push(entity);
        this.entitiesContainer.addChild(entity.sprite);
        Util.log("Entities: " + this.entities.length);
    },

    addSolid: function(solid) {
        this.solids.push(solid);
        this.solidsContainer.addChild(solid.sprite);
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
    },

    animate: function() {
        for (var i in this.entities) {
            this.entities[i].animate();
        }

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