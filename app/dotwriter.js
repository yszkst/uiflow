/**
 * 
 * @param {string} text 
 * @param {number} level 
 * 
 * @returns {string}
 */
const tab = (text, level) => {
    return '\t'.repeat(level) + text;
};


/**
 * 
 * @param {string} text 
 * 
 * @returns {string}
 */
const escapeQuote = function(text) {
    return '"' + (text + "").replace(/"/g, "\"") + '"';
};


/**
 * 
 * @param {number} tabLevel 
 * @param {object} obj 
 * 
 * @returns {string}
 */
const attributes = (tabLevel, obj) => {
    return Object.keys(obj).map((key) => {
        return tab(`${key} = ${escapeQuote(obj[key])}`, tabLevel);
    }).join(",\n");
};

/**
 * 
 * @param {number} tabLevel 
 * @param {string} name 
 * @param {*} values 
 * 
 * @returns {string}
 */
const blanket = (tabLevel, name, values) => {
    return [
        tab(name, tabLevel) + "[",
        attributes(tabLevel + 1, values),
        tab("]", tabLevel)
    ].join("\n");
};


/**
 * 
 * @param {*} port 
 * @param {string} text 
 * 
 * @returns {string}
 */
const section = (port, text) => {
    return "<" + port + ">" + " " + text + "\\l ";
};


/**
 * 
 * @param {string} str
 * 
 * @returns {number} 
 */
const runeWidth = (str) => {
    if (!str) {
        return 0;
    }

    let count = 0
    for (let i = 0, l = str.length; i < l; i++) {
        count += str.charCodeAt(i) <= 255 ? 1 : 2;
    }

    return count;
};


/**
 * 
 * @param {object} elm
 * 
 * @returns {number} 
 */
const  maxRuneWidth = (elm) => {
    const nameWidth = runeWidth(elm.name);
    const maxSeeWith = Math.max.apply(null, elm.see.map(runeWidth));
    const maxActionWidth = Math.max.apply(null, elm.actions.map((a) => {
        return Math.max.apply(null, a.text.map(runeWidth));
    }));
    return Math.max(nameWidth, maxSeeWith, maxActionWidth);
};


/**
 * 
 * @param {number} runeWidth
 * 
 * @returns {number} 
 */
const runeToWidth = (runeWidth) => {
    var rw = (runeWidth <= 5) ? 5 : runeWidth;
    return rw / 13 + 0.2;
};


/**
 * 
 * @param {object} tree 
 *
 * @returns {string}
 */
const treeToDotDef = (tree) => {
    return Object.keys(tree).map((key) => {
        const elm = tree[key];
        const noActions = elm.actions.length === 1 && elm.actions[0].text.length === 0;
        const runeWidth = maxRuneWidth(elm);

        return blanket(1, nameOf(elm), {
            shape: "record",
            label: [
                    section("title", elm.name),
                    section("see", elm.see.join("\\l")),
                    noActions ? null : elm.actions.map(function(action, index) {
                        return section("action" + index, action.text);
                    }).join("|"),
                ].filter(function(r) {
                    return !!r;
                }).join("|"),
            width: runeToWidth(runeWidth),
        });

    }).join("\n");
};


/**
 * 
 * @param {*} from 
 * @param {*} to 
 * @param {string} label 
 * 
 * @returns {string}
 */
const arrow = (from, to, label) => {
    if (!label) {
        return tab(from + " -> " + to, 1);
    }
    return tab(from + " -> " + to + "[ label =" + escapeQuote(label) + "]", 1);
};


/**
 * 
 * @param {object} elm 
 * @param {*} port 
 * 
 * @returns {string}
 */
const nameOf = (elm, port) => {
    const escapedName = escapeQuote(elm.name);
    if (port) {
        return escapedName + ":" + port;
    }
    return escapedName;
};

/**
 * 
 * @param {object} tree 
 */
const treeToDotArrow = (tree) => {
    return Object.keys(tree).map((key) => {
        const elm = tree[key];
        return elm.actions.map((e, i) => {
            if (!e.direction) {
                return "";
            }
            if (!tree[e.direction]) {
                return arrow(
                    nameOf(elm, "action" + i),
                    escapeQuote(e.direction),
                    e.edge
                );
            }
            return arrow(
                nameOf(elm, "action" + i),
                nameOf(tree[e.direction]),
                e.edge
            );
        }).join("\n");
    }).join("\n");
};

/**
 * 
 * @param {object} tree 
 * 
 * @returns {string}
 */
const treeToDotRank = (tree) => {
    const ranks = {};
    let result = "";

    Object.keys(tree).forEach((key) => {
        const elm = tree[key];
        ranks[elm.rank] = ranks[elm.rank] ? ranks[elm.rank] : [];
        ranks[elm.rank].push(nameOf(elm));
    });

    Object.keys(ranks).forEach((key) => {
        if (key == '1') {
            result += tab("{ rank = source;" + ranks[key].join(";") + ";}", 1);
            result += "\n";
            return;
        }
        if (key != '0') {
            result += tab("{ rank = same;" + ranks[key].join(";") + ";}", 1);
            result += "\n";
            return;
        }
    });

    return result;
};



const defaultGraph = {
    charset: "UTF-8",
    labelloc: "t",
    labeljust: "r",
    style: "filled",
    rankdir: "LR",
    margin: 0.2,
    ranksep: 0.5,
    nodesep: 0.4
};

const defaultNode = {
    style: "solid",
    fontsize: 11,
    margin: "0.1,0.1",
    fontname: "Osaka-Mono,ＭＳ ゴシック",
};

const defaultEdge = {
    fontsize: 9,
    fontname: "Osaka-Mono,ＭＳ ゴシック",
    color: "#777777"
};


class DotWriter {
    constructor(graph=defaultGraph, node=defaultNode, edge=defaultEdge) {
        this._graph = graph;
        this._node = node;
        this._edge = edge;
    }

    /**
     * @param {object} tree
     * 
     * @returns {string}
     */
    compile(tree) {
        return [
            "digraph D {",
            blanket(1, "graph", this._graph),
            blanket(1, "node", this._node),
            blanket(1, "edge", this._edge),
            treeToDotDef(tree),
            treeToDotArrow(tree),
            treeToDotRank(tree),
            "}"
        ].join("\n");
    };
}


exports.defaultGraph = defaultGraph;
exports.defaultNode = defaultNode;
exports.defaultEdge = defaultEdge;
exports.DotWriter = DotWriter;
