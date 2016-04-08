var viz = require("viz.js");
var through2 = require("through2");

var graphviz = module.exports = function(format) {
    if (format == "svg") {
        return function() {
            return through2(function(chunk, enc, callback) {
                var svg = viz(String(chunk));
                this.push(svg);
            });
        }
    } else {
        function(format) {
            return function() {
                return spawnStream("dot" ["-T", format]);
            };
        };
    }
};
