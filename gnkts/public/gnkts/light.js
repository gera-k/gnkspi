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
	$("#swatch").css("background-color", val);
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
	$("#header").fitText(1.5);
	$("#value").fitText(.7);
});
