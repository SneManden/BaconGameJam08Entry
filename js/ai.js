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
    this.positionUpdateDelay = 60*5; // 60 ticks = 1 second
    this.updatePosition = this.positionUpdateDelay;
    this.maxHealth = 25;
    this.health = this.maxHealth;

    this.target = null;
    this.targets = [];
    this.gotoPos = null;

    this.infected = true;
    this.flee = false;
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

    randomMovement: function() {
        if (this.flee) return;

        if (this.ticks % this.updatePosition == 0) {
            this.gotoPos = {
                x: this.pos.x+Math.cos(2*Math.PI*Math.random())*0.5*this.range,
                y: this.pos.y+Math.sin(2*Math.PI*Math.random())*0.5*this.range
            };
            this.updatePosition = Math.floor(Math.random()*this.positionUpdateDelay);
        }
        if (this.gotoPos !== null) {
            var xdiff = this.gotoPos.x - this.pos.x,
                ydiff = this.gotoPos.y - this.pos.y,
                dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff),
                direction = [xdiff/dist, ydiff/dist];
            this.follow(this.gotoPos, direction);
        }
    },

    normalBehaviour: function() {
        if (this.flee) {
            if (this.ticks % 60 == 0) // Update flee-to-position once a second
                this.fleeFromZombies(2*this.range);
            if (this.gotoPos)
                this.gotoPosition(this.gotoPos);
        } else
            this.checkForZombies();
    },

    animate: function() {
        if (this.zombie)
            this.zombieBehavior();
        else
            this.normalBehaviour();

        // follow target
        if (this.target)
            this.follow({x:this.target.pos.x, y:this.target.pos.y},
                this.direction(this.target));
        else
            this.randomMovement();

        this.eject();

        // Transform into a zombie
        if (this.infected && !this.zombie
         && this.ticks % 60 == 0 && Math.random() < 0.01)//0.0035)
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
            this.gotoPos = null;
            return;
        }
        this.pos.x += this.speed * direction[0];
        this.pos.y += this.speed * direction[1];
    },

    gotoPosition: function(position) {
        // If we have arrived at target, clear it
        if (Math.abs(position.x-this.pos.x)<2 && Math.abs(position.y-this.pos.y)<2) {
            this.gotoPos = null;
            return;
        }
        var xdiff = position.x - this.pos.x,
            ydiff = position.y - this.pos.y,
            dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff),
            direction = [xdiff/dist, ydiff/dist];
        this.pos.x += this.speed * direction[0];
        this.pos.y += this.speed * direction[1];
    },

    checkForZombies: function() {
        // Check if there are zombies around
        for (var i in this.game.entities) {
            var entity = this.game.entities[i];
            if (!entity || entity == this || entity.type != "enemy") continue;

            var dist = this.dist(entity);
            if (dist < this.sight && entity.zombie) {
                this.flee = true;
                return;
            }
        }
        this.flee = false;
    },

    fleeFromZombies: function(distance) {
        var zombieVector = [0, 0],
            zombies = 0;
        for (var i in this.game.entities) {
            var entity = this.game.entities[i];
            if (!entity || entity == this
             || entity.type != "enemy" || !entity.zombie) continue;

            var diff = this.diff(entity),
                dist = this.dist(entity);
            if (dist > this.sight) continue; // zombie not in sight
            if (dist == 0 || diff[0] == 0 || diff[1] == 0) continue;
            zombieVector[0] += 1/diff[0];
            zombieVector[1] += 1/diff[1];
            zombies++;
        }
        if (zombies > 0) { // We want to find the average vector
            zombieVector = [zombieVector[0]/zombies, zombieVector[1]/zombies];
            var length = Math.sqrt( zombieVector[0]*zombieVector[0]
                                  + zombieVector[1]*zombieVector[1] );
            if (length == 0)
                console.log("THIS SHOULD NOT BE ABLE TO HAPPEN!");
            this.gotoPos = {
                x: this.pos.x - (zombieVector[0]/length)*distance,
                y: this.pos.y - (zombieVector[1]/length)*distance
            };
        } else
            this.gotoPos = null;
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