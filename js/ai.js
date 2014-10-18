var Enemy = function(game, pos) {
    this.game = game;
    pos = (pos == undefined ? {x:0, y:0} : pos);
    this.pos = {x:pos.x, y:pos.y};
    this.type = "enemy";
    this.index = null;

    this.textures = [];
    this.ticks = 0;

    // Variables
    this.scale = 2;
    this.zombie = false;
    this.range = 35;
    this.sight = 250;
    this.radius = this.scale * 15;
    this.speeds = {normal:1.0, zombie:1.5};
    this.speed = this.speeds.normal;
    this.damage = 5;
    this.attackDelay = 500;
    this.canAttack = true;
    this.positionUpdateDelay = 60; // 60 ticks = 1 second
    this.maxHealth = 25;
    this.health = this.maxHealth;

    this.target = null;
};
Enemy.prototype = {

    init: function() {
        this.textures.push( PIXI.Texture.fromFrame("enemyStandingNormal") );
        this.textures.push( PIXI.Texture.fromFrame("enemyStandingZombie") );
        // Set sprite
        this.sprite = new PIXI.Sprite(this.textures[0]);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.sprite.scale.x = this.scale;
        this.sprite.scale.y = this.scale;
        this.sprite.position.x = this.pos.x;
        this.sprite.position.y = this.pos.y;

        this.width = this.sprite.width;
        this.height = this.sprite.height;

        return this;
    },

    updateSpritePosition: function() {
        this.sprite.position.x = this.pos.x;
        this.sprite.position.y = this.pos.y;
    },

    animate: function() {
        var player = this.game.player;
        if (player) {
            var xdiff = player.pos.x - this.pos.x,
                ydiff = player.pos.y - this.pos.y,
                dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff),
                direction = [xdiff/dist, ydiff/dist]; // unit vector

            if (this.zombie && dist <= this.range) // Attack player
                this.attack(player, direction);

            // Follow player
            if (this.zombie && dist<this.sight && dist>this.range)
                this.target = {x:player.pos.x, y:player.pos.y};
            if (this.zombie && dist<=this.range)
                this.target = null;
            if (!this.zombie || dist>this.sight) { // Random movement
                if (this.ticks % this.positionUpdateDelay == 0) {
                    this.target = {
                        x: Math.cos(Math.random()*2*Math.PI)*this.range,
                        y: Math.sin(Math.random()*2*Math.PI)*this.range };
                    this.target = { x:this.pos.x+this.target.x,
                                    y:this.pos.y+this.target.y };
                    this.positionUpdateDelay = Math.floor(Math.random()*60*5);
                }
                // if (this.target == null)
                //     this.target = {x:this.pos.x, y:this.pos.y};
            }
            if (this.target)
                this.follow(this.target, (this.zombie ? direction : undefined));
        }

        // Zombie mode?
        if (Math.random() < 0.00005) this.zombieMode();

        this.updateSpritePosition();
        this.ticks++;
    },

    attack: function(other, direction) {
        if (this.canAttack) {
            other.hit(this.damage);
            this.canAttack = false;
            var self = this;
            window.setTimeout(function() {
                self.canAttack = true;
            }, this.attackDelay);
        }
    },

    follow: function(position, direction) {
        if (Math.abs(position.x-this.pos.x)<2 && Math.abs(position.y-this.pos.y)<2) {
            this.target = null;
            return;
        }
        if (direction == undefined) {
            var xdiff = position.x - this.pos.x,
                ydiff = position.y - this.pos.y,
                dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff),
                direction = [xdiff/dist, ydiff/dist];
        }
        this.pos.x += this.speed * direction[0];
        this.pos.y += this.speed * direction[1];
    },

    zombieMode: function() {
        this.zombie = true;
        this.sprite.setTexture( this.textures[1] );
        this.speed = this.speeds.zombie;
    },

    normalMode: function() {
        this.zombie = false;
        this.sprite.setTexture( this.textures[0] );
        this.speed = this.speeds.normal;
    },

    updateHealth: function(x) {
        this.health += x;
        if (this.health <= 0)
            this.die();
    },

    hit: function(damage) {
        this.updateHealth(-damage);

        this.sprite.blendMode = PIXI.blendModes.ADD;
        this.sprite.tint = 0xffffff;
        var self = this;
        setTimeout(function() {
            self.sprite.blendMode = PIXI.blendModes.NORMAL;
        }, 30);
    },

    die: function() {
        if (this.index === null) Util.log("Could not destroy entity");
        this.game.entities[this.index] = null;
        this.game.world.removeChild(this.sprite);
    }

};