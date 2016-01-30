"use strict";

/* Show object format
    see also show stream format in Public.h
{
    "refresh": number,              // refresh interval in 10 ms units
    "frame": [                      // array of frames
        {                           //      frame object
            "format" : string,      //          format: "base", "update", "transition"
            "duration" : number,    //          step duration in refresh intervals
            "repeat" : number,      //          repeat count
            "row": [                //          array of rows, each row either object or array
                [                   //              array defining LEDs for row 0
                    string          //                  LED value in hex: [#]RRGGBB
                ],
                {                   //              object defining LEDs for row 1
                    string:         //                  LED range: DD or DD-DD
                    string,         //                  LED valie in hex
                    string: string,
                    ...
                },
                ...                 
            ]
        },
        {                           //      frame object
        }
    ]
}

*/

enum Format { base, update, transition };

interface Options {
    duration: number;
    repeat: number;
    rowCount?: number;
    ledCount?: number; 
}

class Show {
    defaultRowCount: number;
    defaultLedCount: number;

    defaultOptions: Options = {
        duration: 1,
        repeat: 1,
        rowCount: this.defaultRowCount,
        ledCount: this.defaultLedCount
    };

    protected show: {
        refresh: number,
        frame: Array<Object>
    };

    private newFrame(format: Format, options) {
        if (typeof options.duration === 'undefined')
            options.duration = 1;
        if (typeof options.repeat === 'undefined')
            options.repeat = 1;
        if (typeof options.rowCount === 'undefined')
            options.rowCount = this.defaultRowCount;
        if (typeof options.ledCount === 'undefined')
            options.ledCount = this.defaultLedCount;

        var frame = {
            "format": Format[format],
            "duration": options.duration,
            "repeat": options.repeat,
            "row": []
        };

        return frame;
    }

    // create empty show
    constructor(refresh: number) {
        this.show = { refresh: refresh, frame: [] };
    }

    get(): Object {
        return this.show;
    }

    asString(): string {
        return JSON.stringify(this.show);
    }

    getFrameCount(): number {
        return this.show.frame.length;
    }

    // add zero-filled base frame
    //  with rows formatted as array
    //  returns frame index
    addBaseFrame(options:Options = this.defaultOptions): number {

        var frame = this.newFrame(Format.base, options);

        for (var r = 0; r < options.rowCount; r++) {
            var row = Array<string>(options.ledCount);
            for (var l = 0; l < options.ledCount; l++)
                row[l] = "#000000";
            frame.row.push(row);
        }

        this.show.frame.push(frame);

        return this.show.frame.length - 1;
    }

    // add zero-filled update frame
    //  with rows formatted as array
    //  returns frame index
    addUpdateFrame(options: Options = this.defaultOptions): number {

        var frame = this.newFrame(Format.update, options);

        for (var r = 0; r < options.rowCount; r++) {
            var row = Array<string>(options.ledCount);
            for (var l = 0; l < options.ledCount; l++)
                row[l] = "#000000";
            frame.row.push(row);
        }

        this.show.frame.push(frame);

        return this.show.frame.length - 1;
    }

    // add zero-filled transition frame
    //  with rows formatted as array
    //  returns frame index
    addTransitionFrame(options: Options = this.defaultOptions): number {

        var frame = this.newFrame(Format.transition, options);

        for (var r = 0; r < options.rowCount; r++) {
            var row = Array<string>(options.ledCount);
            for (var l = 0; l < options.ledCount; l++)
                row[l] = "#000000";
            frame.row.push(row);
        }

        this.show.frame.push(frame);

        return this.show.frame.length - 1;
    }

    // add a frame filled with same led color
    //  led: led value
    //  option defaults:
    //      duration: 1
    //      repeat: 1
    //      rowCount: defaultRowCount
    //      ledCount: defaultLedCount
    addSingleColorFrame(led: string, options: Options = this.defaultOptions) {

        var frame = this.newFrame(Format.base, options);

        for (var r = 0; r < options.rowCount; r++) {
            var range = {};
            range[`0-${options.ledCount-1}`] = led;
            frame.row.push(range);
        }

        this.show.frame.push(frame);
    }
}

export = Show;
