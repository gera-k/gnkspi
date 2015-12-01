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
        var g = new Gradient(LightStar.rayCount, args);

        var cnt = 0;
        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            ls.setRay(f, ray, g.getColor(cnt++));
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

            f = ls.addUpdateFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null });
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

            ls.setFrame(ls.addTransitionFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null }), col);
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "wave": {      // wave <refresh> <bcolor> <wcolor> <wspeed> <wlen> [<rlen> [<flen>]]
        if (process.argv.length < 8) {
            Msg(`process.argv.length ${process.argv.length}  expected 8 or more`);
            break;
        }

        var arg = 3;
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
        for (var w = 0; w < wmax; w++) {
            var f = ls.addTransitionFrame({ duration: dur, repeat: rep, rowCount: null, ledCount: null })

            for (var r = 0; r < LightStar.rayCount; r++) {
                for (var l = 0; l < LightStar.ledCount[r]; l++) {
                    if (l <= w && l > w - rlen) // rasing edge
                        ls.setLed(f, r, l, rg.getColor(w - l));
                    else if (l <= w - rlen && l > w - rlen - wlen)  // wave
                        ls.setLed(f, r, l, wcol);
                    else if (l <= w - rlen - wlen && l > w - rlen - wlen - flen) // falling edge
                        ls.setLed(f, r, l, fg.getColor(w - rlen - wlen - l));
                    else
                        ls.setLed(f, r, l, bcol);
                }
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

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
