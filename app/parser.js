/**
 * 
 * @param {string} message 
 * @param {number} lineNumber 
 * 
 * @returns {Error}
 */
const constructError = (message, lineNumber) => {
    const error = new Error(`${lineNumber}: error: ${message}`);
    error.lineNumber = lineNumber;
    return error;
}


const SECTION = /\[([^#\]]*)(#+)?\]/;
const END_OF_SEES = /^-+/;
const END_OF_ACTION = /=+(?:{([^}]+)})?=+>\s*([^:\]]*)/;
const BLANK = /^\s*$/;


const NodeType = {
    SECTION: 'SECTION',
    END_OF_SEE: 'END_OF_SEE',
    END_OF_ACTION: 'END_OF_ACTION',
    BLANK: 'BLANK',
    TEXT: 'TEXT',
};


/**
 * 
 * @param {string} line  
 * @param {number} num 
 * 
 * @returns {Array}
 */
const parseByLine = (line, num) => {
    if (SECTION.test(line)) {
        const rank = RegExp.$2.length;
        return [NodeType.SECTION, RegExp.$1, rank, num];
    }
    if (END_OF_SEES.test(line)) {
        return [NodeType.END_OF_SEE, num];
    }
    if (END_OF_ACTION.test(line)) {
        return [NodeType.END_OF_ACTION, RegExp.$2, RegExp.$1, num];
    }
    if (BLANK.test(line)) {
        return [NodeType.BLANK, num];
    }
    return ["text", line, num];
};


/**
 * 
 * @param {Array} listOfNode
 * 
 * @returns {Object} tree
 */
const parseTags = (listOfNode) => {
    const tree = {};

    let nId = 1;
    let currentSection = null;
    let lastAction;
    let actions;

    listOfNode.forEach(function(node) {
        const tag = node[0];

        if (tag == NodeType.BLANK) {
            return;
        }

        if (tag == NodeType.SECTION) {
            currentSection = node[1];
            if (lastAction && !lastAction.direction) {
                lastAction.direction = currentSection;
            }

            if (tree[currentSection]) {
                throw constructError("Duplicated section:" + currentSection, node[3]);
            }

            tree[currentSection] = {
                name: currentSection,
                rank: node[2],
                lines: node[3],
                see: [],
                id: nId++,
                actions: [{
                    text: [],
                    direction: null
                }],
                state: "see"
            };
        }

        if (tag == NodeType.END_OF_SEE) {
            if (!tree[currentSection]) {
                throw constructError("Undefined section [" + currentSection + "]", node[1]);
            }
            if (tree[currentSection].state == "action") {
                throw constructError("Duplicated sees" + "\tL:", node[1]);
            }
            tree[currentSection].state = "action";
        }

        if (tag == NodeType.END_OF_ACTION) {
            if (!tree[currentSection]) {
                throw constructError("Undefined section" + "\tL:", node[3]);
            }
            actions = tree[currentSection].actions;
            actions[actions.length - 1].direction = node[1];
            actions[actions.length - 1].edge = node[2];

            tree[currentSection].state = "endaction";
        }
        if (tag == "text") {
            if (!tree[currentSection]) {
                throw constructError("Undefined section" + "\tL:", node[2]);
            }
            let state = tree[currentSection].state;
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




/**
 * 
 * @param {string} text 
 * 
 * @returns {Array}
 */
const lexer = (text) => {
    return text.split(/\n/).map(parseByLine);
};


/**
 * 
 * @param {string} text 
 * 
 * @returns {object}
 */
const parse = (text) => {
    return parseTags(lexer(text));
};


exports.lexer = lexer;
exports.parse = parse;
