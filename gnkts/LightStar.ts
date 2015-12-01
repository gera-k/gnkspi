import Show = require('./Show');

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

        var f = this.show.frame[frame];
        var rl = LightStar.getRowLed(ray, 0);
        var r = f['row'][rl.r];
        if (Array.isArray(r)) {
            for (var l = 0; l < LightStar.ledCount[ray]; l++)
                r[rl.l + l] = color;
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
}

export = LightStar;
