"use strict";

import fs = require('fs');
import bdf = require('bdf');

import GnkSpi = require('./GnkSpi');
import Show = require('./Show');
import LightStar = require('./LightStar');
import LedPanel = require('./LedPanel');
import ColorUtil = require('./ColorUtil');
import Gradient = require('./Gradient');

var GnkDebug = false;
if (process.env.GNK_DEBUG === 'YES') {
    GnkDebug = true;
}

var Log: (msg: string) => void;
var Msg: (msg: string) => void;
if (GnkDebug) {
    Msg = Log = function (msg: string) {
        console.log(msg);
    }
}
else {
    Msg = function (msg: string) {
        console.log(msg);
    }
    Log = function (msg: string) {
    }
}

var gnkspi: GnkSpi.Dev;
if (process.env.PROCESSOR_ARCHITECTURE === 'ARM') {
    gnkspi = new GnkSpi.Addon(Log);
}
else {
    gnkspi = new GnkSpi.Emul(Msg);
}

function delay(ms) {
    ms += new Date().getTime();
    while (new Date() < ms) { }
}

function interpolate(range: number, position: number, count: number) {
    return Math.round(range * position / count);
}

function testLightStar(cmd: string) {

    switch (cmd) {
        case "set":                 // set <ray> <led> color
            if (process.argv.length < 6) {
                Msg(`process.argv.length ${process.argv.length}  expected 6`);
                break;
            }

            var ls = new LightStar(10);
            var f = ls.addBaseFrame();

            ls.setLed(f, Number(process.argv[3]), Number(process.argv[4]), process.argv[5]);

            var s = ls.asString();
            //Msg(s);
            gnkspi.Show(s, 0, -1);

            break;

        case "ray":                // ray <repeat> [<color> ...]
            if (process.argv.length < 4) {
                Msg(`process.argv.length ${process.argv.length}  expected 4 or more`);
                break;
            }

            var args = [];
            var repeat = Number(process.argv[3]);
            while (repeat-- > 0) {
                arg = 4;
                while (arg < process.argv.length)
                    args.push(process.argv[arg++]);
            }

            var ls = new LightStar(10);
            var f = ls.addBaseFrame();
            var g = new Gradient(LightStar.rayCount, args);

            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                ls.setRay(f, ray, g.getColor(ray));
            }

            gnkspi.Show(ls.asString(), 0, -1);

            break;

        case "ring":                // ring repeat [<color> ...]
            if (process.argv.length < 4) {
                Msg(`process.argv.length ${process.argv.length}  expected 4 or more`);
                break;
            }

            var args = [];
            var repeat = Number(process.argv[3]);
            while (repeat-- > 0) {
                arg = 4;
                while (arg < process.argv.length)
                    args.push(process.argv[arg++]);
            }

            var ls = new LightStar(10);
            var f = ls.addBaseFrame();
            var g = new Gradient(LightStar.maxLedsPerRay, args);

            var cnt = 0;
            for (var led = 0; led < LightStar.maxLedsPerRay; led++) {
                ls.setRing(f, led, g.getColor(cnt++));
            }

            gnkspi.Show(ls.asString(), 0, -1);

            break;

        case "upd":                // upd <refresh> <color> [ <duration> <repeat> <diff> ...]
            if (process.argv.length < 5) {
                Msg(`process.argv.length ${process.argv.length}  expected 5`);
                break;
            }

            var ref = Number(process.argv[3]);
            var col = process.argv[4];
            var arg = 5;

            var ls = new LightStar(ref);
            var f = ls.addBaseFrame();

            ls.setFrame(f, col);

            while ((arg + 3) <= process.argv.length) {
                var dur = Number(process.argv[arg++]);
                var rep = Number(process.argv[arg++]);
                col = process.argv[arg++];

                f = ls.addUpdateFrame({ duration: dur, repeat: rep });
                ls.setFrame(f, col);
            }

            gnkspi.Show(ls.asString(), 0, -1);

            break;

        case "fring":                 // fring <refresh> <color> [ <dur> <rep> <add> <sub>] 
            if (process.argv.length < 6) {
                Msg(`process.argv.length ${process.argv.length}  expected 6`);
                break;
            }

            var ref = Number(process.argv[3]);
            var col = process.argv[4];
            var arg = 5;
            var mul = .95;

            var ls = new LightStar(ref);
            var f = ls.addBaseFrame();

            // fill base frame
            ls.setFrame(f, col);

            var wl = 3;
            var inc = -wl + 1;
            var dec = -wl * 2 + 1;

            // updates
            while ((arg + 4) <= process.argv.length) {
                var dur = Number(process.argv[arg++]);
                var rep = Number(process.argv[arg++]);
                var add = process.argv[arg++];
                var sub = process.argv[arg++];

                for (var t = 0; t < (29 + wl * 2); t++) {
                    f = ls.addUpdateFrame({ duration: dur, repeat: rep });

                    for (var led = 0; led < 30; led++) {
                        for (var ray = 0; ray < LightStar.rayCount; ray++) {
                            if (led < LightStar.ledCount[ray]) {
                                if (led >= inc && led < (inc + wl))
                                    ls.setLed(f, ray, led, add);
                                if (led >= dec && led < (dec + wl))
                                    ls.setLed(f, ray, led, sub);
                            }
                        }
                    }

                    inc++;
                    dec++;
                }
            }

            gnkspi.Show(ls.asString(), 0, -1);

            break;

        case "tran":                    // tran  <refresh> <color> [ <duration> <repeat> <color> ...]
            if (process.argv.length < 5) {
                Msg(`process.argv.length ${process.argv.length}  expected 5`);
                break;
            }

            var ref = Number(process.argv[3]);
            var col = process.argv[4];
            var arg = 5;

            var ls = new LightStar(ref);

            ls.setFrame(ls.addBaseFrame(), col);

            while ((arg + 3) <= process.argv.length) {
                var dur = Number(process.argv[arg++]);
                var rep = Number(process.argv[arg++]);
                col = process.argv[arg++];

                ls.setFrame(ls.addTransitionFrame({ duration: dur, repeat: rep }), col);
            }

            gnkspi.Show(ls.asString(), 0, -1);

            break;

        case "wave": {      // wave <direction> <refresh> <bcolor> <wcolor> <wspeed> <wlen> [<rlen> [<flen>]]
            if (process.argv.length < 9) {
                Msg(`process.argv.length ${process.argv.length}  expected 9 or more`);
                break;
            }

            var arg = 3;
            var dir = process.argv[arg++];
            var ref = Number(process.argv[arg++]);
            var bcol = process.argv[arg++];
            var wcol = process.argv[arg++];
            var wspd = Number(process.argv[arg++]);
            var wlen = Number(process.argv[arg++]);
            var rlen = wlen;
            var flen = wlen;
            if (arg < process.argv.length)
                rlen = Number(process.argv[arg++]);
            if (arg < process.argv.length)
                flen = Number(process.argv[arg++]);

            var d = 0;
            // direction must be u or d
            if (dir === "b")
                d = 1;
            if (dir === "d")
                d = 2;
            if (dir === "p")
                d = 3; 

            // wspeed parameter must be in 1..100 range
            if (wspd < 1)
                wspd = 1;
            if (wspd > 100)
                wspd = 100;
            wspd--;

            // rasing edge gradient
            var rg = new Gradient(rlen, [bcol, wcol]);

            // falling edge gradient
            var fg = new Gradient(flen, [wcol, bcol]);

            // create light and add base frame filled with base color
            var ls = new LightStar(ref);
            ls.setFrame(ls.addBaseFrame(), bcol);

            var wmax = LightStar.maxLedsPerRay + rlen + wlen + flen;

            // calculate transition duration/repeat from wave speed
            var dur = 1;
            var rep = 100 - wspd;
        
            // add transition frame for each wave position

            // up wave
            if (d == 0 || d == 1) {
                for (var w = 0; w < wmax; w++) {
                    var f = ls.addTransitionFrame({ duration: dur, repeat: rep })

                    for (var r = 0; r < LightStar.rayCount; r++) {
                        for (var l = 0; l < LightStar.ledCount[r]; l++) {
                            var led = l;

                            if (l <= w && l > w - rlen) // rasing edge
                                ls.setLed(f, r, led, rg.getColor(w - l));
                            else if (l <= w - rlen && l > w - rlen - wlen)  // wave
                                ls.setLed(f, r, led, wcol);
                            else if (l <= w - rlen - wlen && l > w - rlen - wlen - flen) // falling edge
                                ls.setLed(f, r, led, fg.getColor(w - rlen - wlen - l));
                            else
                                ls.setLed(f, r, led, bcol);
                        }
                    }
                }
            }

            // down wave
            if (d == 1 || d == 2 || d == 3) {
                for (var w = 0; w < wmax; w++) {
                    var f = ls.addTransitionFrame({ duration: dur, repeat: rep })

                    for (var r = 0; r < LightStar.rayCount; r++) {
                        for (var l = 0; l < LightStar.maxLedsPerRay; l++) {
                            var led = l;
                            if (d == 2)
                                led = LightStar.ledCount[r] - 1 - l;
                            else
                                led = LightStar.maxLedsPerRay - 1 - l;

                            if (led >= LightStar.ledCount[r] || led < 0)
                                continue;

                            if (l <= w && l > w - rlen) // rasing edge
                                ls.setLed(f, r, led, rg.getColor(w - l));
                            else if (l <= w - rlen && l > w - rlen - wlen)  // wave
                                ls.setLed(f, r, led, wcol);
                            else if (l <= w - rlen - wlen && l > w - rlen - wlen - flen) // falling edge
                                ls.setLed(f, r, led, fg.getColor(w - rlen - wlen - l));
                            else
                                ls.setLed(f, r, led, bcol);
                        }
                    }
                }
            }

            gnkspi.Show(ls.asString(), 0, -1);

            break;
        }

        case "list": {
            try {
                let dir = fs.readdirSync("./show");

                dir.forEach((s: string) => {
                    Msg(`File: ${s}`);
                });
            }
            catch (err) {
                Msg(`Error: ${err.message}`);
            }

            break;
        }

        case "play": {      // play <json file name>
            if (process.argv.length < 4) {
                Msg(`process.argv.length ${process.argv.length}  expected 4 or more`);
                break;
            }

            try {
                var f_buf = fs.readFileSync(`./show/${process.argv[3]}`);
                var f_str = f_buf.toString();
                var f_show = JSON.parse(f_str);

                Msg(JSON.stringify(f_show));

                var ls = LightStar.playScene(f_show);
                Msg(`Total: ${ls.getFrameCount()} frames`);
                gnkspi.Show(ls.asString(), 0, -1);
            }
            catch (err) {
                Msg(`Error: ${err.message}`);
                throw err;
            }

            break;
        }

        case "stop":
            Msg(`Stop: ${gnkspi.Stop(0)}`);
            break;

        case "pgrad":       // pgrad <count> <color> [<color>]
            if (process.argv.length < 5) {
                Msg(`process.argv.length ${process.argv.length}  expected 5 or more`);
                break;
            }

            var cnt = Number(process.argv[3]);
            var arg = 4;
            var color = new Array<string>(0);
            while (arg < process.argv.length)
                color.push(process.argv[arg++]);

            var g = new Gradient(cnt, color);

            Msg(`steps:  ${g.getStepCount()}`);
            for (var st = 0; st < cnt; st++) {
                Msg(`step ${st}:  ${g.getColor(st)}  ${g.getStep(st)}`);
            }
            Msg(`   end:  ${g.getColor(cnt)}`);
            break;

        case "pint":        // pint <diff> <count> - interpolate 'difference' across 'count' steps
            if (process.argv.length < 5) {
                Msg(`process.argv.length ${process.argv.length}  expected 5 or more`);
                break;
            }

            var diff = Number(process.argv[3]);
            var count = Number(process.argv[4]);
            var cnt = 0;

            for (var st = 0; st < count; st++) {
                var d = interpolate(diff, st + 1, count) - cnt;
                cnt += d;

                Msg(`step:" ${st}  : ${d}  cnt: ${cnt}`);
            }

            break;

        default:
            Msg("Unknown command");
    }
}

function testLedPanel(cmd: string) {

    switch (cmd) {
        case "stop":
            Msg(`Stop: ${gnkspi.Stop(0)}`);
            break;

        case "set":                 // set x y color
            {
                if (process.argv.length < 6) {
                    Msg(`process.argv.length ${process.argv.length}  expected 6`);
                    break;
                }

                let x = Number(process.argv[3]);
                let y = Number(process.argv[4]);
                let c = process.argv[5];

                let lp = new LedPanel(10);
                let f = lp.addBaseFrame();

                lp.setLed(f, c, x, y);

                gnkspi.Show(lp.asString(), 0, -1);
            }
            break;

        case "hg":                // hg <repeat> [<color> ...]
            {
                if (process.argv.length < 4) {
                    Msg(`process.argv.length ${process.argv.length}  expected 4 or more`);
                    break;
                }

                let args = [];
                let repeat = Number(process.argv[3]);
                while (repeat-- > 0) {
                    let arg = 4;
                    while (arg < process.argv.length)
                        args.push(process.argv[arg++]);
                }

                let lp = new LedPanel(10);
                let f = lp.addBaseFrame();
                let g = new Gradient(LedPanel.width, args);

                for (let x = 0; x < LedPanel.width; x++) {
                    let c = g.getColor(x);
                    for (let y = 0; y < LedPanel.height; y++) {
                        lp.setLed(f, c, x, y);
                    }
                }

                gnkspi.Show(lp.asString(), 0, -1);
            }
            break;

        case "vg":                // vg <repeat> [<color> ...]
            {
                if (process.argv.length < 4) {
                    Msg(`process.argv.length ${process.argv.length}  expected 4 or more`);
                    break;
                }

                let args = [];
                let repeat = Number(process.argv[3]);
                while (repeat-- > 0) {
                    let arg = 4;
                    while (arg < process.argv.length)
                        args.push(process.argv[arg++]);
                }

                let lp = new LedPanel(10);
                let f = lp.addBaseFrame();
                let g = new Gradient(LedPanel.height, args);

                for (let y = 0; y < LedPanel.height; y++) {
                    let c = g.getColor(y);
                    for (let x = 0; x < LedPanel.width; x++) {
                        lp.setLed(f, c, x, y);
                    }
                }

                gnkspi.Show(lp.asString(), 0, -1);
            }
            break;

        case "txt":     // txt <text> <bg> <fg> <text> <bg> <fg>
            {
                if (process.argv.length < 9) {
                    Msg(`process.argv.length ${process.argv.length}  expected 7`);
                    break;
                }

                let lp = null;
                let f = 0;
                let arg = 3;

                let tx = [ process.argv[arg++] ];
                let bg = [ process.argv[arg++] ];
                let fg = [ process.argv[arg++] ];
                tx[1] = process.argv[arg++];
                bg[1] = process.argv[arg++];
                fg[1] = process.argv[arg++];

                //  assume 6x8 font
                let width = 6;
                let height = 8;

                lp = new LedPanel(1);

                for (let step = 0; step < 2; step++) {

                    for (let fr = 0; fr < 2; fr++) {

                        if (fr == 0) {
                            f = lp.addBaseFrame({ duration: 300 });
                        }
                        else {
                            f = lp.addTransitionFrame({ duration: 1, repeat: 200 });
                        }

                        // fill frame with bg color
                        lp.fillRect(f, bg);

                        // generate text
                        for (let i = 0; i < LedPanel.width / width; i++) {
                            let left = i * width;
                            let bottom = 0;
                            let code = tx[fr].charCodeAt(i);
                            let bitmap = getBitmap(font, code);

                            if (bitmap == null)
                                lp.fillRect(f, fg[fr], left, bottom, width, height);
                            else
                                lp.printChar(f, bg[fr], fg[fr], bitmap, left, bottom, width, height);
                        }
                    }

                    let t = tx[0]; tx[0] = tx[1]; tx[1] = t;
                    t = fg[0]; fg[0] = fg[1]; fg[1] = t;
                    t = bg[0]; bg[0] = bg[1]; bg[1] = t;
                }

                gnkspi.Show(lp.asString(), 0, -1);
            }
            break;

        default:
            Msg("Unknown command");
    }
}

// load default font
var font = new bdf();
font.loadSync("fonts/font6x8.bdf");
//Log(JSON.stringify(font));

function getBitmap(font: bdf, code: number): Array<Array<number>> {
    let g = font.glyphs[code];

    if (g == undefined)
        return null;

    return g.bitmap;
}

// detect hardware type
var hw = gnkspi.Get(0);
Msg(`Hardware: ${JSON.stringify(hw)}`); 

// print process.argv
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

var cmd = process.argv[2];
Msg(`Command: ${cmd}`);

switch (hw.hwType) {
    case 1:
        testLightStar(cmd);
        break;

    case 2:
        testLedPanel(cmd);
        break;
}