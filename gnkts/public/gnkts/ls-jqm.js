var ray = [
	[-8, 70, 8, 70, 8, 570, -8, 570], 
	[-25, 65, -11, 69, -91, 368, -105, 364], 
	[-41, 56, -29, 64, -279, 497, -291, 489], 
	[-54, 44, -44, 54, -220, 230, -230, 220], 
	[-64, 29, -56, 41, -419, 251, -427, 239], 
	[-69, 11, -65, 25, -306, 89, -310, 75],
	[25, 65, 11, 69, 91, 368, 105, 364],
	[41, 56, 29, 64, 279, 497, 291, 489],
	[54, 44, 44, 54, 220, 230, 230, 220],
	[64, 29, 56, 41, 419, 251, 427, 239],
	[69, 11, 65, 25, 306, 89, 310, 75]
];

var swatchName = "";

function drawSwatch(color) {
	var swatch = document.getElementById(swatchName);
	var ctx = swatch.getContext("2d");
	
	var w = swatch.width, // = swatch.clientWidth,
		h = swatch.height, // = swatch.clientHeight,
		c = w / 2,
		rI = 70,
		rO = 180;
	
/*	// frame	
	ctx.strokeStyle = "#C0C0C0";
	ctx.beginPath();
	ctx.moveTo(0,0);
	ctx.lineTo(0,h);
	ctx.lineTo(w,h);
	ctx.lineTo(w,0);
	ctx.lineTo(0,0);
	ctx.closePath();
	ctx.stroke();
*/	
	// base
	ctx.fillStyle = "#997300";
	ctx.strokeStyle = "#cc9900";
	ctx.lineWidth = 1;
	
	ctx.beginPath();
	ctx.arc(c, h, rO, Math.PI, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	
	ctx.fillStyle = "#808080";
	ctx.beginPath();
	ctx.arc(c, h, rI, Math.PI, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	
	// rays
	ctx.fillStyle = color;
	ctx.strokeStyle = "#C0C0C0";
	
	for (r = 0; r < 11; r++) {
		ctx.beginPath();
		ctx.moveTo(c + ray[r][0], h - ray[r][1]);
		ctx.lineTo(c + ray[r][2], h - ray[r][3]);
		ctx.lineTo(c + ray[r][4], h - ray[r][5]);
		ctx.lineTo(c + ray[r][6], h - ray[r][7]);
		ctx.lineTo(c + ray[r][0], h - ray[r][1]);
		ctx.closePath();
		ctx.fill();
//		ctx.stroke();
 	}
}

function change(value) {
	$.post("/light", { action: "change", color: value }, function (data, status) {
	});
}
function move(value) {
	$.post("/light", { action: "move", color: value }, function (data, status) {
	});
}
function stop(value) {
	$.post("/light", { action: "stop", color: value }, function (data, status) {
	});
}

function hexFromRGB(r, g, b) {
	var hex = [
		r.toString(16),
		g.toString(16),
		b.toString(16)
	];
	$.each(hex, function (nr, val) {
		if (val.length === 1) {
			hex[ nr ] = "0" + val;
		}
	});
	return hex.join("").toUpperCase();
}

function refreshSwatch() {
	var intensity = 100; //$("#intensity")value,
	var red = parseInt($("#red").val()) * intensity / 100;
	var green = parseInt($("#green").val()) * intensity / 100
	var blue = parseInt($("#blue").val()) * intensity / 100;
	var hex = hexFromRGB(Math.round(red), Math.round(green), Math.round(blue));
	var val = "#" + hex;
	drawSwatch(val);
	$("#value").val(val);
}

function setColor() {
	refreshSwatch();
	move($("#value").val());
	$("#curr-scene-name").html("<h3>Pick-a-Color</h3>");
}

function getScene() {
	$.post("/scene", { action: "get" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
		
		if (data.data.name == "")
			$("#curr-scene-name").html("<h3>Not playing</h3>");
		else
			$("#curr-scene-name").html("<h3>" + data.data.name + "</h3>");
	});
}

function stopScene() {
	$.post("/scene", { action: "stop" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
	
		$("#curr-scene-name").html("<h3>Not playing</h3>");
	});
}

function getSceneList() {
	$.post("/scene", { action: "list" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
		
		if (status === "success" && data.status === "success") {
			data.data.forEach(function (d) {
				var s = d.name; 
				if (s == undefined)
					s = d.file;
				$("#saved-scenes").append(
					'<li>' +
						'<a href="/home"  data-ajax="false" ' + 
						'onclick=setScene("' + d.file + '")>' + 
						s + '</a>' + 
					'</li>'
					).listview('refresh');
			});
		}
	});
}

function setScene(f) {
	console.log("setScene " + f);

	$.post("/scene", { action: "set", file: f }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
	});
}

$(document).on('pagechange', function (event, data) {
	swatchName = $('body').pagecontainer("getActivePage").attr("swatchId");
	
	refreshSwatch();
	
	$("#red").on("slidestop", function (event, ui) { setColor(); });
	$("#green").on("slidestop", function (event, ui) { setColor(); });
	$("#blue").on("slidestop", function (event, ui) { setColor(); });
});

$(function () {
	getSceneList();
	getScene();
});

