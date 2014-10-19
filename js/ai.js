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
    this.sight = 350;
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
    this.targets = [];

    this.infected = true;

    this.dead = false;
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

    zombieBehavior: function() {
        if (!this.zombie) return;

        for (var i in this.targets) {
            var other = this.targets[i];
            if (!other) continue;

            var diff = this.diff(other),
                dist = Math.sqrt(diff[0]*diff[0] + diff[1]*diff[1]),
                direction = [diff[0]/dist, diff[1]/dist];

            if (this.target == null && dist<this.sight)
                this.target = other;
            if (dist<=this.range*(1-0.5*Math.abs(this.altitude-other.altitude)))
                this.attack(other, direction);
        }
    },

    animate: function() {
        this.zombieBehavior();

        // follow target
        if (this.target)
            this.follow({x:this.target.pos.x, y:this.target.pos.y},
                this.direction(this.target));

        this.eject();

        if (this.infected && this.ticks % 60 == 0 && Math.random() < 0.1)//0.0035)
            this.zombieMode();

        this.updateSpritePosition();
        this.ticks++;
    },

    diff: function(other) {
        var xdiff = other.pos.x - this.pos.x,
            ydiff = other.pos.y - this.pos.y;
        return [xdiff, ydiff];
    },

    dist: function(other) {
        var diff = this.diff(other);
        return Math.sqrt(diff[0]*diff[0] + diff[1]*diff[1])
    },

    direction: function(other) {
        var diff = this.diff(other),
            dist = this.dist(other);
        return [diff[0]/dist, diff[1]/dist];
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
        if (this.dead) return;

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

        this.dead = true;
    }

};










var Vip = function(game, pos) {
    Enemy.call(this, game, pos);
    this.infected = false;
    this.flee = false;
    this.speed = 2.0;
};
Vip.prototype = new Enemy();
Vip.prototype.constructor = Vip;
Vip.prototype.init = function() {
    Enemy.prototype.init.call(this);
    this.textures[0] = PIXI.Texture.fromFrame("vipStanding0");
    this.textures[1] = PIXI.Texture.fromFrame("vipStanding1");
    this.sprite.setTexture(this.textures[0]);

    this.healthbar = new Healthbar(this.game, {x:10, y:this.game.height-15},
        this.game.width-20, 5, this.maxHealth).init();
    this.healthbar.colors.default = 0x0EBFBF;
    this.healthbar.setHealth(this.health);

    return this;
};
Vip.prototype.updateSpritePosition = function() {
    if (this.pos.y > this.sprite.position.y)
        this.sprite.setTexture(this.textures[0]);
    else
        this.sprite.setTexture(this.textures[1]);
    
    Enemy.prototype.updateSpritePosition.call(this);
};
Vip.prototype.updateHealth = function(x) {
    Enemy.prototype.updateHealth.call(this, x);
    this.healthbar.setHealth(this.health);
};
Vip.prototype.animate = function() {
    if (this.flee) { // Aaaargh, follow player
        var player = this.game.player;
        if (player)
            this.target = player;
    } else {
        // Check if there are zombies around
        for (var i in this.game.entities) {
            var entity = this.game.entities[i];
            if (!entity || entity == this || entity.type == "player")
                continue;

            var dist = Enemy.prototype.dist.call(this, entity);
            if (dist < this.sight && entity.zombie)
                this.flee = true;
        }
    }

    Enemy.prototype.animate.call(this);
};
Vip.prototype.zombieMode = function() {
    return;
};
Vip.prototype.zombieBehavior = function() {
    return;
};
Vip.prototype.die = function() {
    for (var i in this.game.entities) {
        var entity = this.game.entities[i];
        if (entity && entity.type == "enemy") {
            entity.targets.splice(entity.targets.indexOf(this), 1);
            entity.target = null;
        }
    }
    Enemy.prototype.die.call(this);
}