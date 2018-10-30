'use strict'
export {Events};

import {MapEvents} from './map.events'
import {DOMEvents} from './dom.events';
import {BrowserEvents} from "./browser.events";
import proj from 'ol/proj';
import {Import} from "../import/import";
import {Panel} from "../panel/panel";

class Events {

    constructor(map){
        this.map = map;
        this.domEvents = new DOMEvents(map);
        this.mapEvents = new MapEvents(map);
        this.browserEvents = new BrowserEvents(map);
    }
}