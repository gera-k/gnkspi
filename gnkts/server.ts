"use strict";

import fs = require('fs');

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

//Log(`Stop: ${gnkspi.Stop(0) }`);


import express = require('express');
import path = require('path');
import morgan = require('morgan');
import bodyParser = require('body-parser');

var app = express();
app.set('port', process.env.PORT || 1337);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

if (GnkDebug) {
    app.use(morgan('short'));
}
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static('public/'));

var homePage = function (req, res) {
    res.render('home', { title: 'LightStar', pretty: true });
};

app.get('/', homePage);
app.get('/home', homePage);

var colorPage = function (req, res) {
    res.render('color', { title: 'Pick a Color' });
};

app.get('/color', colorPage);

var lightSetActive = false;
var postLight = function (req, res) {
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

app.post('/light', postLight);

interface Scene {
    file: string;
    name: string;
    type: string;
}

var currentScene: Scene = {
    file: "",
    name: "",
    type: ""
}

var postScene = function (req, res) {
    var cmd: Object = req.body;
    var ret = { status: "unknown", data: null };

    Log(`req: ${JSON.stringify(cmd)}`);

    var action = cmd["action"];
    var file = cmd["file"];

    if (typeof action == "string") {

        switch (action) {
            case "list":
                try {
                    let dir = fs.readdirSync("./show");
                    let list = new Array<Scene>(0);

                    dir.forEach((f: string) => {
                        Msg(`File: ${f}`);

                        let f_buf = fs.readFileSync(`./show/${f}`);
                        let f_str = f_buf.toString();
                        let f_show = JSON.parse(f_str);

                        list.push({
                            file: f,
                            name: f_show["name"],
                            type: f_show["type"]
                        });
                    });

                    ret.status = "success";
                    ret.data = list;
                }
                catch (err) {
                    Msg(`Error: ${err.message}`);
                    ret.status = "error";
                    ret.data = err.message;
                }
                break;

            case "get":
                ret.status = "success";
                ret.data = currentScene;
                break;

            case "set":
                if (typeof file == "string") {
                    try {
                        Msg(`File: ${file}`);

                        let f_buf = fs.readFileSync(`./show/${file}`);
                        let f_str = f_buf.toString();
                        let f_show = JSON.parse(f_str);

                        ret.status = "success";
                        currentScene = ret.data = {
                            file: file,
                            name: f_show["name"],
                            type: f_show["type"]
                        };

                        var playShow = new Promise(function (resolve, reject) {
                            var ls = LightStar.playScene(f_show);
                            Msg(`Total: ${ls.getFrameCount()} frames`);
                            gnkspi.Show(ls.asString(), 0, -1);
                        });
                    }
                    catch (err) {
                        Msg(`Error: ${err.message}`);
                        ret.status = "error";
                        ret.data = err.message;
                    }
                }
                break;

            case "stop":
                gnkspi.Stop(0);
                ret.status = "success";
                currentScene = ret.data = {
                    file: "",
                    name: "",
                    type: ""
                };
                break;
        }
    }

    res.json(ret);
}

app.post('/scene', postScene);

// catch request not yet handled and forward to error handler
app.use((req: express.Request, res: express.Response, next: Function): any => {
    var err = new Error(`Not Found: ${req.originalUrl}`);
    err["status"] = 404;
    next(err);
});

if (GnkDebug) {
    // development error handler
    // will print stacktrace
    app.use((err: any, req: express.Request, res: express.Response, next: Function): any => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use((err: any, req: express.Request, res: express.Response, next: Function): any => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

var server = app.listen(app.get('port'), function () {
    Msg(`Express server listening on port ${server.address().port}`);
});
