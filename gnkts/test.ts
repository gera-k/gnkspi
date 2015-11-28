import GnkSpi = require('./GnkSpi');
import Show = require('./Show');
import LightStar = require('./LightStar');

var Rainbow = require('rainbowvis.js');

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

function strToRgb(color: string): Array<number> {
    return [
        parseInt(color.substr(1, 2),16),
        parseInt(color.substr(3, 2),16),
        parseInt(color.substr(5, 2),16)
    ];
}

function rgbToStr(rgb: Array<number>): string {
    var str = "#";
    rgb.forEach(function (val) {
        var s = Math.round(val).toString(16)
        if (s.length === 1) {
            str += "0";
        }
        str += s;
    });
    return str;
}

// print process.argv
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

Msg("Command: " + process.argv[2]);

switch (process.argv[2]) {
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

    case "ray":                // ray [<color> ...]
        if (process.argv.length < 3) {
            Msg(`process.argv.length ${process.argv.length}  expected 3 or more`);
            break;
        }

        arg = 3;
        var args = [];
        while (arg < process.argv.length)
            args.push(process.argv[arg++]);

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        var rainbow = new Rainbow();
        rainbow.setNumberRange(0, LightStar.rayCount - 1);
        if (args.length >= 2)
            rainbow.setSpectrum.apply(null, args);

        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                if (args.length == 1) {
                    ls.setLed(f, ray, led, args[0]);
                }
                else {
                    ls.setLed(f, ray, led, rainbow.colourAt(ray));
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "cir":                // cir [<color> ...]
        if (process.argv.length < 3) {
            Msg(`process.argv.length ${process.argv.length}  expected 3 or more`);
            break;
        }

        arg = 3;
        var args = [];
        while (arg < process.argv.length)
            args.push(process.argv[arg++]);

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        var rainbow = new Rainbow();
        rainbow.setNumberRange(0, LightStar.maxLedsPerRay - 1);
        if (args.length >= 2)
            rainbow.setSpectrum.apply(null, args);

        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                if (args.length == 1) {
                    ls.setLed(f, ray, led, args[0]);
                }
                else {
                    ls.setLed(f, ray, led, rainbow.colourAt(led));
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "rayg":                // rayg [<color> ...]
        if (process.argv.length < 3) {
            Msg(`process.argv.length ${process.argv.length}  expected 3 or more`);
            break;
        }

        arg = 3;
        var args = [];
        while (arg < process.argv.length)
            args.push(process.argv[arg++]);

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        var rainbow = new Rainbow();
        rainbow.setNumberRange(0, LightStar.maxLeds - 1);
        if (args.length >= 2)
            rainbow.setSpectrum.apply(null, args);

        var cnt = 0;
        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                if (args.length == 1) {
                    ls.setLed(f, ray, led, args[0]);
                }
                else {
                    ls.setLed(f, ray, led, rainbow.colourAt(cnt++));
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "cirg":                // cirg [<color> ...]
        if (process.argv.length < 3) {
            Msg(`process.argv.length ${process.argv.length}  expected 3 or more`);
            break;
        }

        arg = 3;
        var args = [];
        while (arg < process.argv.length)
            args.push(process.argv[arg++]);

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        var rainbow = new Rainbow();
        rainbow.setNumberRange(0, LightStar.maxLeds - 1);
        if (args.length >= 2)
            rainbow.setSpectrum.apply(null, args);

        var cnt = 0;
        for (var led = 0; led < LightStar.maxLedsPerRay; led++) {
            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                if (led < LightStar.ledCount[ray]) {
                    if (args.length == 1) {
                        ls.setLed(f, ray, led, args[0]);
                    }
                    else {
                        ls.setLed(f, ray, led, rainbow.colourAt(cnt++));
                    }
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "color":                // color <refresh> <color> [ <duration> <repeat> <diff> ] []
        if (process.argv.length < 5) {
            Msg(`process.argv.length ${process.argv.length}  expected 4`);
            break;
        }

        var ref = Number(process.argv[3]);
        var col = process.argv[4];
        var arg = 5;

        var ls = new LightStar(ref);
        var f = ls.addBaseFrame();

        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                ls.setLed(f, ray, led, col);
            }
        }

        while ((arg + 3) <= process.argv.length) {
            var dur = Number(process.argv[arg++]);
            var rep = Number(process.argv[arg++]);
            col = process.argv[arg++];

            f = ls.addTransitionFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null });

            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                    ls.setLed(f, ray, led, col);
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "ring":                 // ring <refresh> <color> [ <dur> <rep> <add> <sub>] 
        if (process.argv.length < 6) {
            Msg(`process.argv.length ${process.argv.length}  expected 6`);
            break;
        }

        var ref = Number(process.argv[3]);
        var srgb = strToRgb(process.argv[4]);
        var arg = 5;
        var mul = .95;

        var ls = new LightStar(ref);
        var f = ls.addBaseFrame();

        // fill base frame
        var rgb = srgb;
        for (var led = 0; led < 30; led++) {
            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                if (led < LightStar.ledCount[ray]) {
                    ls.setLed(f, ray, led, rgbToStr(rgb));
                }
            }
            //rgb.forEach((v: number, i: number, a: number[]) => { a[i] = v * mul });
        }

        var wl = 3;
        var inc = -wl + 1;
        var dec = -wl*2 + 1;

        // transitions
        while ((arg + 4) <= process.argv.length) {
            var dur = Number(process.argv[arg++]);
            var rep = Number(process.argv[arg++]);
            var add = process.argv[arg++];
            var sub = process.argv[arg++];

            for (var t = 0; t < (29 + wl * 2); t++) {
                f = ls.addTransitionFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null });

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

    case "stop":
        Msg('Stop:', gnkspi.Stop(0));
        break;

    default:
        Msg("Unknown command");
}
