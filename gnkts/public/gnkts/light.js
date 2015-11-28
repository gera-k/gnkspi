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

function drawSwatch(color) {
	var swatch = document.getElementById("swatch");
	var ctx = swatch.getContext("2d");
	
	var w = swatch.width,	//clientWidth,
		h = swatch.height,	//clientHeight,
		u = h / 600,
		c = w / 2,
		rI = 70 * u,
		rO = 180 * u;

	// frame	
/*
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
	// Draw the base
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

	ctx.fillStyle = color;
	ctx.strokeStyle = "#C0C0C0";
	
	for (r = 0; r < 11; r++) {
		ctx.beginPath();
		ctx.moveTo(c + ray[r][0] * u, h - ray[r][1] * u);
		ctx.lineTo(c + ray[r][2] * u, h - ray[r][3] * u);
		ctx.lineTo(c + ray[r][4] * u, h - ray[r][5] * u);
		ctx.lineTo(c + ray[r][6] * u, h - ray[r][7] * u);
		ctx.lineTo(c + ray[r][0] * u, h - ray[r][1] * u);
		ctx.closePath();
		ctx.fill();
//		ctx.stroke();
	}
}

function change(value) {
	$.post("/light", { action: "change", color: value }, function (data, status) {
//			alert(status);
	});
}
function move(value) {
	$.post("/light", { action: "move", color: value }, function (data, status) {
//			alert(status);
	});
}
function stop(value) {
	$.post("/light", { action: "stop", color: value }, function (data, status) {
//			alert(status);
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
	var intensity = $("#intensity").slider("value"),
		red = $("#red").slider("value") * intensity / 100,
		green = $("#green").slider("value") * intensity / 100,
		blue = $("#blue").slider("value") * intensity / 100,
		hex = hexFromRGB(Math.round(red), Math.round(green), Math.round(blue)),
		val = "#" + hex;
//	$("#swatch").css("background-color", val);
	drawSwatch(val);
	$("#value").val(val);
	move(val);
}

$(function () {
	$("#color-pick").resizable();
	$("#red, #green, #blue, #intensity").slider({
		orientation: "horizontal",
		range: "min",
		max: 255,
		value: 127,
		slide: refreshSwatch,
		change: refreshSwatch
	});
	$("#intensity").slider({ max: 100, value: 100 });
	refreshSwatch();
	$("#value").fitText(.7);
});
