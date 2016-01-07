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

// swatch name on current page
var swatchName = "";

// currently selected scene
var currScene = null;

function drawSwatch() {
	var swatch = document.getElementById(swatchName);
	
	if (swatch == null)
		return;

	var ctx = swatch.getContext("2d");
	var color = "#000000";
	var w = swatch.width,
		h = swatch.height,
		c = w / 2,
		rI = 70,
		rO = 180;
	
	if (currScene != null && currScene.type === "color") {
		color = currScene.param.color;
	}
	
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
		ctx.stroke();
 	}
}

function hexFromRGB(r, g, b) {
	var hex = [
		r.toString(16),
		g.toString(16),
		b.toString(16)
	];
	$.each(hex, function (nr, val) {
		if (val.length === 1) {
			hex[nr] = "0" + val;
		}
	});
	return hex.join("").toUpperCase();
}

function hexToRgb(hex) {
	return [
		parseInt(hex.substr(1, 2), 16),
		parseInt(hex.substr(3, 2), 16),
		parseInt(hex.substr(5, 2), 16)
	];
}

// getSceneList
//	request scene list from the server and refill the select-scene popup
function getSceneList() {
	$.post("/scene", { action: "list" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
		
		if (status === "success" && data.status === "success") {
			$("#saved-scenes").empty();
			data.data.forEach(function (d) {
				var s = d.name;
				if (s == undefined)
					s = d.id;
				$("#saved-scenes").append(
					'<li>' +
						'<a href="#home" ' + 
						'onclick=setScene("' + d.id + '")>' + 
						s + '</a>' + 
					'</li>'
				).listview('refresh');
			});
		}
	});
}

// getScene
//	request currently playing scene from the server
//	and setup UI elements accordingly
function getScene() {
	$.post("/scene", { action: "get" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
		currScene = data.data;
		
		if (currScene.name == "") {
			$("#curr-scene-name").html("<h3>Not playing</h3>");
			$("#edit-button").button("disable");
			$("#stop-button").button("disable");
		}
		else {
			$("#curr-scene-name").html("<h3>" + currScene.name + "</h3>");
			if (currScene.edit)
				$("#edit-button").button("enable");
			else
				$("#edit-button").button("disable");
			$("#stop-button").button("enable");

			switch (currScene.type) {
				case "color":
					setColor();
					break;
			} 
		}
	});
}

// stopScene
//	tell the server to stop playing the current scene
//	clear UI elements
function stopScene() {
	$.post("/scene", { action: "stop" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
	});
	
	$("#curr-scene-name").html("<h3>Not playing</h3>");
	$("#edit-button").button("disable");
	$("#stop-button").button("disable");
}

// setScene
//	tell the server to start playing saved scene 
//	defined by scene id
function setScene(f) {
	console.log("setScene " + f);
	
	$.post("/scene", { action: "set", id: f }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
	});
}

// start editing the current scene
function editScene() {
	$.post("/scene", { action: "getScene" }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
		
		if (status === "success" && data.status === "success") {
			currScene = data.data;

			switch (currScene.type) {
				case "color":
					$('body').pagecontainer("change", "#color");
					break;
			}
		}
	});
}

// saveScene
//	save scene after edit
function saveScene() {
	var id = $("#scene-id").val();

	$.post("/scene", { action: "saveScene", id: id, scene: currScene }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
		
		if (status !== "success") {
			console.log("saveScene error " + data.data);
		}
	});
}

// setColor
//	set values of color scene editor UI
//	from currScene.param
function setColor() {
	var val = currScene.param.color;
	var rgb = hexToRgb(val);
	
	$("#red").val(rgb[0]).slider("refresh");
	$("#green").val(rgb[1]).slider("refresh")
	$("#blue").val(rgb[2]).slider("refresh");
	
	// update UI
	drawSwatch();
	$("#value").html("<h3>" + val + "</h3>");
}

// saveColor
//	called every time the user changes color
function saveColor() {
	
	// read sliders and convert to RGB
	var intensity = 100; //$("#intensity")value,
	var red = parseInt($("#red").val()) * intensity / 100;
	var green = parseInt($("#green").val()) * intensity / 100
	var blue = parseInt($("#blue").val()) * intensity / 100;
	var hex = hexFromRGB(Math.round(red), Math.round(green), Math.round(blue));
	var val = "#" + hex;
	
	// update current scene and post it to server
	currScene.param.color = val;
	$.post("/scene", { action: "updateScene", scene: currScene }, function (data, status) {
		console.log("status=" + status + "  data= " + JSON.stringify(data));
	});
	
	// update UI
	drawSwatch();
	$("#value").html("<h3>" + val + "</h3>");
}

// pagechange event handler
//	called when new page finishes loading
$(document).on('pagechange', function (event, data) {
	swatchName = $('body').pagecontainer("getActivePage").attr("swatchId");
	
	drawSwatch();
	
	$("#red").on("slidestop", function (event, ui) { saveColor(); });
	$("#green").on("slidestop", function (event, ui) { saveColor(); });
	$("#blue").on("slidestop", function (event, ui) { saveColor(); });
	
	$("#edit-button").button({
		enhanced: true
	});
	$("#stop-button").button({
		enhanced: true
	});
	
	getScene();
});

