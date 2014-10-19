var Door = function(game, pos) {
    this.game = game;
    this.pos = (pos == undefined ? {x:0, y:0} : pos);
    this.closed = true;
    this.scale = 2.0;
    this.range = 75;
};
Door.prototype = {

    init: function() {
        this.textures = {
            closed: PIXI.Texture.fromFrame("doorClosed"),
            opened: PIXI.Texture.fromFrame("doorOpened")
        };
        // Set sprite
        this.sprite = new PIXI.Sprite(this.textures.closed);
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.sprite.scale.x = this.scale;
        this.sprite.scale.y = this.scale;
        this.sprite.position.x = this.pos.x;
        this.sprite.position.y = this.pos.y;

        return this;
    },

    animate: function() {
        var player = this.game.player,
            dist;
        if (player) dist = this.dist(player);

        // Open door (space)
        if (this.game.keysDown[32])
            if (dist < this.range) this.open();

        // Enter?
        for (var i in this.game.entities) {
            var entity = this.game.entities[i];
            if (!entity || entity == this) continue;

            if (!this.closed && this.dist(entity)<this.range)
                this.enter(entity);
        }
    },

    open: function() {
        if (!this.closed) return;

        this.closed = false;
        this.sprite.setTexture(this.textures.opened);

        createjs.Sound.play("doorOpen", {volume:0.8});
    },

    dist: function(other) {
        var xdiff = this.pos.x - other.pos.x,
            ydiff = this.pos.y - other.pos.y,
            dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
        return dist;
    },

    enter: function(other) {
        this.game.saved.push(other);
        // console.log(other.type + " entered the door.");
    }

};