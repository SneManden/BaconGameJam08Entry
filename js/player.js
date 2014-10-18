var Player = function(game, pos) {
    this.game = game;
    pos = (pos == undefined ? {x:0, y:0} : pos);
    this.pos = {x:pos.x, y:pos.y};

    this.textures = [];

    this.ticks = 0;
    this.walkTicks = 0;

    // Attributes
    this.walkSpeed = 2;
    this.slashDelay = 50;
    this.slashTint = 0x6e0000;
    this.defaultTint = 0xffffff;
    // Helper variables
    this.canSlash = true;
};
Player.prototype = {

    // Setup sprite
    init: function() {
        // Load textures from frames
        this.textures.push( PIXI.Texture.fromFrame("playerStanding") );
        for (var i=1; i<=2; i++)
            this.textures.push( PIXI.Texture.fromFrame("playerWalking0"+i) );
        this.textures.push( PIXI.Texture.fromFrame("playerSlash") );
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

        return this;
    },

    updatePosition: function(x,y) {
        this.sprite.position.x += x;
        this.sprite.position.y += y;
    },

    // Called every frame
    animate: function() {
        var oldWalkTick = this.walkTicks;

        var position = this.handleMovement(); // New position

        // Update position
        this.updatePosition(position[0]*this.walkSpeed,
                            position[1]*this.walkSpeed);
        // Set animation frame
        if (oldWalkTick != this.walkTicks && this.canSlash) {
            var frame = Math.floor(this.walkTicks/15) % 2 + 1;
            this.sprite.setTexture( this.textures[frame] );
        }

        this.ticks++;
    },

    handleKeyUp: function(keyId) {
        // Set standing sprite
        if ([65, 87, 68, 83].indexOf(keyId) != -1)
            this.sprite.setTexture( this.textures[0] );
    },

    handleKeyPressed: function(keyId) {
        // Attack
        if (keyId == 32 && this.canSlash) {
            this.sprite.setTexture( this.textures[3] );
            this.sprite.tint = this.slashTint;
            this.canSlash = false;
            var self = this;
            window.setTimeout(function() {
                self.sprite.setTexture( self.textures[0] );
                self.sprite.tint = self.defaultTint;
                self.canSlash = true;
            }, this.slashDelay);
        }
    },

    handleMovement: function() {
        var position = [0,0];
        if (this.game.keysDown[65]) // left (A)
            position[0] -= 1;
        if (this.game.keysDown[87]) // up (W)
            position[1] -= 1;
        if (this.game.keysDown[68]) // right (D)
            position[0] += 1;
        if (this.game.keysDown[83]) // down (S)
            position[1] += 1;
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

};