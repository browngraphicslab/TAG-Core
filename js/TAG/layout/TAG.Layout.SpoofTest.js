TAG.Util.makeNamespace("TAG.Layout.SpoofTest");

/*
    Spoof server
*/
TAG.Layout.SpoofTest = (function () {
	"use strict";

	var root = $("#tagRoot")
	var base = $(document.createElement("div"))
	var laurs,
		sortDiv = $(document.createElement("div")),
		searchBox = $(document.createElement("input")),
		searchButton = $(document.createElement("button")),
		NOBEL_ORANGE_COLOR = '#d99b3b',
		scroller = $(document.createElement("div"))

	root.append(base)
	base.append(sortDiv)
	sortDiv.append(searchBox)
	sortDiv.append(searchButton)
	base.css({
		"position": "absolute",
		"width": "100%",
		"height": "100%",
		"background-color" : "rgb(50,50,50)"
	}).append(scroller)

	TAG.Layout.Spoof().getLaureates(init)

	function init(db) {
		$(document).unbind();
		$("#splashScreenRoot").die()
		$("#splashScreenRoot").remove()

		sortDiv.css({
			"position": "absolute",
			"width": "100%",
			"height": "15%",
			"top": "0%",
			"left": "0%",
		})
		searchBox.css({
			"width": "250px",
			"height": "35px",
			"top": "200px",
			"right": "100px",
			"border": "2.5px solid " + NOBEL_ORANGE_COLOR,
			"border-radius" : "12px",
			"position" : "absolute"
		}).keyup(function (e) {
			if (e.keycode === 13) {
				search(searchBox[0].value.toLowerCase())
				e.stopPropogation()
			}
		})
		searchButton.css({
			"width": "50px",
			"height": "50px",
			"top": "100px",
			"right": "100px",
			"border": "2.5px solid " + NOBEL_ORANGE_COLOR,
			"border-radius": "12px",
			"position": "absolute"
		}).click(function () { search(searchBox[0].value.toLowerCase())}).text("search")
		laurs = db
		scroller.css({
			"overflow-x": "scroll",
			"overflow-y": "hidden",
			"width": "100%",
			"height": "73%",
			"top": "27%",
			"position": "absolute",
			"background-color" : "transparent"
		})

		for(var i=0;i<laurs.length/5;i++){
			var laur = laurs[i];
			makeBlock(laur,i);
		}
		$(document).unbind()
		$("#root").unbind()
		$("#tagContainer").unbind()
		$("#tagRoot").unbind()
		root.unbind()
	}
	function makeBlock(laur, i) {
		var block = $(document.createElement("div"))
		var img = $(document.createElement("img"))
		var header = $(document.createElement("div"))
		var nameDiv = $(document.createElement("div"))
		var firstNameDiv = $(document.createElement("div"))
		var prizeAndYearDiv = $(document.createElement("div"))

		block.append(img)
		block.append(header)
		header.append(firstNameDiv)
		header.append(nameDiv)
		header.append(prizeAndYearDiv)
		scroller.append(block)

		block.css({
			"position": "absolute",
			"width": "205px",
			"height" : "205px",
			"top": i % 3 * 255 + "px",
			"left": Math.floor(i / 3) * 240 + 15+"px",
			"overflow": "hidden",
			"box-shadow": "3px 8px 17px 4px #000"
		}).addClass("block")
		block.click(function () { makeBigPopup(laur) })

		var css = {
			"position": "relative",
			"width": "75%",
			"float": "right",
			"font-size": ".725em",
			"overflow": "hidden",
			"color" : "white",
			"right": "0%",
			"text-align": "left",
		}

		nameDiv.css(css).text(laur.Metadata.LastName)
		prizeAndYearDiv.css(css).text(laur.Metadata.PrizeCategory.toUpperCase()+" "+laur.Metadata.Year)
		firstNameDiv.css(css).text(laur.Metadata.FirstName)

		var prizecolor = "rgba(30,30,30,.55)"
		switch (laur.Metadata.PrizeCategory.toLowerCase()) {
			case "economics":
				prizecolor = 'rgba(91, 75, 34, 0.8)'
				break;
			case "peace":
				prizecolor = 'rgba(0, 98, 144, 0.8)'
				break;
			case "medicine":
				prizecolor = 'rgba(60, 62, 111, 0.8)'
				break;
			case "literature":
				prizecolor = 'rgba(198, 121, 28, 0.8)'
				break;
			case "chemistry":
				prizecolor = 'rgba(153, 0, 53, 0.8)'
				break;
			case "physics":
				prizecolor = 'rgba(163, 168, 73, 0.8)'
				break;
		}

		var searchString = ""

		var keys = Object.keys(laur.Metadata)
		for (var k = 0; k < keys.length; k++) {
			block.addClass(laur.Metadata[keys[k]])
		}

		function addToString(obj) {
			var type = $.type(obj)
			if (type === "string") {
				searchString+=obj.toLowerCase()
			}
			else if (type === "object") {
				keys = Object.keys(obj)
				for (var k = 0; k < keys.length; k++) {
					addToString(obj[keys[k]])
				}
			}
		}
		addToString(laur)

		header.css({
			"position": "absolute",
			"width": "100%",
			"min-height": "50px",
			"font-size": ".5em",
			"text-align": "right",
			"background-color" : prizecolor
		})

		img.css({
			"position": "absolute",
			"width": "100%",
			"height" : "auto"
		}).attr({ src: laur.Metadata.Thumbnail.FilePath })

		laur.block = block
		laur.searchString = searchString
	}
	function arrangeTiles(tiles) {
		for (var tile = 0; tile < tiles.length; tile++) {
			var t = tiles[tile]
			t.style.top = tile % 3 * 255 + "px"
			t.style.left = Math.floor(tile / 3) * 240 + 15 + "px"
		}
	}
	function search(s) {
		var blocks = []
		$(".block").hide()
		laurs.forEach(function(laur){
			if (laur.searchString.indexOf(s) !== -1 && blocks.indexOf(laur.block[0])===-1) {
				blocks.push(laur.block[0])
				laur.block.show()
			}
		})
		arrangeTiles(blocks)
		blocks.forEach(function (block) { $(block).show()})
	}
	function sort(tags) {
		$(".block").hide()
		tags.forEach(function (tag) {
			$("."+tag).show()
		})
		var tiles = []
		$(".block").toArray().forEach(function (b) {
			if (b.style.display !== "none") {
				tiles.push(b);
			}
		})
		arrangeTiles(tiles);
	}
	function reset() {
		$(".block").show()
		arrangeTiles($(".block").toArray())
	}
	function makeBigPopup(laur) {
		var overlay = $(document.createElement("div")).attr({ id: "overlay" });
		var popup = $(document.createElement("div")).attr({ id: "popup" });
		var img = $(document.createElement("img")).attr({ src: laur.Metadata.FullImage.FilePath })
		var imgwrapper = $(document.createElement("div"))

		base.append(overlay);
		base.append(popup)
		popup.append(imgwrapper)
		imgwrapper.append(img)

		popup.css({
			"position": "absolute",
			"width": "75%",
			"height": "85%",
			"left": "12.5%",
			"top": "7.5%",
			"background-color": "black",
			'border': '2px solid ' + NOBEL_ORANGE_COLOR,
			'border-radius': '12px',
			"overflow" : "hidden"
		})

		imgwrapper.css({
			"width": "45%",
			"height": "90%",
			"top": "5%",
			"left" : "2.5%",
			"position": "absolute",
			"overflow" : "hidden",
		})

		img.css({
			"position": "absolute",
			"width": "100%",
			"height": "auto",
		})

		overlay.css({
			"position": "absolute",
			"width": "100%",
			"height": "100%",
			"background-color": "rgba(111,111,111,.65)"
		}).click(hide)

		function hide() {
			$("#popup").hide()
			$("#overlay").hide()
			$("#popup").die()
			$("#overlay").die()
			$("#popup").remove()
			$("#overlay").remove()
		}
	}
	function makePrizeKeyword() {

	}
})