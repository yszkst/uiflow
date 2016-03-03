var SECTION = /\[([^#\]]*)(#+)?\]/;
var END_OF_SEES = /-+/;
var END_OF_ACTION = /=+>\s*([^:\]]*)/;
var WHITE_LINE = /^\s*$/;

var lexer = module.exports.lexer = function(text) {
    var state = {};
    return text.split(/\n/).map(parseByLine);
};

var parseByLine = function(line, num) {
    if (SECTION.test(line)) {
        var rank = RegExp.$2.length;
        return ["section", RegExp.$1, rank, num];
    }
    if (END_OF_SEES.test(line)) {
        return ["endofsee", num];
    }
    if (END_OF_ACTION.test(line)) {
        return ["endofaction", RegExp.$1, num];
    }
    if (WHITE_LINE.test(line)) {
        return ["whiteline", num];
    }
    return ["text", line, num];
};

var parseTags = function(listOfNode) {
    var tree = {};
    var nId = 1;
    var currentSection = null;
    var lastAction;
    var actions;
    listOfNode.forEach(function(node) {
        var tag = node[0];
        if (tag == "whiteline") {
            return;
        }
        if (tag == "section") {
            currentSection = node[1];
            if (lastAction && !lastAction.direction) {
                lastAction.direction = currentSection;
                //previousSection = currentSection;
            }

            if (tree[currentSection]) {
                throw new Error("Duplicated section:" + currentSection + "\tL:" + node[3]);
            }
            tree[currentSection] = {
                name: currentSection,
                rank: node[2],
                see: [],
                id: nId++,
                actions: [{
                    text: [],
                    direction: null
                }],
                state: "see"
            };
        }
        if (tag == "endofsee") {
            if (!tree[currentSection]) {
                throw new Error("Undefined section" + "\tL:" + node[1]);
            }
            if (tree[currentSection].state == "action") {
                throw new Error("Duplicated sees" + "\tL:" + node[1]);
            }
            tree[currentSection].state = "action";
        }
        if (tag == "endofaction") {
            if (!tree[currentSection]) {
                throw new Error("Undefined section" + "\tL:" + node[2]);
            }
            actions = tree[currentSection].actions;
            actions[actions.length - 1].direction = node[1];
            tree[currentSection].state = "endaction";

        }
        if (tag == "text") {
            if (!tree[currentSection]) {
                throw new Error("Undefined section" + "\tL:" + node[2]);
            }
            var state = tree[currentSection].state;
            if (state == "see") {
                tree[currentSection].see.push(node[1]);
            }
            if (state == "endaction") {
                tree[currentSection].actions.push({
                    text: [],
                    direction: null
                });
                state = tree[currentSection].state = "action";
            }
            if (state == "action") {
                actions = tree[currentSection].actions;
                actions[actions.length - 1].text.push(node[1]);
                lastAction = actions[actions.length - 1];
            }
        }
    });
    return tree;
};
var parse = module.exports.parse = function(text) {
    return parseTags(lexer(text));
};
