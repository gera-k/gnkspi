"use strict";

import fs = require('fs');

import GnkSpi = require('./GnkSpi');
import Show = require('./Show');
import LightStar = require('./LightStar');

var GnkDebug = false;
if (process.env.GNK_DEBUG === 'YES') {
    GnkDebug = true;
    console.log("Debug on");
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

// in-memory scenes
//  scenes are added to this object
//  when user selects Save in Scene Edit page.
//  The user-entered id is used as a key
//  therefore it must be unique. The id is also
//  duplicated into scene 'id' field.
var savedScenes: Object = {}

// structure of scene object
interface Scene {
    id: string;         // unique scene ID: name of file in FS or key in savedScenes 
    name: string;
    type: string;
    refresh?: number;
    edit?: boolean;
    param?: any;        // depends on type of scene
}

var currentScene: Scene = {
    id: "",
    name: "",
    type: ""
}

var showInProgress: boolean = false;
function showScene(s: Scene): void {

    if (showInProgress)
        return;

    showInProgress = true;

    Log(`Show scene: ${JSON.stringify(s)}`);

    new Promise(function (resolve, reject) {
        var ls = LightStar.playScene(s);
        var r = gnkspi.Show(ls.asString(), 0, -1);
        if (r >= 0)
            resolve(`success ${r}`);
        else
            reject(`error ${r}`);
    }).then(function (res) {
        Log(`Show complete: ${res}`);
        showInProgress = false;
    }, function (err) {
        Log(`Show error: ${err}`);
        showInProgress = false;
    });
}

function showCurrent(): void {
    showScene(currentScene);
}


// postScene
//  POST /scene handler
var postScene = function (req, res) {
    var cmd: Object = req.body;
    var ret = { status: "unknown", data: null };

    Log(`req: ${JSON.stringify(cmd)}`);

    var action = cmd["action"];
    var id = cmd["id"];
    var scene = cmd["scene"];

    if (typeof action == "string") {

        switch (action) {
            case "list":            // return list of saved scenes
                let list = new Array<Scene>(0);

                // first collect in-memory scenes
                for (var f in savedScenes) {
                    let f_scene = savedScenes[f];

                    list.push({
                        id: f,
                        name: `${f_scene["name"]}:${f}`,
                        type: f_scene["type"],
                        edit: f_scene["edit"]
                    });
                }

                // then read files from the 'show' folder
                try {
                    let dir = fs.readdirSync("./show");

                    dir.forEach((f: string) => {
                        Log(`File: ${f}`);

                        try {
                            let f_buf = fs.readFileSync(`./show/${f}`);
                            let f_str = f_buf.toString();
                            let f_scene = JSON.parse(f_str);

                            list.push({
                                id: f,
                                name: f_scene["name"],
                                type: f_scene["type"],
                                edit: f_scene["edit"]
                            });
                        }
                        catch (err) {
                            Log(`File ${f}: error ${err.message}`);
                        }
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

            case "get":             // get current scene
                ret.status = "success";
                ret.data = currentScene;
                break;

            case "set":             // set current scene from memory/file
                if (typeof id == "string") {
                    let f_show = null;

                    // try memory scenes first
                    if (savedScenes.hasOwnProperty(id)) {
                        f_show = savedScenes[id];
                    }
                    else
                    try {
                        Log(`File: ${id}`);

                        let f_buf = fs.readFileSync(`./show/${id}`);
                        let f_str = f_buf.toString();
                        f_show = JSON.parse(f_str);
                    }
                    catch (err) {
                        Msg(`Error: ${err.message}`);
                        ret.status = "error";
                        ret.data = err.message;
                    }

                    if (f_show != null) {
                        currentScene = {
                            id: id,
                            name: f_show["name"],
                            type: f_show["type"],
                            refresh: f_show["refresh"],
                            edit: f_show["edit"],
                            param: f_show["param"]
                        };

                        showCurrent();

                        ret.status = "success";
                        ret.data = {
                            id: currentScene.id,
                            name: currentScene.name,
                            type: currentScene.type,
                            edit: currentScene.edit
                        };
                    }
                }
                break;

            case "getScene":        // return current scene for editing
                ret.status = "success";
                ret.data = {
                    id: currentScene.id,
                    name: currentScene.name,
                    type: currentScene.type,
                    edit: currentScene.edit,
                    refresh: currentScene.refresh,
                    param: currentScene.param
                };
                break;

            case "updateScene":        // update current scene parameters to one received from client
                if (scene != null && scene.param != null) {
                    currentScene.param = scene.param;
                    showCurrent();
                }
                ret.status = "success";
                ret.data = {};
                break;

            case "saveScene":       // save scene to memory TODO: file
                if (scene != null) {
                    scene.id = id;
                    savedScenes[id] = scene;
                    currentScene = scene;
                    showCurrent();
                }
                ret.status = "success";
                ret.data = {};
                break;

            case "stop":
                gnkspi.Stop(0);
                ret.status = "success";
                currentScene = ret.data = {
                    id: "",
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
