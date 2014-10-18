var Player = function(game, pos) {
    this.game = game;
    pos = (pos == undefined ? {x:0, y:0} : pos);
    this.pos = {x:pos.x, y:pos.y};
    this.type = "player";
    this.index = null;

    this.textures = [];

    this.ticks = 0;
    this.walkTicks = 0;

    // Attributes
    this.walkSpeed = 2;
    this.slashDelay = 50;
    this.tints = {default:0xffffff, slash:0x6e0000};
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.range = 50;
    this.damage = 10;
    // Helper variables
    this.canSlash = true;
    this.direction = 0;
};
Player.prototype = {

    // Setup sprite
    init: function() {
        // Load textures from frames
        for (var j=0; j<2; j++) { // j: 4 directional sprites
            this.textures.push( PIXI.Texture.fromFrame("playerStanding"+j) );
            for (var i=1; i<=2; i++) // i: 2 walking animation frames 
                this.textures.push(PIXI.Texture.fromFrame("playerWalking"+j+""+i));
            this.textures.push( PIXI.Texture.fromFrame("playerSlash"+j) );
        }
        // Set sprite
        this.sprite = new PIXI.Sprite(this.textures[0]);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.sprite.scale.x = 2;
        this.sprite.scale.y = 2;
        this.sprite.position.x = this.pos.x;
        this.sprite.position.y = this.pos.y;

        this.width = this.sprite.width;
        this.height = this.sprite.height;

        // Healthbar
        this.healthbar = new Healthbar(this.game, {x:10, y:10}, this.game.width-20, 5,
            this.maxHealth).init();

        return this;
    },

    updateSpritePosition: function(x,y) {
        this.sprite.position.x = this.pos.x;
        this.sprite.position.y = this.pos.y;
    },

    // Called every frame
    animate: function() {
        var oldWalkTick = this.walkTicks;
        // Update position
        var position = this.handleMovement(); // New position
        this.pos.x += position[0]*this.walkSpeed,
        this.pos.y += position[1]*this.walkSpeed;

        // Set animation frame
        if (oldWalkTick != this.walkTicks && this.canSlash) {
            var frame = Math.floor(this.walkTicks/15) % 2 + 1;
            this.sprite.setTexture( this.textures[4*this.direction + frame] );
        }

        this.updateSpritePosition();
        this.ticks++;
    },

    handleKeyUp: function(keyId) {
        // Set standing sprite
        if ([65, 87, 68, 83].indexOf(keyId) != -1)
            this.sprite.setTexture( this.textures[4*this.direction + 0] );
    },

    handleKeyPressed: function(keyId) {
        // Attack
        if (keyId == 32 && this.canSlash) {
            this.sprite.setTexture( this.textures[4*this.direction + 3] );
            // this.sprite.tint = this.tints.slash;
            this.canSlash = false;
            // Affect others
            for (var i=0; i<this.game.entities.length; i++) {
                var other = this.game.entities[i];
                if (other === null || other == this) continue;
                var xdiff = this.pos.x - other.pos.x,
                    ydiff = this.pos.y - other.pos.y,
                    dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

                if (dist <= this.range) {
                    other.hit(this.damage);
                    other.pos.x -= xdiff/dist*this.damage/2;
                    other.pos.y -= ydiff/dist*this.damage/2;
                }
            }
            var self = this;
            window.setTimeout(function() {
                self.sprite.setTexture( self.textures[4*self.direction + 0] );
                // self.sprite.tint = self.tints.default;
                self.canSlash = true;
            }, this.slashDelay);
        }
    },

    handleMovement: function() {
        // Alter order of these if-statements 
        var position = [0,0];
        if (this.game.keysDown[65]) { // left (A)
            position[0] -= 1; //this.direction = 2;
        }
        if (this.game.keysDown[87]) { // up (W)
            position[1] -= 1; this.direction = 0;
        }
        if (this.game.keysDown[68]) { // right (D)
            position[0] += 1; //this.direction = 3;
        }
        if (this.game.keysDown[83]) { // down (S)
            position[1] += 1; this.direction = 1;
        }
        /* Decrease position vector in diagonal direction */
        var sign = [position[0]/Math.abs(position[0]),
                    position[1]/Math.abs(position[1])];
        /* Solve side length in triangle: 2x² = 1 <=> x=sqrt(1/2)=0.7071... */
        if (Math.abs(position[0])>0 && Math.abs(position[1])>0)
            position = [sign[0]*0.7071067811865476, sign[1]*0.7071067811865476];
        // Animate if walking
        if (position[0] != 0 || position[1] != 0)
            this.walkTicks++;

        return position;
    },

    updateHealth: function(x) {
        this.health += x;
        this.healthbar.setHealth(this.health);
        if (this.health <= 0)
            this.die();
    },

    hit: function(damage) {
        this.updateHealth(-damage);

        this.sprite.blendMode = PIXI.blendModes.ADD;
        this.sprite.tint = this.tints.default;
        var self = this;
        setTimeout(function() {
            self.sprite.blendMode = PIXI.blendModes.NORMAL;
        }, 30);
    },

    die: function() {
        Util.log("Aaaarrrgh, I have failed. (Player dies horribly.)");
        var index = this.game.entities.indexOf(this);
        this.game.world.removeChild(this.sprite);
        this.game.entities.splice(index, 1);
        this.game.player = null;
    }

};