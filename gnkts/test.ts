import GnkSpi = require('./GnkSpi');
import Show = require('./Show');
import LightStar = require('./LightStar');
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
        var g = new Gradient(LightStar.maxLeds, args);

        var cnt = 0;
        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                ls.setLed(f, ray, led, g.getColor(cnt++));
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "cir":                // cir repeat [<color> ...]
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
        var g = new Gradient(LightStar.maxLeds, args);

        var cnt = 0;
        for (var led = 0; led < LightStar.maxLedsPerRay; led++) {
            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                if (led < LightStar.ledCount[ray]) {
                    ls.setLed(f, ray, led, g.getColor(cnt++));
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "upd":                // upd <refresh> <color> [ <duration> <repeat> <diff> ] []
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

            f = ls.addUpdateFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null });

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
        var srgb = ColorUtil.strToRgb(process.argv[4]);
        var arg = 5;
        var mul = .95;

        var ls = new LightStar(ref);
        var f = ls.addBaseFrame();

        // fill base frame
        var rgb = srgb;
        for (var led = 0; led < 30; led++) {
            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                if (led < LightStar.ledCount[ray]) {
                    ls.setLed(f, ray, led, ColorUtil.rgbToStr(rgb));
                }
            }
            //rgb.forEach((v: number, i: number, a: number[]) => { a[i] = v * mul });
        }

        var wl = 3;
        var inc = -wl + 1;
        var dec = -wl*2 + 1;

        // updates
        while ((arg + 4) <= process.argv.length) {
            var dur = Number(process.argv[arg++]);
            var rep = Number(process.argv[arg++]);
            var add = process.argv[arg++];
            var sub = process.argv[arg++];

            for (var t = 0; t < (29 + wl * 2); t++) {
                f = ls.addUpdateFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null });

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

    case "grad":                        // grad <speed> <repeat> <color> [<color> ...]
        if (process.argv.length < 7) {
            Msg(`process.argv.length ${process.argv.length}  expected 7`);
            break;
        }

        if (speed < 1)
            speed = 1;
        if (speed > 100)
            speed = 100;
        speed--;

        var args = [];
        var speed = Number(process.argv[3]);
        var repeat = Number(process.argv[4]);
        while (repeat-- > 0) {
            arg = 5;
            while (arg < process.argv.length)
                args.push(process.argv[arg++]);
        }

        var refresh = 10 - Math.floor(speed/10);
        var steps = 30;
        var duration = 10 - Math.floor(speed%10);
        var repeat = 1;

        Msg(`refresh: ${refresh}  steps: ${steps}  duration: ${duration}  repeat ${repeat}`);

        var ls = new LightStar(refresh);
        var g = new Gradient(steps * repeat, args);

        // base frame
        var cnt = 0;
        var f = ls.addBaseFrame();
        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                ls.setLed(f, ray, led, g.getColor(cnt));
            }
        }

        while (++cnt < steps) {
            f = ls.addUpdateFrame({ duration: duration, repeat: repeat, rowCount: null, ledCount: null });

            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                    ls.setLed(f, ray, led, g.getStep(cnt));
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

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
