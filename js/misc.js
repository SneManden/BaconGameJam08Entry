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
        // Move border
        this.game.borderHorStage.position.x = this.position.x;
        this.game.borderVerStage.position.y = this.position.y;
    }
};






var Healthbar = function(game, pos, width, height, maxHealth, health, low) {
    this.game = game;
    this.pos = (pos == undefined ? {x:0, y:0} : pos);
    this.width = (width == undefined ? 100 : width);
    this.height = (height == undefined ? 24 : height);
    this.maxHealth = maxHealth; // required
    this.health = (health == undefined ? maxHealth : health);
    this.low = (low == undefined ? maxHealth*0.1 : low);

    this.colors = {default:0x31BF24, low:0xBF2424, border:0x000000, back:0x000000};
    this.border = true;
    this.back = false;
};
Healthbar.prototype = {

    init: function() {
        this.bar = this.draw();
        this.game.cameraStage.addChild(this.bar);
        return this;
    },

    draw: function() {
        var bar = new PIXI.Graphics();
        if (this.border) {
            bar.beginFill(this.colors.border);
            bar.drawRect(this.pos.x-1,this.pos.y-1,this.width+2,this.height+2);
            bar.endFill();
        }
        if (this.back) {
            bar.beginFill(this.colors.back);
            bar.drawRect(this.pos.x,this.pos.y,this.width,this.height);
            bar.endFill();
        }
        var fillColor = (this.health <= this.low ?
            this.colors.low : this.colors.default);
        var scale = this.width*(Math.max(0, this.health)/this.maxHealth);
        bar.beginFill(fillColor);
        bar.drawRect(this.pos.x, this.pos.y, scale, this.height);
        bar.endFill();
        return bar;
    },

    setHealth: function(health) {
        // if (this.health <= 0) return;
        this.health = Math.max(0, health);
        this.game.cameraStage.removeChild(this.bar);
        this.bar = this.draw();
        this.game.cameraStage.addChild(this.bar);
    },

    animate: function() {
        return;
    },

    destroy: function() {
        this.game.cameraStage.removeChild(this.bar);
    }

};