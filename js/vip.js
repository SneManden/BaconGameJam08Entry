var Vip = function(game, pos) {
    Enemy.call(this, game, pos);
    this.infected = false;
    this.flee = false;
    this.speed = 2.0;
    this.type = "vip";
};
Vip.prototype = new Enemy();
Vip.prototype.constructor = Vip;
Vip.prototype.init = function() {
    Enemy.prototype.init.call(this);
    this.textures[0] = PIXI.Texture.fromFrame("vipStanding0");
    this.textures[1] = PIXI.Texture.fromFrame("vipStanding1");
    this.textures[2] = PIXI.Texture.fromFrame("vipDead");
    this.sprite.setTexture(this.textures[0]);

    return this;
};
Vip.prototype.createHealthbar = function() {
    this.healthbar = new Healthbar(this.game, {x:10, y:this.game.height-15},
        this.game.width-20, 5, this.maxHealth).init();
    this.healthbar.colors.default = 0x0EBFBF;
    this.healthbar.setHealth(this.health);
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
Vip.prototype.normalBehaviour = function() {
    if (this.flee) { // Aaaargh, follow player
        var player = this.game.player;
        if (!player || player == null) return;

        if (this.dist(player) > this.range)
            this.target = player;
        else {
            this.target = null;
            if (this.ticks % 20 == 0)
                Enemy.prototype.fleeFromZombies.call(this,
                    Math.max(0, this.range-this.dist(player)-1) );
            if (this.gotoPos)
                Enemy.prototype.gotoPosition.call(this, this.gotoPos);
        }
        // Head for the door!
        var door = this.game.door;
        if (door && this.dist(this.game.door) < this.range*4)
            this.target = door;
    } else // Check for zombies
        this.checkForZombies();
};
Vip.prototype.checkForZombies = function() {
    var flee = this.flee;
    Enemy.prototype.checkForZombies.call(this);
    this.flee = flee || this.flee; // Should never go out of "flee"-mode
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
    this.game.vip = null;
};