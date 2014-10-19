var Game = function(debug, debugLevel) {
    this.background = 0x66ff99;
    this.width = 800; //1024;
    this.height = 480; //576;
    this.STATES = {
        LOADING: 0,
        MENU: 1,
        PLAY: 2
    }
    this.assets = [
        "img/playersheet.json",
        "img/background.png",
        "img/grass.png",
        "img/woodtile.png",
        "img/black.png",
        "img/sceneFinal.png",
        "img/spritesheet_misc.json"
    ];
    this.sounds = [
        // When I Open My Eyes by unreal_dm featuring Admiral Bob @ dig.ccmixter
        {id:"song", src:"whenIOpenMyEyes-unreal_dmFeatAdmiralBob.mp3"},
        // DJ Death by Hans Atom featuring Kara!
        {id:"zombies", src:"DJDeath-HansAtomFeatKara.mp3"},
        {id:"lightsOut", src:"lightsOut.wav"},
        {id:"zombieBrawl0", src:"zombieBrawl1.wav"},
        {id:"zombieBrawl1", src:"zombieBrawl2.wav"},
        {id:"zombieHit0", src:"zombieHit1.wav"},
        {id:"zombieHit1", src:"zombieHit2.wav"},
        {id:"zombieMode0", src:"zombieMode1.wav"},
        {id:"zombieMode1", src:"zombieMode2.wav"},
        {id:"doorOpen", src:"doorOpen.wav"},
        {id:"swordHit", src:"swordHit1.wav"}

    ];
    this.assetsLoaded = false;
    this.soundsLoaded = false;
    this.cameraStage = new PIXI.DisplayObjectContainer();
    this.borderHorStage = new PIXI.DisplayObjectContainer();
    this.borderVerStage = new PIXI.DisplayObjectContainer();
    this.backStage = new PIXI.DisplayObjectContainer();
    this.world = new PIXI.DisplayObjectContainer();
    this.camera = null;
    this.entities = [];
    this.solids = [];

    this.keysDown = {};
    Util.debug = (debug == undefined ? false : debug);
    Util.level = (debugLevel == undefined ? 0 : debugLevel);

    this.ticks = 0;
    this.zombieMode = false;
    this.paused = false;
    this.muted = false;

    this.scenes = [
        {
            name: "house",
            border: {left: 0, right: 1200, top: 0, bottom: 1600},
            background: {img: this.assets[3], tileScale: 2},
            playerPosition: {x: 550, y: 8},
            vipPosition: {x: 600, y: 1516},
            buttonPosition: {x: 600, y:800},
            scenery: [
                {
                    name: "performancestage",
                    position: {x: 584, y:1488},
                    width: 768, height: 128,
                    background: {img: this.assets[5], scale: 4}
                },
                {
                    name: "stairL", position: {x: 168, y: 1536},
                    width: 64, height: 64,
                    background: {img:this.assets[6], frame:"stairL", scale:4},
                    anchor: {x: 0.5, y: 0.0}
                },
                {
                    name: "stairR", position: {x: 1000, y: 1536},
                    width: 64, height: 64,
                    background: {img:this.assets[6], frame:"stairR", scale:4},
                    anchor: {x: 0.5, y: 0.0}
                }
            ],
            solids: [
                // Stage borders
                {   position: {x: 584, y:1500}, width:  768, height:    8, altitude: 0 },
                {   position: {x: 200, y:1514}, width:    8, height:   36, altitude: 0 },
                {   position: {x: 968, y:1514}, width:    8, height:   36, altitude: 0 },
                {   position: {x: 184, y:1536}, width:   40, height:    8, altitude: 0 },
                {   position: {x: 984, y:1536}, width:   40, height:    8, altitude: 0 },

                {   position: {x: 584, y:1476}, width:  768, height:    8, altitude: 1 },
                {   position: {x: 200, y:1500}, width:    8, height:   64, altitude: 1 },
                {   position: {x: 968, y:1500}, width:    8, height:   64, altitude: 1 },
                // Border solids
                {   position: {x: -16, y: 800}, width:   32, height: 1600 }, // left
                {   position: {x:1216, y: 800}, width:   32, height: 1600 }, // right
                {   position: {x: 600, y: -16-16}, width: 1200, height:   32 }, // top
                {   position: {x: 600, y:1616}, width: 1200, height:   32 }  // bottom
            ],
            altControls: [
                {   position: {x:184, y:1566}, width: 32, height: 68, altitude: 0},
                {   position: {x:216, y:1566}, width: 32, height: 68, altitude: 1},
                {   position: {x:952, y:1566}, width: 32, height: 68, altitude: 1},
                {   position: {x:984, y:1566}, width: 32, height: 68, altitude: 0},
            ]

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
        // Loadingbar
        this.setupLoadingBar();
        // Loading
        this.loadedAssets = 0;
        this.loader = new PIXI.AssetLoader(this.assets);
        this.loader.onComplete = partial(this.onAssetsLoaded, this);
        this.loader.onProgress = partial(this.assetLoaded, this);
        this.loader.load();
        // Sounds
        if (!createjs.Sound.initializeDefaultPlugins())
            Util.log("Error: Cannot initialize sound");
        else {
            this.loadedSounds = 0;
            createjs.Sound.addEventListener("fileload", partial(this.soundLoaded, this));
            createjs.Sound.registerManifest(this.sounds, "/snd/");
        }
        setTimeout(gameLoop, 0);
    },

    setupLoadingBar: function() {
        this.loadingBar = new Healthbar(this, {x:this.width/4, y:this.height/2-this.height/10}, this.width/2,
            this.height/10, this.assets.length+this.sounds.length, 0);
        this.loadingBar.back = true;
        this.loadingBar.colors = {default: 0xffffff, border: this.background,
            low: 0xffffff, back: 0x000000};
        this.loadingBar.init();
    },

    onAssetsLoaded: function(self) {
        Util.log("Assets loaded!");
        self.assetsLoaded = true;
        Game.prototype.completelyLoaded.call(self);
    },

    assetLoaded: function(self) {
        self.loadingBar.setHealth(self.loadingBar.health+1);
        self.loadedAssets++;
    },

    soundLoaded: function(self, event) {
        self.loadingBar.setHealth(self.loadingBar.health+1);
        if (++self.loadedSounds == self.sounds.length) {
            self.soundsLoaded = true;
            Game.prototype.completelyLoaded.call(self);
        }
    },

    completelyLoaded: function() {
        Util.log("sounds: ", this.assetsLoaded,
               "|", "assets: ", this.soundsLoaded);
        if (this.soundsLoaded && this.assetsLoaded) {
            this.loadingBar.destroy();
            this.setupMenu();
            // this.start();
        }
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

        var states = self.STATES;
        if (self.state == states.PLAY) {
            if (e.keyCode == 27) // esc
                self.pause();
            if (e.keyCode == 77) // M
                self.mute();
        } else if (self.state == states.MENU) {
            if ([13].indexOf(e.keyCode) > -1) // Enter or Space
                self.start();
            if (e.keyCode == 77) // M
                self.mute();
        } else if ([states.WIN, states.GAMEOVER].indexOf(self.state) > -1) {
            if ([13].indexOf(e.keyCode) > -1) // Enter or Space
                self.setupMenu();
        }
    },

    handleKeyPress: function(self, e) {
        Util.log("press: " + e.keyIdentifier + " ("+e.keyCode+")", 1);
    },

    addEntity: function(entity) {
        this.entities.push(entity);
        this.world.addChild(entity.sprite);
        // Util.log("Entities: " + this.entities.length);
    },

    addSolid: function(solid) {
        this.solids.push(solid);
        // this.world.addChild(solid.sprite);
        // Util.log("Solids: " + this.solids.length);
    },

    setupMenu: function() {
        this.state = this.STATES.MENU;

        this.clearAll();

        this.stage.setBackgroundColor(0x77D448);

        var menuSprites = [
            { position: {x:2*this.width/6, y:3*this.height/5}, frame:"vipStanding0"},
            { position: {x:3*this.width/6, y:3*this.height/5}, frame:"playerStanding1"},
            { position: {x:4*this.width/6, y:3*this.height/5+12}, frame:"enemyStandingZombie"},
        ];
        var scale = {x:4.0,y:4.0}, anchor = {x:0.5,y:0.5};
        for (var i in menuSprites) {
            var sprite = new PIXI.Sprite.fromFrame(menuSprites[i].frame);
            sprite.scale = scale;
            sprite.anchor = anchor;
            sprite.position = menuSprites[i].position;
            this.cameraStage.addChild(sprite);
        }

        // TITLE
        var title = new PIXI.Text("Save Otto Griffis", {font:"bold 40px monospace",
            fill:"white", stroke:"black", strokeThickness:4});
        title.anchor = {x:0.5, y:0.5};
        title.position = {x: this.width/2, y:this.height/8};
        this.cameraStage.addChild(title);
        // INSTRUCTIONS
        var instructions = new PIXI.Text(
            "Save singer and performer Otto Griffis\n" +
            "by escorting him safely to the door.\n" +
            "Do not let any harm be done to the ladies.",
            {font:"20px monospace", fill:"white",
            stroke:"black",strokeThickness:2,align:"left"});
        instructions.anchor = {x:0.5, y:0.0};
        instructions.position = {x:this.width/2, y:2*this.height/8};
        this.cameraStage.addChild(instructions);
        // CONTROLS
        var space = "        ";
        var controls = new PIXI.Text(
            "Movement:       <WASD> " + space + "Pause:      <Esc>\n" +
            "Run:            <Shift>" + space + "Mute:       <M>\n" +
            "Combat, action: <Space>" + space + "START GAME: <Enter>",
            {font:"14px monospace", fill:"white",
            stroke:"black",strokeThickness:2,align:"left"});
        controls.anchor = {x:0.5, y:1.0};
        controls.position = {x: this.width/2, y:15*this.height/16};
        this.cameraStage.addChild(controls);
    },

    pause: function() {
        this.paused = !this.paused;
        createjs.Sound.setMute(this.paused || this.muted);
    },

    mute: function() {
        this.muted = !this.muted;
        createjs.Sound.setMute(this.muted);
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

        // Scenery
        var scenery = scene.scenery[0];
        var scenerySprite = new PIXI.Sprite.fromImage(scenery.background.img);
        scenerySprite.anchor.x = 0.5;
        scenerySprite.anchor.y = 0.125;
        scenerySprite.position.x = scenery.position.x;
        scenerySprite.position.y = scenery.position.y;
        scenerySprite.scale.x = scenery.background.scale;
        scenerySprite.scale.y = scenery.background.scale;
        this.world.addChild(scenerySprite);

        var scenery = scene.scenery;
        for (var i=1; i<scenery.length; i++) {
            var spr = scenery[i];
            var sprite = new PIXI.Sprite.fromFrame(spr.background.frame);
            sprite.anchor.x = spr.anchor.x;
            sprite.anchor.y = spr.anchor.y;
            sprite.position = spr.position;
            sprite.scale.x = sprite.scale.y = spr.background.scale;
            this.world.addChild(sprite);
        }

        var wallTexture = PIXI.Texture.fromFrame("wallpaper");
        for (var i=0; i<(scene.border.right-scene.border.left)/(16*2); i++) {
            if (i>17 && i<21) {
                if (!this.door) {
                    this.door = new Door(this, {x:(i*16+24)*2, y:-24*2}).init();
                    this.addEntity(this.door);
                }
                continue;
            }
            var sprite = new PIXI.Sprite(wallTexture);
            var scale = 2;
            sprite.anchor.x = 0.0;
            sprite.anchor.y = 0.0;
            sprite.position.x = i*sprite.width*scale;
            sprite.position.y = -sprite.height*scale;
            sprite.scale.x = scale;
            sprite.scale.y = scale;
            this.world.addChild(sprite);
        }
        sprite.width = 16; // Adjust last sprite so as to fit scene

        // Solids
        var solids = scene.solids;
        for (var i=0; i<solids.length; i++) {
            var solid = solids[i],
                obst = new Solid(this, solid.position,solid.width,solid.height);
            if (solid.altitude !== undefined)
                obst.altitude = solid.altitude;
            // obst.setSprite();
            this.addSolid(obst);
        }
        // Misc objects
        var altControls = scene.altControls;
        for (var i=0; i<altControls.length; i++) {
            var obj = altControls[i],
                obst = new AltitudeControl(this, obj.position, obj.width,
                    obj.height, obj.altitude);
            // obst.setSprite();
            this.addSolid(obst);
        }

        // Enemies
        var numEnemies = 75;//50;//500;
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

        // Player
        this.player = new Player(this, scene.playerPosition).init();
        this.player.altitude = 1;
        this.addEntity(this.player);

        // Very Important Person
        this.vip = new Vip(this, scene.vipPosition).init();
        this.vip.altitude = 1;
        this.addEntity(this.vip);

        // Zombie button
        this.button = new Button(this, scene.buttonPosition).init();
        this.addEntity(this.button);

        // Set targets for enemies
        for (var i in this.entities) {
            if (this.entities[i].type == "enemy")
                this.entities[i].targets = [this.player, this.vip];
        }

        // Start playback
        this.song = createjs.Sound.play("song", {loop:-1, volume:0.5});
    },

    start: function() {
        // Clear camera
        this.clearAll();

        Util.log("Game started");
        this.state = this.STATES.PLAY;

        this.setScene();
        this.saved = [];
    },

    animatePlay: function() {
        for (var i in this.entities) {
            if (this.entities[i] !== null)
                this.entities[i].animate();
        }

        // Follow player
        if (!this.player) return;
        this.camera.follow(this.player.sprite);
        // Set tiling background
        var scale = this.scenes[this.scene].background.tileScale;
        this.background.tilePosition.x = this.world.position.x/scale;
        this.background.tilePosition.y = this.world.position.y/scale;
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

        // if (!this.zombieMode && this.ticks >= 60*15)//60*60)
        //     this.startZombieMode();

        // Test win
        if (this.saved.indexOf(this.vip) != -1)
            this.win();

        this.ticks++;
    },

    startZombieMode: function() {
        Util.log("ZOMBIE MODE!");
        this.zombieMode = true;
        for (var i in this.entities) {
            var entity = this.entities[i];
            if (entity.type == "enemy")
                entity.infected = true;
            else if (entity.type == "vip" || entity.type == "player")
                entity.createHealthbar();
        }
        createjs.Sound.stop();
        var lightsOut = createjs.Sound.play("lightsOut", {loop:0, volume:1});
        lightsOut.addEventListener("complete", function() {
            createjs.Sound.play("zombies", {loop:-1, volume:0.5});
        });
    },

    win: function() {
        this.state = this.STATES.WIN;

        Util.log("YOU LOSE, daaaaarn!");
        createjs.Sound.stop();
        
        this.clearAll();

        this.stage.setBackgroundColor(0x15ED15);

        // You win
        var wintext = new PIXI.Text("Congratulations!\nYou saved the day.",
            {font:"bold 40px monospace",
            fill:"white", stroke:"black", strokeThickness:5, align:"center"});
        wintext.anchor = {x:0.5, y:1.0};
        wintext.position = {x: this.width/2, y:this.height/2};
        this.cameraStage.addChild(wintext);
        // Restart
        var restart = new PIXI.Text("Press <Enter> to try again",
            {font:"bold 20px monospace",
            fill:"white", stroke:"black", strokeThickness:3});
        restart.anchor = {x:0.5, y:0.5};
        restart.position = {x: this.width/2, y:3*this.height/4};
        this.cameraStage.addChild(restart);
    },

    gameover: function() {
        this.state = this.STATES.GAMEOVER;

        Util.log("YOU LOSE, daaaaarn!");
        createjs.Sound.stop();
        
        this.clearAll();

        this.stage.setBackgroundColor(0x8C0303);

        // Game over
        var gameover = new PIXI.Text("GAME OVER", {font:"bold 64px monospace",
            fill:"white", stroke:"black", strokeThickness:5});
        gameover.anchor = {x:0.5, y:1.0};
        gameover.position = {x: this.width/2, y:this.height/2};
        this.cameraStage.addChild(gameover);
        // Restart
        var restart = new PIXI.Text("Press <Enter> to try again",
            {font:"bold 20px monospace",
            fill:"white", stroke:"black", strokeThickness:3});
        restart.anchor = {x:0.5, y:0.5};
        restart.position = {x: this.width/2, y:3*this.height/4};
        this.cameraStage.addChild(restart);
    },

    clearAll: function() {
        this.player = this.vip = this.button = this.door = null;
        this.zombieMode = false;
        this.ticks = 0;
        this.entities = [];
        this.solids = [];

        this.clearStage(this.backStage);
        this.clearStage(this.borderHorStage);
        this.clearStage(this.borderVerStage);
        this.clearStage(this.world);
        this.clearStage(this.cameraStage);
    },

    clearStage: function(stage) {
        while (stage.children.length > 0)
            stage.removeChild(stage.getChildAt(0));
    },

    update: function() {
        switch (this.state) {
            case this.STATES.PLAY: this.animatePlay(); break;
            case this.STATES.MENU: this.animateMenu(); break;
            case this.STATES.LOADING: this.animateLoading(); break;
            default: return;
        }
        // if (this.paused)
        //     ;// Do something
    },

    animateLoading: function() {
        return;
    },

    animateMenu: function() {
        //
    },

    tick: function() {
        if (this.paused) return;

        this.update();
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
    game = new Game(true, 0);
    game.init(document.querySelector("#canvascontainer"));
};