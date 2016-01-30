"use strict";

import Show = require('./Show');
import Gradient = require('./Gradient');

/* LedPanel
    contains 8 rows 30 LEDs each
    electrically connected as i row of 240 LEDs

    LED coordinates from bottom left corner:
    x: 0..29
    y: 0..7
*/

class LedPanel extends Show {
    static width = 30;
    static height = 8;

    private static getLed(x: number, y: number): number {

        if (y == 0 || y == 2 || y == 4 || y == 6)
            return LedPanel.width * y + x;

        if (y == 1 || y == 3 || y == 5 || y == 7)
            return LedPanel.width * y + (LedPanel.width - x) - 1;
    }

    constructor(refresh: number) {
        super(refresh);
        this.defaultRowCount = 1;
        this.defaultLedCount = 240;
    }

    // set single LED
    setLed(frame: number, color: string, x: number, y: number) {

        if (frame >= this.show.frame.length)
            return;

        if (x >= LedPanel.width)
            return;

        if (y >= LedPanel.height)
            return;

        var f = this.show.frame[frame];
        var l = LedPanel.getLed(x,y);
        var r = f['row'][0];
        if (Array.isArray(r)) {
            r[l] = color;
        }
    }

    // fill rectangle
    fillRect(frame: number, color: string, left = 0, bottom = 0,
        width = LedPanel.width, height = LedPanel.height) {

        for (let y = bottom; y >= 0 && y < bottom + height && y < LedPanel.height; y++) {
            for (let x = left; x >= 0 && x < left + width && x < LedPanel.width; x++) {
                this.setLed(frame, color, x, y);
            }
        }
    }

    printChar(frame: number, bg: string, fg: string, bitmap: Array<Array<number>>,
        left = 0, bottom = 0, width = LedPanel.width, height = LedPanel.height) {
        for (let y = bottom; y >= 0 && y < bottom + height && y < LedPanel.height; y++) {
            for (let x = 0; x < width && x < LedPanel.width; x++) {
                let b = bitmap[7 - y];
                this.setLed(frame, b[x] ? fg : bg, x + left, y);
            }
        }
    }
}

export = LedPanel;
