import ColorUtil = require('./ColorUtil');

function interpolate(range: number, position: number, count: number) {
    return Math.round(range * position / count);
}

// Color gradient
class Gradient {
    private color: Array<string>;
    private step: Array<string>;

    // start - start color in #XXXXXX format - color at gradient point 0
    // end - gradient color at gradient point <count>
    // count - number of gradient steps
    constructor(count: number, color: string[]) {

        if (color.length == 0)
            throw new RangeError("Must be at least one color");

        var gNum = color.length - 1;    // number of gradients

        if (gNum == 0) {
            color.push(color[0]);
            gNum++;
        }

        var gCount = 0;              

        this.color = new Array<string>(0);
        this.step = new Array<string>(0);

        this.color.push(color[0]);
        var lastColor = color[0];
        for (var gInd = 0; gInd < gNum; gInd++) {

            var st = ColorUtil.strToRgb(color[gInd]);
            var en = ColorUtil.strToRgb(color[gInd + 1]);

            var cnt = interpolate(count, gInd+1, gNum) - gCount;
            gCount += cnt;

            var sR = this.calcGradient(en[0] - st[0], cnt);
            var sG = this.calcGradient(en[1] - st[1], cnt);
            var sB = this.calcGradient(en[2] - st[2], cnt);

            for (var s = 0; s < cnt; s++) {
                var step = ColorUtil.rgbToStr([sR[s], sG[s], sB[s]]);
                this.step.push(step);
                lastColor = ColorUtil.addStep(lastColor, step);
                this.color.push(lastColor);
            }
        }
    }

    static isGrad(color: string): boolean {
        return color.substr(0, 4) == "grad";
    }

    static new(count: number, grad: string): Gradient {

        var arg: string[] = [];

        var s = grad.split(" ");
        if (s.shift() != "grad")
            return null;

        var rep = Number(s.shift());

        while (rep-- > 0) {
            s.forEach(c => {
                arg.push(c);
            });
        }

        return new Gradient(count, arg);
    }

    getStepCount(): number {
        return this.step.length; 
    }

    getStep(s: number): string {
        if (s >= this.step.length)
            throw new RangeError("Gradient step index is out of range");
        
        return this.step[s];
    }

    getColor(s: number): string {
        if (s >= this.color.length)
            throw new RangeError("Gradient color index is out of range");

        return this.color[s];       
    }

    private calcGradient(range: number, count: number): Array<number> {

        var steps = new Array<number>(count),
            c = 0;

        for (var s = 0; s < count; s++) {
            var d = interpolate(range, s + 1, count) - c;
            steps[s] = d;
            c += d;
        }

        return steps;
    }
}

export = Gradient;
