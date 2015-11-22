import GnkSpi = require('./GnkSpi');
import Show = require('./Show');
import LightStar = require('./LightStar');

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

// print process.argv
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
});

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

switch (process.argv[2]) {
    case "set":                 // set <ray> <led> color
        Msg("set LED");
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

    case "rays":                // rays <color> [<color> ...]
        Msg("rays");
        if (process.argv.length < 4) {
            Msg(`process.argv.length ${process.argv.length}  expected 4`);
            break;
        }

        var arg = 3;
        var col = process.argv[arg++];

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        for (var ray = 0; ray < LightStar.rayCount; ray++) {
            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                ls.setLed(f, ray, led, col);
            }

            if (arg >= process.argv.length)
                arg = 3;
            col = process.argv[arg++];
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;


    case "circles":                // circles <color> [<color> ...]
        Msg("circles");
        if (process.argv.length < 4) {
            Msg(`process.argv.length ${process.argv.length}  expected 4`);
            break;
        }

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        for (var ray = 0; ray < LightStar.rayCount; ray++) {

            var arg = 3;
            var col = process.argv[arg++];

            for (var led = 0; led < LightStar.ledCount[ray]; led++) {
                ls.setLed(f, ray, led, col);

                if (arg >= process.argv.length)
                    arg = 3;
                col = process.argv[arg++];
            }
        }

        gnkspi.Show(ls.asString(), 0, -1);

        break;

    case "fill":                // fill <color>
        Msg("fill");
        if (process.argv.length < 4) {
            Msg(`process.argv.length ${process.argv.length}  expected 4`);
            break;
        }

        var ls = new LightStar(10);
        var f = ls.addBaseFrame();

        for (var led = 0; led < 30; led++) {
            for (var ray = 0; ray < LightStar.rayCount; ray++) {
                if (led < LightStar.ledCount[ray]) {
                    ls.setLed(f, ray, led, process.argv[3]);
                    gnkspi.Show(ls.asString(), 0, -1);
                    delay(50);
                }
            }
        }

        break;

    case "show":                // tran <refresh> <color> [ <duration> <repeat> <diff> ] []

        Msg("show");
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

    case "ring":                 // ring <refresh> <color> [ <duration> <repeat> <diff> ] 

        Msg("show");
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
            rgb.forEach((v: number, i: number, a: number[]) => { a[i] = v * mul });
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
        console.log('Stop:', gnkspi.Stop(0));
        break;
}
