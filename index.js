var fs = require("fs");
var parser = require("./app/parser");
var dot = require("./app/dotwriter");
var spawnStream = require("spawn-stream");
var stringStream = require("string-to-stream");
var streamFromPromise = require("stream-from-promise");
var through2 = require("through2");
/*
 plugin : function(fileName,format) -> stream

 png := slurp | parse | dot | graphviz(png)

*/
var uiflow = module.exports = {};
var slurp = function() {
    return through2.obj(function(chunk, enc, callback) {
        var that = this;
        var fileName = String(chunk);
        fs.readFile(fileName, function(err, content) {
            if (err) {
                return callback(err);
            }
            that.push({
                fileName: fileName,
                content: content
            });
            callback();
        });
    });
};

var parse = function() {
    return through2.obj(function(chunk, enc, callback) {
        var output = parser.parse(String(chunk.content), chunk.fileName);
        this.push(output);
        callback();
    });
};
var complete = function() {
    return through2.obj(function(parsed, enc, callback) {
        var sections = [];
        Object.keys(parsed).forEach(function(key) {
            var elm = parsed[key];
            (elm.actions || []).forEach(function(a) {
                if (a.direction && !parsed[a.direction]) {
                    sections.push(a.direction);
                }
            });
        });
        var output = sections.map(function(s) {
            return "[" + s + "]";
        }).join("\n\n");
        this.push(output);
        callback();
    });

};

var compile = function() {
    return through2.obj(function(chunk, enc, callback) {
        var output = dot.compile(chunk);
        this.push(output);
        callback();
    });
};
var jsonize = function() {
    return through2.obj(function(chunk, enc, callback) {
        var output = JSON.stringify(chunk, null, "  ");
        this.push(output);
        callback();
    });
};




var graphviz = function(format) {
    return function() {
        return spawnStream("dot", ["-T" + format]);
    };
};


var FORMAT_TO_PIPELINE = uiflow.FORMAT_TO_PIPELINE = {
    dot: [slurp, parse, compile],
    meta: [slurp, parse, jsonize],
    json: [slurp, parse, jsonize],
    png: [slurp, parse, compile, graphviz("png")],
    svg: [slurp, parse, compile, graphviz("svg")],
    complete: [slurp, parse, complete],
    sketch: function() {},
};

uiflow.parser = parser;
uiflow.dotwriter = dot;
uiflow.compile = function() {
    return dot.compile(parser.parse(d));
};

uiflow.build = function(fileName, format, handleError) {
    var pipes = FORMAT_TO_PIPELINE[format];
    var stream = stringStream(fileName);
    if (!pipes) {
        throw new Error("undefined format");
    }
    var ret = pipes.reduce(function(acc, n) {
        var next = n();
        if (handleError) next.on("error", handleError);
        return acc.pipe(next);
    }, stream);
    return ret;
};
