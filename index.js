'use strict';

const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');

const { parse } = require("./app/parser");
const { DotWriter } = require("./app/dotwriter");



class UIFlow {
    constructor (dotWriter = new DotWriter()) {
        this._dotWriter = dotWriter;
        this._viz = new Viz({ Module, render });
    }

    /**
     * 
     * @param {string} uiflowText 
     * 
     * @returns {Promise<string>}
     */
    async generateDotString(uiflowText) {
        const tree = parse(uiflowText);
        return this._dotWriter.compile(tree);
    }

    /**
     * 
     * @param {string} uiflowText 
     * 
     * @return {Promise<object>}
     */
    async generateJSON(uiflowText) {
        const dotString = await this.generateDotString(uiflowText);
        const ret = await this._viz.renderJSONObject(dotString);
        return ret; 
    }

    /**
     * 
     * @param {string} uiflowText 
     * 
     * @return {Promise<SVGSVGElement>}
     */
    async generateSVG(uiflowText) {
        const dotString = await this.generateDotString(uiflowText);
        const ret = await this._viz.renderSVGElement(dotString);
        return ret; 
    }


    /**
     * 
     * @param {string} uiflowText 
     * 
     * @return {Promise<HTMLImageElement>}
     */
    async generateImage(uiflowText) {
        const dotString = await this.generateDotString(uiflowText);
        const ret = await this._viz.renderImageElement(dotString);
        return ret; 
    }
}

exports.UIFlow = UIFlow;
