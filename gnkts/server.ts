"use strict";

import GnkSpi = require('./GnkSpi');
import Show = require('./Show');

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

//Log(`Stop: ${gnkspi.Stop(0) }`);


import express = require('express');
import path = require('path');
import morgan = require('morgan');
import bodyParser = require('body-parser');

var app = express();
app.set('port', process.env.PORT || 1337);
app.set('views', './views');

if (GnkDebug) {
    app.use(morgan('short'));
}
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public/'));

var lightGet = function (req, res) {
};

var lightSetActive = false;
var lightSet = function (req, res) {
    if (lightSetActive) {
        res.json({ status: "active" });
        return;
    }

    var cmd: Object = req.body;

    Log(`req: ${JSON.stringify(cmd) }`);

    var device = 0;
    var property = -1;
    var action = cmd["action"];
    var color = cmd["color"];

    if (typeof action == "string") {

        switch (action) {
        case "stop":
            gnkspi.Stop(device);
            break;
        case "change":
            property = 0;
        case "move":
            if (typeof color == "string") {
                lightSetActive = true;
                var startShow = new Promise(function (resolve, reject) {
                    var show = new Show(10);
                    show.addSingleColorFrame(cmd["color"]);
                    var s = show.asString();
                    Log(s);
                    gnkspi.Show(s, device, property);
                    setTimeout( () => { resolve(); }, 50);
                });

                startShow.then(
                    () => { lightSetActive = false },
                    () => { lightSetActive = false }
                );
            }
            break;
        }
    }

    res.json({ status: "complete" });
}

app.get('/', lightGet)
app.post('/light', lightSet);

var server = app.listen(app.get('port'), function () {
    Msg(`Express server listening on port ${server.address().port}`);
});
