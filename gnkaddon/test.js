// test.js
//var addon = require('../Debug/GnkSpiAddon');
//var addon = require('../Release/GnkSpiAddon');
var addon = require('./GnkSpiAddon');

var show0 = {
  "refresh" : 10,
  "frame" : [
    {
      "format" : "base",
      "duration" : 1,
      "repeat" : 1,
      "row" : [
        [ "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000" ],
        [ "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000" ],
        [ "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000" ],
        [ "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000" ]
      ]
    },
    {
      "format" : "update",
      "duration" : 1,
      "repeat" : 255,
      "row" : [
        [ "#000100", "#010000", "#000001", "#000100", "#010000", "#000001", "#000100", "#010000", "#000001" ],
        [ "#000001", "#000100", "#010000", "#000001", "#000100", "#010000", "#000001", "#000100", "#010000" ],
        [ "#010000", "#000001", "#000100", "#010000", "#000001", "#000100", "#010000", "#000001", "#000100" ],
        [ "#010101", "#010101", "#010101", "#010101", "#010101", "#010101", "#010101", "#010101", "#010101" ]
      ]
    },
    {
      "format" : "update",
      "duration" : 1,
      "repeat" : 255,
      "row" : [
        [ "#00FF00", "#FF0000", "#0000FF", "#00FF00", "#FF0000", "#0000FF", "#00FF00", "#FF0000", "#0000FF" ],
        [ "#0000FF", "#00FF00", "#FF0000", "#0000FF", "#00FF00", "#FF0000", "#0000FF", "#00FF00", "#FF0000" ],
        [ "#FF0000", "#0000FF", "#00FF00", "#FF0000", "#0000FF", "#00FF00", "#FF0000", "#0000FF", "#00FF00" ],
        [ "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF" ]
      ]
    }
  ]
}

var show1 = {
  "refresh" : 10,
  "frame" : [
    {
      "format" : "base",
      "duration" : 2,
      "repeat" : 1,
      "row" : [
        { "0-19" : "#400000", "20-39" : "#004000", "40-59": "#000040" },
        { "0-19" : "#004000", "20-39" : "#000040", "40-59": "#400000" },
        { "0-19" : "#000040", "20-39" : "#400000", "40-59": "#004000" },
        { "0-59" : "#333333" }
      ]
    }
  ]
}

var show2 = {
    "refresh": 10,
    "frame": [
        {
            "format": "base",
            "duration": 1,
            "repeat": 1,
            "row": [
                { "0-59": "#a83131" },
                { "0-59": "#a83131" },
                { "0-59": "#a83131" },
                { "0-59": "#a83131" }
            ]
        }
    ]
}

// print process.argv
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);

    if (val == 'show0')
        console.log('Show0:', addon.show(JSON.stringify(show0), 0, 0));

    if (val == 'show1')
        console.log('Show1:', addon.show(JSON.stringify(show1), 0, 1));

    if (val == 'show2')
        console.log('Show2:', addon.show(JSON.stringify(show2), 0, 0));

    if (val == 'stop')
        console.log('Stop:', addon.stop(0));

    if (val == 'get')
        console.log('Get:', addon.get(0));
});


