"use strict";

import Show = require('./Show');
import Gradient = require('./Gradient');

/* LightStar light fixture
    contains 11 rays:

    ray  0:  15 LEDs
    ray  1:  25 LEDs
    ray  2:  15 LEDs
    ray  3:  30 LEDs
    ray  4:  20 LEDs
    ray  5:  30 LEDs
    ray  6:  20 LEDs
    ray  7:  30 LEDs
    ray  8:  15 LEDs
    ray  9:  25 LEDs
    ray 10:  15 LEDs

*/

class LightStar extends Show {
    static rayCount = 11;
    static ledCount = [15, 25, 15, 30, 20, 30, 20, 30, 15, 25, 15];
    static rayToRow = [0,  0,  2, 1,  0,  2,  3,  1, 2,  3, 3];
    static startLed = [0, 15, 45, 0, 40, 15, 40, 30, 0, 15, 0];
    static maxLedsPerRay = 30;
    static maxLeds = 240;

    private static getRowLed(ray: number, led: number): { r: number, l: number } {

        var r = LightStar.rayToRow[ray],
            l = LightStar.startLed[ray] + led;

        return { r: r, l: l };
    }

    constructor(refresh: number) {
        super(refresh);
    }

    setLed(frame: number, ray: number, led: number, color: string) {

        if (frame >= this.show.frame.length)
            return;

        if (ray >= LightStar.rayCount)
            return;

        if (led >= LightStar.ledCount[ray])
            return;

        var f = this.show.frame[frame];
        var rl = LightStar.getRowLed(ray, led);
        var r = f['row'][rl.r];
        if (Array.isArray(r)) {
            r[rl.l] = color;
        }
    }

    setRay(frame: number, ray: number, color: string) {

        if (frame >= this.show.frame.length)
            return;

        if (ray >= LightStar.rayCount)
            return;

        var g: Gradient;
        if (color.substr(0, 4) == "grad")
            g = Gradient.new(LightStar.maxLedsPerRay, color);

        var f = this.show.frame[frame];
        var rl = LightStar.getRowLed(ray, 0);
        var r = f['row'][rl.r];
        if (Array.isArray(r)) {
            for (var l = 0; l < LightStar.ledCount[ray]; l++)
                r[rl.l + l] = g == null ? color : g.getColor(l);
        }
    }

    setRing(frame: number, ring: number, color: string) {

        if (frame >= this.show.frame.length)
            return;

        if (ring >= LightStar.maxLedsPerRay)
            return;

        var f = this.show.frame[frame];
        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            if (ring >= LightStar.ledCount[ray])
                continue;

            var rl = LightStar.getRowLed(ray, ring);
            var r = f['row'][rl.r];
            if (Array.isArray(r)) {
                r[rl.l] = color;
            }
        }
    }

    setFrame(frame: number, color: string) {
        if (frame >= this.show.frame.length)
            return;

        var f = this.show.frame[frame];
        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            var rl = LightStar.getRowLed(ray, 0);
            var r = f['row'][rl.r];
            if (Array.isArray(r)) {
                for (var l = 0; l < LightStar.ledCount[ray]; l++)
                    r[rl.l + l] = color;
            }
        }
    }

    static playWave(ls: LightStar, prm: Object) {
        var rays = [
            {
                "ray": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "direction": "u",
                "bcolor": "#000000",
                "wcolor": "#808080"
            }
        ];
        var dur = 1;
        var rep = 50;
        var wlen = 0;
        var rlen = 1;
        var flen = 1;
        var col = "#000000";

        if (prm.hasOwnProperty("rays"))
            rays = prm["rays"];

        if (prm.hasOwnProperty("repeat"))
            rep = prm["repeat"];

        if (prm.hasOwnProperty("duration"))
            dur = prm["duration"];

        if (prm.hasOwnProperty("wlength"))
            wlen = prm["wlength"];

        if (prm.hasOwnProperty("rlength"))
            rlen = prm["rlength"];

        if (prm.hasOwnProperty("flength"))
            flen = prm["flength"];

        if (prm.hasOwnProperty("color"))
            col = prm["color"];

        // add base frame filled with default color
        var base = ls.addBaseFrame();
        ls.setFrame(base, col);

        var wmax = LightStar.maxLedsPerRay + rlen + wlen + flen;
        
        // add transitions
        for (var pass = 1; pass <= 2; pass++) {
            for (var w = 0; w < wmax; w++) {
                var f = null;

                for (var rprm = 0; rprm < rays.length; rprm++) {
                    var dir = "n";
                    var ray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                    var bcol = "#000000";
                    var wcol = "#808080";
                    var ecol = bcol;

                    if (rays[rprm].hasOwnProperty("direction"))
                        dir = rays[rprm]["direction"];

                    if (rays[rprm].hasOwnProperty("ray"))
                        ray = rays[rprm]["ray"];

                    if (rays[rprm].hasOwnProperty("bcolor"))
                        bcol = rays[rprm]["bcolor"];

                    if (rays[rprm].hasOwnProperty("wcolor"))
                        wcol = rays[rprm]["wcolor"];

                    if (rays[rprm].hasOwnProperty("ecolor"))
                        ecol = rays[rprm]["ecolor"];
                    else
                        ecol = bcol;

                    var d;
                    if (pass == 1 && dir.length > 0) {
                        dir = dir.substr(0, 1);
                    }
                    else if (pass == 2 && dir.length > 1) {
                        dir = dir.substr(1, 1);
                    }
                    else
                        dir = "n";

                    if (dir === "u")
                        d = 0;          // 1 - down
                    else if (dir === "d")
                        d = 1;          // 1 - down
                    else if (dir === "p")
                        d = 2;          // 2 - paralel down 
                    else
                        break;

                    // rasing edge gradient
                    var rg = new Gradient(rlen, [bcol, wcol]);

                    // falling edge gradient
                    var fg = new Gradient(flen, [wcol, ecol]);

                    if (f == null)
                        f = ls.addTransitionFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null });

                    if (d == 0) { // up wave
                        for (var r = 0; r < LightStar.rayCount; r++) {
                            if (ray.indexOf(r) < 0)
                                continue;

                            for (var l = 0; l < LightStar.ledCount[r]; l++) {
                                var led = l;

                                if (l <= w && l > w - rlen) // rising edge
                                    ls.setLed(f, r, led, rg.getColor(w - l));
                                else if (l <= w - rlen && l > w - rlen - wlen)  // wave
                                    ls.setLed(f, r, led, wcol);
                                else if (l <= w - rlen - wlen && l > w - rlen - wlen - flen) // falling edge
                                    ls.setLed(f, r, led, fg.getColor(w - rlen - wlen - l));
                                else if (l <= w - rlen - wlen - flen)
                                    ls.setLed(f, r, led, ecol);
                                else
                                    ls.setLed(f, r, led, bcol);

                                ls.setLed(base, r, led, bcol);
                            }
                        }
                    }

                    if (d == 1 || d == 2) {    // down wave
                        for (var r = 0; r < LightStar.rayCount; r++) {
                            if (ray.indexOf(r) < 0)
                                continue;

                            for (var l = 0; l < LightStar.maxLedsPerRay; l++) {
                                var led = l;
                                if (d == 2)
                                    led = LightStar.ledCount[r] - 1 - l;
                                else
                                    led = LightStar.maxLedsPerRay - 1 - l;

                                if (led >= LightStar.ledCount[r] || led < 0)
                                    continue;

                                if (l <= w && l > w - rlen) // rising edge
                                    ls.setLed(f, r, led, rg.getColor(w - l));
                                else if (l <= w - rlen && l > w - rlen - wlen)  // wave
                                    ls.setLed(f, r, led, wcol);
                                else if (l <= w - rlen - wlen && l > w - rlen - wlen - flen) // falling edge
                                    ls.setLed(f, r, led, fg.getColor(w - rlen - wlen - l));
                                else if (l <= w - rlen - wlen - flen)
                                    ls.setLed(f, r, led, ecol);
                                else
                                    ls.setLed(f, r, led, bcol);

                                ls.setLed(base, r, led, bcol);
                            }
                        }
                    }
                }
            }
        }
    }

    static playPend(ls: LightStar, prm: Object) {
        var dur = 1;
        var rep = 50;
        var width = 0;
        var lcol = "#000000";
        var pcol = "#000000";
        var rcol = "#000000";

        if (prm.hasOwnProperty("repeat"))
            rep = prm["repeat"];

        if (prm.hasOwnProperty("duration"))
            dur = prm["duration"];

        if (prm.hasOwnProperty("width"))
            width = prm["width"];

        if (prm.hasOwnProperty("lcolor"))
            lcol = prm["lcolor"];

        if (prm.hasOwnProperty("pcolor"))
            pcol = prm["pcolor"];

        if (prm.hasOwnProperty("rcolor"))
            rcol = prm["rcolor"];

        var rlen = Math.round(width/2);
        var flen = width - rlen;

        var doGrad = !Gradient.isGrad(lcol) && !Gradient.isGrad(rcol);

        var wmax = LightStar.rayCount + width + rlen + flen;

        if (doGrad) {
            // left-to-pend gradient
            var l2p = new Gradient(width + 2, [lcol, pcol]);

            // pend-to-right gradient
            var p2r = new Gradient(width + 2, [pcol, rcol]);

            // right-to-pend gradient
            var r2p = new Gradient(width + 2, [rcol, pcol]);

            // pend-to-left gradient
            var p2l = new Gradient(width + 2, [pcol, lcol]);
        }

        // add base frame filled with default color
        var base = ls.addBaseFrame();
        //ls.setFrame(base, rcol);

        // add transitions
        for (var pass = 1; pass <= 2; pass++) {
            for (var w = 0; w < wmax; w++) {
                var f = null;

                var dir = "n";
                if (prm.hasOwnProperty("direction"))
                    dir = prm["direction"];

                if (pass == 1 && dir.length > 0) {
                    dir = dir.substr(0, 1);
                }
                else if (pass == 2 && dir.length > 1) {
                    dir = dir.substr(1, 1);
                }
                else
                    dir = "n";

                var d;
                if (dir === "r")
                    d = 0;          // 0 - right
                else if (dir === "l")
                    d = 1;          // 1 - left
                else
                    break;

                if (f == null)
                    f = ls.addTransitionFrame({ duration: dur, repeat: rep });

                for (var r = 0; r < LightStar.rayCount; r++) {

                    var ray;
                    if (d == 0)     // right move
                        ray = r;
                    else            // left move
                        ray = LightStar.rayCount - r - 1;

                    if (r <= w && r > w - rlen) { // right edge
                        if (doGrad)
                            ls.setRay(f, ray, (d == 0 ? r2p : l2p).getColor(w - r));
                        else
                            ls.setRay(f, ray, (d == 0 ? rcol : lcol));
                    }
                    else if (r <= w - rlen && r > w - rlen - width) { // pend
                        ls.setRay(f, ray, pcol);
                    }
                    else if (r <= w - rlen - width && r > w - rlen - width - flen) { // left edge
                        if (doGrad)
                            ls.setRay(f, ray, (d == 0 ? p2l : p2r).getColor(w - rlen - width - r));
                        else
                            ls.setRay(f, ray, (d == 0 ? lcol : rcol));
                    }
                    else if (r <= w - rlen - width - flen) {
                        ls.setRay(f, ray, d == 0 ? lcol : rcol);
                    }
                    else {
                        ls.setRay(f, ray, d == 0 ? rcol : lcol);
                    }

                    if (pass == 1)
                        ls.setRay(base, ray, d == 0 ? rcol : lcol);
                }
            }
        }
    }

    static playScene(scene: Object): LightStar {

        if (!scene.hasOwnProperty("type"))
            throw new SyntaxError("Missing show type");

        var refresh = 1;
        if (scene.hasOwnProperty("refresh"))
            refresh = scene["refresh"];

        var ls = new LightStar(refresh);

        switch (scene["type"]) {

            case "wave":
                if (!scene.hasOwnProperty("wave"))
                    throw new SyntaxError("Missing wave parameters");
                LightStar.playWave(ls, scene["wave"]);
                break;

            case "pend":
                if (!scene.hasOwnProperty("pend"))
                    throw new SyntaxError("Missing pendulum parameters");
                LightStar.playPend(ls, scene["pend"]);
                break;

            default:
                throw new SyntaxError("Unknown show type");
        }

        return ls;
    }
}

export = LightStar;
