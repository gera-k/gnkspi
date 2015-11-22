/* Show object format
    see also show stream format in Public.h
{
    "refresh": number,              // refresh interval in 10 ms units
    "frame": [                      // array of frames
        {                           //      frame object
            "format" : string,      //          format: "base", "transition"
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

enum Format { base, transition };

class Show {
    static defaultRowCount = 4;
    static defaultLedCount = 60;

    static defaulOptions = {
        duration: 1,
        repeat: 1,
        rowCount: Show.defaultRowCount,
        ledCount: Show.defaultLedCount
    };

    protected show: {
        refresh: number,
        frame: Array<Object>
    };

    private static newFrame(format: Format, options) {
        if (options.duration === null)
            options.duration = 1;
        if (options.repeat === null)
            options.repeat = 1;
        if (options.rowCount === null)
            options.rowCount = Show.defaultRowCount;
        if (options.ledCount === null)
            options.ledCount = Show.defaultLedCount;

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

    // add zero-filled base frame
    //  with rows formatted as array
    //  returns frame index
    addBaseFrame(options = Show.defaulOptions): number {

        var frame = Show.newFrame(Format.base, options);

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
    addTransitionFrame(options = Show.defaulOptions): number {

        var frame = Show.newFrame(Format.transition, options);

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
    addSingleColorFrame(led: string, options = Show.defaulOptions) {

        var frame = Show.newFrame(Format.base, options);

        for (var r = 0; r < options.rowCount; r++) {
            var range = {};
            range[`0-${options.ledCount-1}`] = led;
            frame.row.push(range);
        }

        this.show.frame.push(frame);
    }
}

export = Show;
