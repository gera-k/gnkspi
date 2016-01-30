interface Glyph {
    name: string;
    bytes: Array<number>;
    bitmap: Array<Array<number>>;
    code: number;
    char: string;
    scalableWidthX: number;
    scalableWidthY: number;
    deviceWidthX: number;
    deviceWidthY: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    }
}

declare module "bdf" {

    class BDF {

        meta: {};
        glyphs: {
            [index: number]: Glyph;
        };

        loadSync(path: string): void;
    }

    export = BDF;
}
