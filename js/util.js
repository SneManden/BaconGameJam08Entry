var Util = {

    debug: true,
    level: 0,

    log: function(message, level) {
        level = (level == undefined ? this.level : level);
        if (this.debug && level <= this.level)
            console.log(message);
    },

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     * http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
     */
    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

};



/**
 * http://stackoverflow.com/questions/321113/how-can-i-pre-set-arguments-in-javascript-function-call-partial-function-appli
 */
function partial(func /*, 0..n args */) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function() {
        var allArguments = args.concat(Array.prototype.slice.call(arguments));
        return func.apply(this, allArguments);
    };
}