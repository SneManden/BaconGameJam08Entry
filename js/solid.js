var Solid = function(game, pos, width, height) {
    this.game = game;
    this.pos = (pos == undefined ? {x:0, y:0} : pos);
    this.width = (width == undefined ? 32 : width);
    this.height = (height == undefined ? 32 : height);
    this.type = "solid";

    this.altitude = -1;
};
Solid.prototype = {

    setSprite: function() {
        var sprite = PIXI.Sprite.fromFrame("img/background.png");
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = this.pos.x;
        sprite.position.y = this.pos.y;
        sprite.width = this.width;
        sprite.height = this.height;
        sprite.alpha = 0.4;
        game.world.addChild(sprite);
    },

    ejectOther: function(other, diff) {
        this.push(other, diff);
    },

    push: function(other, diff) {
        if (this.altitude > -1 && this.altitude != other.altitude) return;

        var ow = [other.pos.x-other.width /2, other.pos.x+other.width /2],
            oh = [other.pos.y-other.height/2, other.pos.y+other.height/2],
            tw = [ this.pos.x- this.width /2,  this.pos.x+ this.width /2],
            th = [ this.pos.y- this.height/2,  this.pos.y+ this.height/2];
        var hor = 0, ver = 0;

        // console.log(ow, oh, tw, th);

        // HORIZONTAL
        if (this.pos.x < other.pos.x) {
            hor = tw[1] - ow[0];
            if (hor<0) hor = 0;
        } else {
            hor = tw[0] - ow[1];
            if (hor>0) hor = 0;
        }

        // VERTICAL
        if (this.pos.y < other.pos.y) {
            ver = th[1] - oh[0];
            if (ver<0) ver = 0;
        } else {
            ver = th[0] - oh[1];
            if (ver>0) ver = 0;
        }

        if (Math.abs(hor) < Math.abs(ver)) {
            other.pos.x += hor;
            // if (hor != 0 && hor/Math.abs(hor) != other.velocity[0]/Math.abs(other.velocity[0]))
            //     other.velocity[0] = 0;
        } else {
            other.pos.y += ver;
            // if (ver != 0 && ver/Math.abs(ver) != other.velocity[1]/Math.abs(other.velocity[1]))
            //     other.velocity[1] = 0;
        }
    }

};







var AltitudeControl = function(game, pos, width, height, altitude) {
    Solid.call(this, game, pos, width, height);
    this.altitude = altitude;
};
AltitudeControl.prototype = new Solid();
AltitudeControl.prototype.constructor = AltitudeControl;

// var AltitudeControl = function(pos, width, height, altitude) {
//     // Solid.call(this, pos, width, height);
//     this.altitude = altitude;
// };
// AltitudeControl.prototype = new Solid();
// AltitudeControl.prototype.constructor = AltitudeControl;
AltitudeControl.prototype.ejectOther = function(other, diff) {
    if (Math.abs(diff[0]) < other.width/2 + this.width/2
     && Math.abs(diff[1]) < other.height/2 + this.height/2) {
        other.altitude = this.altitude;
    }
};