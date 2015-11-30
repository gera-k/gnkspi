// color conversions

class ColorUtil {

    static strToRgb(color: string, signed?: boolean): Array<number> {

        var rgb = [
            parseInt(color.substr(1, 2), 16),
            parseInt(color.substr(3, 2), 16),
            parseInt(color.substr(5, 2), 16)
        ];

        if (signed) {
            rgb.forEach(function (val, ind, arr) {
                if (val > 128)
                    arr[ind] = val - 256;
            });
        }
        return rgb;
    }

    static rgbToStr(rgb: Array<number>) {
        var str = "#";
        rgb.forEach(function (val) {
            if (val < 0)
                val += 256;
            var s = Math.round(val).toString(16);
            if (s.length === 1) {
                str += "0";
            }
            str += s;
        });
        return str;
    }

    static addStep(color: string, step: string): string {

        var rgb = this.strToRgb(color);
        var stp = this.strToRgb(step, true);

        return this.rgbToStr([
            rgb[0] + stp[0],
            rgb[1] + stp[1],
            rgb[2] + stp[2]
        ]);
    }
}

export = ColorUtil;