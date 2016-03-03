var fs = require("fs");
var parser = require("./app/parser");
var dot = require("./app/dotwriter");
var spawnStream = require("spawn-stream");
var stringStream = require("string-to-stream");
var glob = require("glob");

var graphviz = function(format) {
    return spawnStream("dot", ["-T" + format]);
};
var uiflow = module.exports = {
    parser: parser,
    dot: dot,
    compile: function(d) {
        return dot.compile(parser.parse(d));
    },
    json: function(d) {
        return JSON.stringify(parser.parse(d), null, "    ");
    },
    build: function(code, format) {
        if (format == "dot") {
            return stringStream(uiflow.compile(code));
        }
        if (format == "json") {
            return stringStream(uiflow.json(code));
        }
        return uiflow.build(code, "dot").pipe(graphviz(format));
    }
};
