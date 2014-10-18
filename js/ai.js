var Enemy = function(game, pos) {
    this.game = game;
    pos = (pos == undefined ? {x:0, y:0} : pos);
    this.pos = {x:pos.x, y:pos.y};
    this.type = "enemy";

    this.textures = [];
    this.ticks = 0;

    this.altitude = 0;

    // Variables
    this.scale = 2;
    this.zombie = false;
    this.range = 35;
    this.sight = 150;
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
        this.textures.push( PIXI.Texture.fromFrame("enemyDead") );
        // Set sprite
        this.sprite = new PIXI.Sprite(this.textures[0]);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.55;
        this.sprite.scale.x = this.scale;
        this.sprite.scale.y = this.scale;
        this.sprite.position.x = this.pos.x;
        this.sprite.position.y = this.pos.y;

        this.width = 16;
        this.height = 32;

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

            if (this.zombie) {
                // Player is in eye-sight => player is the target
                if (dist<this.sight && dist>this.range)
                    this.target = {x:player.pos.x, y:player.pos.y};
                if (dist<=this.range) // stop if inside range
                    this.target = null;
                // Attack player (half range if different altitude)
                if (dist <= this.range*(1-0.5*Math.abs(this.altitude-player.altitude)))
                    this.attack(player, direction);
            }
            if (!this.zombie || dist>this.sight) { // Random movement
                if (this.ticks % this.positionUpdateDelay == 0) {
                    this.target = {
                        x: Math.cos(Math.random()*2*Math.PI)*this.range/5,
                        y: Math.sin(Math.random()*2*Math.PI)*this.range/5 };
                    this.target = { x:this.pos.x+this.target.x,
                                    y:this.pos.y+this.target.y };
                    this.positionUpdateDelay = Math.floor(Math.random()*60*5);
                }
            }
            if (this.target) // follow target
                this.follow(this.target, (this.zombie ? direction : undefined));
        }

        this.eject();

        // Zombie mode?
        if (this.ticks % 60 == 0 && Math.random() < 0.0035)
            this.zombieMode();

        this.updateSpritePosition();
        this.ticks++;
    },

    eject: function() {
        for (var i in this.game.solids) {
            var solid = this.game.solids[i];
            var xdiff = this.pos.x - solid.pos.x,
                ydiff = this.pos.y - solid.pos.y,
                dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

            if (dist < this.range + Math.max(solid.width/2, solid.height/2))
                solid.ejectOther(this, [xdiff, ydiff]);
        }
    },

    attack: function(other, direction) {
        if (this.canAttack) {
            other.hit(this.damage);
            other.pos.x -= direction[0]*this.damage/2;
            other.pos.y -= direction[1]*this.damage/2;

            this.canAttack = false;
            var self = this;
            window.setTimeout(function() {
                self.canAttack = true;
            }, this.attackDelay);
        }
    },

    follow: function(position, direction) {
        // If we have arrived at target, clear it
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
        Util.log("One more zombie");
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
        var index = this.game.entities.indexOf(this);
        this.game.entities.splice(index, 1);
        // Set dead sprite
        this.sprite.setTexture( this.textures[2] );
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0;
        // this.sprite.position.x = this.pos.x;
        this.sprite.position.y -= this.height/8;
        this.game.world.removeChild(this.sprite);
        this.game.world.addChildAt(this.sprite, 0);
    }

};