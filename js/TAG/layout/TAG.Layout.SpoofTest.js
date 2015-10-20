TAG.Util.makeNamespace("TAG.Layout.SpoofTest");

/*
    Spoof server
*/
TAG.Layout.SpoofTest = (function () {
	"use strict";

    //OPTIONS
	var IDLE_TIMER_TIME = 45 //IN SECONDS

	var SANDBOX_NEW_UI = true

    var SQUISH_FACTOR = SANDBOX_NEW_UI ? 30 : 0
    var LAUR_WIDTH_REDUCITON = SANDBOX_NEW_UI ? 5 : 0
    var HORIZ_SPACING_CONSTANT = SANDBOX_NEW_UI ? 40 : 25

	var root = $("#tagRoot")
	var base = $(document.createElement("div"))
	var laurs,
		sortDiv = $(document.createElement("div")),
		searchBox = $(document.createElement("input")),
		searchButton = $(document.createElement("div")),
        searchIconButton = $(document.createElement("img")),
        sortButton = $(document.createElement("div")),
        clearButton = $(document.createElement("div")),
		NOBEL_ORANGE_COLOR = '#d99b3b',
        pageHeight,
        pageWidth,
		scroller = $(document.createElement("div")),
        sortTags = [],
        searchText = $(document.createElement("div")),
        timer,
        searchBoxController,
        isSurface

	root.append(base)
	base.append(sortDiv)
	sortDiv.append(searchBox)
	sortDiv.append(searchButton)
	sortDiv.append(sortButton)
	sortDiv.append(clearButton)
	sortDiv.append(searchText)
	sortDiv.append(searchIconButton)
	base.css({
		"position": "absolute",
		"width": "100%",
		"height": "100%",
		"background-color" : "rgb(50,50,50)"
	}).append(scroller)

	var ratio = root.width() / root.height()
	if (ratio !== (16 / 9)) {
	    if (ratio > (16 / 9)) {
	        base.css("width", root.height() * (16 / 9) + "px")
	        console.log("ratio was greater than 16/9")
            isSurface = false
	    }
	    else {
	        base.css("height", (9 / 16) * root.width() + "px")
	        base.css("top", .5 * (root.height() - ((9 / 16) * root.width())) + "px")
	        console.log("ratio was less than 16/9")
            isSurface = true
	    }
	}
	else {
	    console.log("ratio was 16/9")
        isSurface = false
	}


	TAG.Layout.Spoof().getLaureates(init)
	function makeSearchBoxController() {
	    searchIconButton.css({
	        "right": "50px",
	        "width": "auto",
	        "position": "absolute",
	        "height": "38px",
	        "background-color": "transparent",
	        "top": "92px",
	        "border-radius": "12px",
	    }).attr({ src: '../tagcore/images/icons/search_icon.svg' }).click(function () { ret.onclick() })
	    var ret = {}
        ret.isSearch = true
	    ret.setClear = function () {
	        searchIconButton.attr({ src: '../tagcore/images/icons/clear search icon (1).svg' })
	        ret.isSearch = false
	    }
	    ret.setSearch = function () {
	        searchIconButton.attr({ src: '../tagcore/images/icons/search_icon.svg' })
            ret.isSearch = true
	    }
	    ret.onclick = function () {
	        if (ret.isSearch === true) {
	            ret.search()
	        }
	        else {
	            reset();
                ret.setSearch()
	        }
	    }
	    ret.search = function () {
	        search(searchBox[0].value.toLowerCase())
	        ret.setClear()
	    }
        return ret
	}
	function makeTimer() {
	    var ret = {}
	    ret.time = IDLE_TIMER_TIME * 1000
        ret.scrollTime = 1800000
        ret.start = function () {
            reset();
            $("#popup").hide()
            $("#overlay").hide()
            $("#popup").die()
            $("#overlay").die()
            $("#popup").remove()
            $("#overlay").remove()
            var width = Math.floor(laurs.length / 3) * ((pageHeight / 5) + HORIZ_SPACING_CONSTANT - LAUR_WIDTH_REDUCITON - SQUISH_FACTOR) + 15
            var finalX = width - pageWidth
            if (scroller.scrollLeft() > width / 2) {
                finalX = 0
            }
            var duration = 1000
            if (finalX === 0) {
                duration = ret.scrollTime * ((scroller.scrollLeft() - finalX) / width)
            }
            else {
                duration = ret.scrollTime * ((finalX - scroller.scrollLeft()) / width)
            }
	        scroller.animate({ scrollLeft: finalX }, duration, "linear", function () { ret.start() })
        }
	    ret.timer = setTimeout(function () { ret.start() }, ret.time);
	    ret.restart = function () {
	        clearTimeout(ret.timer)
	        ret.timer = setTimeout(function () { ret.start() }, ret.time);
	    }
	    ret.stop = function () {
	        scroller.stop()
	        ret.restart();
	    }
	    ret.restart()
        return ret
	}
	function init(db) {
		$(document).unbind();
		$("#splashScreenRoot").die()
		$("#splashScreenRoot").remove()

		pageWidth = base.width();
		pageHeight = base.height();

		sortDiv.css({
			"position": "absolute",
			"width": "100%",
			"height": "15%",
			"top": "-6%",
			"left": "0%",
		})
		searchBox.css({
			"width": "250px",
			"height": "35px",
            "background-color" : "transparent",
            "top": "90px",
            "overflow": "hidden",
            "color" : "white",
			"right": "50px",
			"border": "2.5px solid " + NOBEL_ORANGE_COLOR,
			"border-radius": "12px",
			"position" : "absolute"
		}).attr({ id: "searchBox" })

		searchBoxController = makeSearchBoxController()

		var clearSortCSS = {
		    "position": "absolute",
		    "width": "90px",
		    "height": "30px",
		    "font-size": ".775em",
            "text-align" : "center",
		    "border-radius": "4pt",
		    "background-color": NOBEL_ORANGE_COLOR,
		    "color": "black",
            "vertical-align" : "middle",
		    "box-shadow": "3px 8px 17px 4px #000",
		    "border-color": NOBEL_ORANGE_COLOR,
		    "top": "95px",
		}
		sortButton.css(clearSortCSS)
		clearButton.css(clearSortCSS)
		sortButton.css({
		    "left": "750px",
		}).text("Apply").click(function () {
		    sort(null);
		}).hide();
		clearButton.css({
		    "left": "765px",
		}).text("Clear").click(reset).mousedown(function () { clearButton.css("opacity", ".75") }).mouseleave(function () { clearButton.css("opacity","1")})

		var subSearchText = $(document.createElement("div")).text("Find laureates by name or country of origin")
		subSearchText.css({
		    "top": "137.5px",
		    "right": "50px",
		    "font-size": ".55em",
		    "color": "white",
            "position" : "absolute"
		})
        sortDiv.append(subSearchText)
		searchText.css({
		    "height": "30px",
		    "top": "157.5px",
		    "left": "45px",
		    "font-size": ".8em",
		    "color": "white",
		    "position": "absolute"
		}).hide();
		searchButton.css({
			"height": "30px",
			"top": "55px",
			"right": "50px",
			"position": "absolute"
		}).text("Search")
        $(base).keyup(function (e) {
            if (e.keyCode === 13) {
                searchBoxController.search()
            }
		 })
		laurs = db
		scroller.css({
			"overflow-x": "scroll",
			"overflow-y": "hidden",
			"width": "100%",
			"height": "82%",
			"top": "21.5%",
			"position": "absolute",
			"background-color" : "transparent"
		}).attr({id:"scroller"})

		for(var i=0;i<laurs.length;i++){
			var laur = laurs[i];
			makeBlock(laur,i);
		}
		var words = ['Physics', 'Chemistry', 'Medicine', 'Literature', 'Peace', 'Economics']
		var l = 300
		words.forEach(function (tag) {
		    var keyword = makePrizeKeyword(tag, l)
		    sortTags.push(keyword)
            l+=70
		})

		timer = makeTimer()
        makeDropDowns()
        $("#decadeList").hide();
        $("#genderList").hide();
		$(document).unbind()
		$("#root").unbind()
		$("#tagContainer").unbind()
		$("#tagRoot").unbind()
		root.unbind()
		var ontouch = function () {
		    timer.stop()
		    timer.restart()
		}
		scroller.click(ontouch).mousedown(ontouch)
        $(".block").click(ontouch).mousedown(ontouch)
        $(document).click(ontouch).mousedown(ontouch)
        root.click(function (e) {
            if (!(e.target.id === "decadeButton" || (e.target.parentNode && e.target.parentNode.id === "decadeButton") ||
                (e.target.id === "decadeList" || (e.target.parentNode && e.target.parentNode.id === "decadeList"))||
                (e.target.className === "checkBox"))) {//sloppy but gets the job done
                $("#decadeList").hide();
            }
            if (!(e.target.id === "genderButton" || (e.target.parentNode && e.target.parentNode.id === "genderButton") ||
                (e.target.id === "genderList" || (e.target.parentNode && e.target.parentNode.id === "genderList")) |
                (e.target.className === "checkBox"))) {
                $("#genderList").hide();
            }
        })
	}
	function makeBlock(laur, i) {
		var block = $(document.createElement("div"))
		var img = $(document.createElement("img"))
		var header = $(document.createElement("div"))
		var nameDiv = $(document.createElement("div"))
		var firstNameDiv = $(document.createElement("div"))
		var prizeAndYearDiv = $(document.createElement("div"))
		var prizeIcon = $(document.createElement("img"))

		block.append(img)
		block.append(header)
        header.append(prizeIcon)
		header.append(firstNameDiv)
		header.append(nameDiv)
		header.append(prizeAndYearDiv)
		scroller.append(block)

		block.css({
			"position": "absolute",
			"width": pageHeight / 5 - LAUR_WIDTH_REDUCITON + "px",
			"height": pageHeight /5 + SQUISH_FACTOR +"px",
			"top": i % 3 * ((pageHeight /5) +45 )+ "px",
			"left": Math.floor(i / 3) * ((pageHeight / 5) + HORIZ_SPACING_CONSTANT - LAUR_WIDTH_REDUCITON - SQUISH_FACTOR) + 15 + "px",
			"overflow": "hidden",
			"box-shadow": "3px 8px 17px 4px #000"
		}).addClass("block")
		block.click(function () { makeBigPopup(laur) })

		var css = {
			"position": "relative",
			"width": SANDBOX_NEW_UI ? "65%" : "65.75%",
            "height" : "33.3333%",
			"float": "right",
			"font-size": ".75em",
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

		prizeIcon.css({
		    "position": "absolute",
		    "height": "100%",
		}).attr({ src: '../tagcore/images/prize_icons/' + laur.Metadata.PrizeCategory.toLowerCase() + '.svg' })

		var searchString = ""

		block.addClass(laur.Metadata.KeywordsSet1.toLowerCase())
		block.addClass(laur.Metadata.KeywordsSet2.toLowerCase())
		block.addClass(laur.Metadata.KeywordsSet3.toLowerCase())

		var keys = {}
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
			"height": "20%",
			"font-size": ".5em",
			"text-align": "right",
			"background-color" : prizecolor
		})

		img.css({
			"position": "absolute",
			"width": "100%",
			"height": "auto",
			//"top": SANDBOX_NEW_UI ? "15px": "0%"
            
		}).attr({ src: laur.Metadata.Thumbnail.FilePath })

	    //console.log(img.height());
		img.load(function(){
		    if (img.height()+12.5 < block.height()) {
		        //console.log("Laureate image DOES NOT hit bottom: " + laur.Metadata.LastName);

		        img.css({
		            "bottom": "0%",
		            //"top": img.height(),
		            "vertical-align": "bottom"
		        });

		    } else {
		        //console.log("Laureate image hits bottom: " + laur.Metadata.LastName);
		        img.css("top", SANDBOX_NEW_UI ? "12.5px": "0%");

		    }
		})


	    //pageHeight /5 + SQUISH_FACTOR +"px" -> This is the height of a laureate tile

		laur.block = block
		laur.searchString = searchString
	}
	function arrangeTiles(tiles) {
		for (var tile = 0; tile < tiles.length; tile++) {
			var t = tiles[tile]
			t.style.top = tile % 3 * ((pageHeight /5) + 45) + "px"
			t.style.left = Math.floor(tile / 3) * ((pageHeight / 5) + HORIZ_SPACING_CONSTANT - LAUR_WIDTH_REDUCITON - SQUISH_FACTOR) + 15 + "px"
		}
	}
	function search(s) {
	    while (s.slice(-1) === " ") {
            s = s.substring(0,s.length-1)
	    }
	    while (s.substring(0, 1) === " ") {
	        s = s.substring(1)
	    }
	    $("#decadeList").hide();
	    $("#genderList").hide();
	    sortTags.forEach(function (t) {
	        t.unselect();
	    })
		var blocks = []
		$(".block").hide()
		laurs.forEach(function(laur){
			if (laur.searchString.indexOf(s) !== -1 && blocks.indexOf(laur.block[0])===-1) {
				blocks.push(laur.block[0])
				laur.block.show()
			}
		})
		arrangeTiles(blocks)
		searchText.text("You have " + blocks.length + " results for '"+s+"'");
		searchText.show();
		searchBox.text('')
		$("#scroller").scrollLeft(0)
	}
	function sort(tags, singleSearch) {
	    searchBox[0].innerText = " "
	    if (tags === null || tags === undefined) {
	        var tagsToSort = []
	        sortTags.forEach(function (t) {
	            if (t.isSelected() === true) {
	                tagsToSort.push(t.tag.toLowerCase())
	            }
	        })
	        if (singleSearch !== null && singleSearch !== undefined) {
                tagsToSort.push(singleSearch.tag.toLowerCase())
	        }
	        sort(tagsToSort)
	        return;
	    }
	    if (!tags || tags.length === 0) {
	        reset();
	        return;
	    }
	    $(".block").hide()

	    if (tags.length > 1) {
	        var t = {}
	        tags.forEach(function (tag) {
                t[tag] = true
	        })
            tags = Object.keys(t)
	    }

	    var p = ['physics', 'chemistry', 'medicine', 'literature', 'peace', 'economics']
	    var d = ['1900s', '1910s', '1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s']
	    var g = ['male', 'female']
	    var prizes = []
	    var genders = []
        var decades = []
        tags.forEach(function (t) {
            if (p.indexOf(t)>-1) {
                prizes.push(t)
            }
            else if (d.indexOf(t) > -1) {
                decades.push(t)
            }
            else if (g.indexOf(t) > -1) {
                genders.push(t)
            }
        })
        if (tags.length === 1 || (prizes.length === 0 && genders.length === 0) || (prizes.length === 0 && decades.length === 0) || (decades.length === 0 && genders.length === 0)){
            tags.forEach(function (tag) {
                $("."+tag).show()
            })
        }
        else {
            var array = $(".block").toArray()
            for(var i=0;i<array.length;i++){
                var b = $(array[i])

                var prize = false
                if (prizes.length > 0) {
                    prizes.forEach(function (p) {
                        if (b.hasClass(p)) {
                            prize = true
                        }
                    })
                }
                else {
                    prize = true
                }
                if (prize === false) {
                    continue
                }

                var gender = false
                if (genders.length > 0) {
                    genders.forEach(function (p) {
                        if (b.hasClass(p)) {
                            gender = true
                        }
                    })
                }
                else {
                    gender = true
                }
                if (gender === false) {
                    continue
                }
                var decade = false
                if (decades.length > 0) {
                    decades.forEach(function (p) {
                        if (b.hasClass(p)) {
                            decade = true
                        }
                    })
                }
                else {
                    decade = true
                }
                if (decade=== false) {
                    continue
                }
                b.show()
            } 
        }

		var tiles = []
		$(".block").toArray().forEach(function (b) {
			if (b.style.display !== "none") {
				tiles.push(b);
			}
		})
		arrangeTiles(tiles);
		var s = ""
		if (decades.length > 0) {
		    decades.forEach(function (d) {
		        s += "'"+d+"'" + " or "
		    })
		    s = s.substring(0, s.length - 4)
            s+=" and "
		}
		if (genders.length > 0) {
		    genders.forEach(function (d) {
		        s += "'" + d + "'" + " or "
		    })
		    s = s.substring(0, s.length - 4)
		    s += " and "
		}
		if (prizes.length > 0) {
		    prizes.forEach(function (d) {
		        s += "'" + d + "'" + " or "
		    })
		    s = s.substring(0, s.length - 4)
		}
		else {
			s = s.substring(0, s.length - 5)
		}
		searchText.text("There were " + tiles.length + " results found for " + s);
		if (tiles.length === 0) {
			searchText.text("There were no results found" );
		}
		searchText.show();
		$("#scroller").scrollLeft(0)
	}
	function reset() {
	    $("#decadeList").hide();
	    $("#genderList").hide();
	    searchText.hide();
	    sortTags.forEach(function (t) {
	        t.unselect();
	    })
		$(".block").show()
		arrangeTiles($(".block").toArray())
		searchBox[0].value = ''
        searchBoxController.setSearch()
	}
	function makeBigPopup(laur) {
		var overlay = $(document.createElement("div")).attr({ id: "overlay" });
		var popup = $(document.createElement("div")).attr({ id: "popup" });
		var rightSide = $(document.createElement("div"))
		var img = $(document.createElement("img")).attr({ src: laur.Metadata.FullImage.FilePath })
		var imgwrapper = $(document.createElement("div"))
		var closeIcon = $(document.createElement("img")).attr({ src: '../tagcore/images/icons/x.svg' })

		base.append(overlay);
		base.append(popup)
		popup.append(imgwrapper)
		popup.append(rightSide)
        popup.append(closeIcon)
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
		closeIcon.css({
		    "height": "35px",
		    "width": "35px",
		    "position": "absolute",
		    "top": "9px",
            "right" : "9px"
		}).click(hide)
		imgwrapper.css({
			"width": "40%",
			"height": "80%",
			"top": "10%",
			"left" : "5%",
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

		rightSide.css({
		    "position": "absolute",
		    "height": "80%",
		    "width": "45%",
		    "left": "50%",
		    "top": "10%",
		})
		var name = $(document.createElement("div"))
		var category = $(document.createElement("div"))
		var year = $(document.createElement("div"))
		var collaborators = $(document.createElement("div"))
		var citation = $(document.createElement("div"))
		var desc = $(document.createElement("div"))
		var country = $(document.createElement("div"))
		var icon = $(document.createElement("img")).attr({ src: '../tagcore/images/prize_icons/' + laur.Metadata.PrizeCategory.toLowerCase() + '_white.svg' })
		icon.css({
		    "width": "20%",
		    "height": "auto",
		   // "bottom": "82%",
		    "position": "relative",
		    "float": "right",
            "margin-right" : '55%',
		})
		var commonCSS = {
		    "position": "relative",
            "color" : "white",
		    "width": "100%",
		    "height": "auto",
            "margin-bottom" : "15px"
		}
		name.css({ "font-size": "1.4em" })
		collaborators.css({ "font-size": ".95em" })
		
		year.css({ "font-size": ".95em" })
		desc.css({ "font-size": ".95em"})
		country.css({ "font-size": ".95em" })
		var last = laur.Metadata.LastName
		if (last === undefined || last === null || last === "undefined") {
            last = ""
		}

		rightSide.append(name.css(commonCSS).text(laur.Metadata.FirstName + " " + last));
		rightSide.append(icon);
		rightSide.append(category.css(commonCSS).text(laur.Metadata.PrizeCategory));
		rightSide.append(year.css(commonCSS).text(laur.Metadata.Year));
		rightSide.append(country.css(commonCSS).text(laur.Metadata.bornCountry ? laur.Metadata.bornCountry : ""))


		rightSide.append(collaborators.css(commonCSS).text(laur.Metadata.Collaborators ? "Collaborators: "+laur.Metadata.Collaborators : ""))
		rightSide.append(citation.css(commonCSS).text("Citation:"));
		var mot = laur.Metadata.Motivation;
		if (mot.indexOf("<I>") > 0) {
		    var start = mot.indexOf("<I>");
		    var end = mot.lastIndexOf("</I>");
		    var firstPart = mot.slice(0, start);
		    var italicText = mot.slice(start + 3, end);
		    var lastPart = mot.slice(end + 4, mot.length);
		    var firstSpan = $('<span/>').text(firstPart);
		    var italicSpan = $('<span/>').text(italicText).css("font-style", "italic");
		    var lastSpan = $('<span/>').text(lastPart);
		    desc.css(commonCSS).append(firstSpan).append(italicSpan).append(lastSpan);
		    rightSide.append(desc);
		} else {
		    rightSide.append(desc.css(commonCSS).text(laur.Metadata.Motivation));
		}

		function hide() {
			$("#popup").hide()
			$("#overlay").hide()
			$("#popup").die()
			$("#overlay").die()
			$("#popup").remove()
			$("#overlay").remove()
		}
	}
	function makePrizeKeyword(category,x) {
	    var div = $(document.createElement("div"))
	    var title = $(document.createElement("div"))
	    var img = $(document.createElement("img"))

	    div.append(title);
	    div.append(img);

	    div.css({
	        "height": "100px",
            "width" : "55px",
	        "position": "absolute",
	        "left": x + "px",
            "top" : "65px"
	    }).click(
        function () {
            div.toggle()
            div.css("opacity" , "1");
        }).mousedown(function () {
            div.css("opacity" , ".6")
        }).mouseleave(function () { div.css("opacity", "1"); })
	    img.css({
	        "position": "relative",
	        "width": "100%",
            "box-shadow" : "3px 8px 12px 3px black"
	    }).attr({ src: '../tagcore/images/prize_icons/' + category.toLowerCase()+ '.svg' })
	    title.css({
	        "position": "relative",
	        "text-align": "center",
	        "width": "100%",
	        "font-size": ".5em",
            "margin-bottom" : "4px"
	    }).text(category)
	    div.tag = category;
	    div.selected = false;
	    div.isSelected = function(){
            return div.selected
	    }
	    div.select = function () {
	        div.selected = true;
	        img.css({
                "border" : "2px solid white"
	        })
	    }
	    div.unselect = function () {
	        div.selected = false;
	        img.css({
	            "border": "0px solid white"
	        })
	    }
	    div.toggle = function () {
	        if (div.isSelected() === true) {
                div.unselect()
	        }
	        else {
	            div.select();
	        }
	        sort()
	    }
	    sortDiv.append(div)
        return div
	}
	function makeDropDowns() {
	    function makeCheckDiv(tag) {
	        var div = $(document.createElement("div")).addClass("checkBox")
	        var title = $(document.createElement("div")).addClass("checkBox")
	        var box = $(document.createElement("input")).addClass("checkBox")
            box[0].type = "checkbox"
            div.append(box)
            div.append(title)
	        div.css({
	            "position": "relative",
	            "height": "25px",
	            "width": "100%",
                "background-color" : NOBEL_ORANGE_COLOR,
	        }).click(function () { div.toggle() })
	        box.css({
	            "width": "12px",
	            "height": "12px",
	            "top": "4px",
	            "left": "4px",
	            "position": "absolute",
                "background-color" : "white"
	        }).click(function () { div.toggle() })
	        title.css({
	            "color": "black",
	            "font-size": ".5em",
	            "position": "absolute",
                "width" : "100%",
                "padding-left": "30px",
                "margin-top" : "5px"
	        }).text(tag)
            div.tag = tag
            div.box = box
            div.isSelected = function () {
                return div.box[0].checked === true
            }
	        div.select = function () {
	            div.box[0].checked = true
	        }
	        div.unselect = function () {
	            div.box[0].checked = false
	        }
	        div.toggle = function () {
	            if (div.isSelected() === true) {
	                div.unselect()
                    sort()
	            }
	            else {
	                div.select();
	                sort(null, div)
	            }
	        }
	        sortTags.push(div)
            return div
	    }
	    var filterDiv = $(document.createElement('div'))
	    var decades = $(document.createElement('div')).attr({id:'decadeButton'})
	    var decadeList = $(document.createElement('div'))
	    decades.css({
	        "position": "absolute",
	        "width": "90px",
	        "border-radius": "4pt",
	        "background-color": NOBEL_ORANGE_COLOR,
	        "color": "black",
	        "top": "100px",
	        "padding-left": "5px",
	        "font-size": ".75em",
	        "height": "27.5px",
	        "left": "45px",
	        "box-shadow": "3px 8px 17px 4px #000",
	        "border-color": NOBEL_ORANGE_COLOR,
	    }).text("Decade").click(function () {
	        if (decadeList[0].style.display === "none") {
	            decadeList.show()
	        }
	        else {
	            decadeList.hide();
	        }
	    })
	    filterDiv.css({
	        "position": "absolute",
	        "left": "45px",
	        "top": "60px",
            "color" : "white"
	    }).text("Filters")
	    sortDiv.append(decades)
        sortDiv.append(filterDiv)
        addBlackCloseIcon(decades)
	    base.append(decadeList)
	    decadeList.css({
	        "position": "absolute",
	        "width": $("#decadeButton").width()+2 + "px",
	        "border-bottom-left-radius": "4pt",
	        "border-bottom-right-radius": "4pt",
	        "background-color": NOBEL_ORANGE_COLOR,
	        "color": "black",
	        "top": isSurface ? "71px" : "76.5px",
	        "padding-left": "3px",
            "overflow" : "hidden",
	        "left": "45px",
	        "box-shadow": "3px 15px 17px 4px #000",
	        "border-color": NOBEL_ORANGE_COLOR,
	    }).attr({ id: "decadeList" })
	    var ds = ['1900s', '1910s', '1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', ]
	    ds.forEach(function (d) {
	        var t = makeCheckDiv(d)
	        decadeList.append(t);
	    })

	    var genders = $(document.createElement('div')).attr({ id: 'genderButton' })
	    var genderList = $(document.createElement('div'))
	    genders.css({
	        "position": "absolute",
	        "width": "94px",
	        "border-radius": "4pt",
	        "background-color": NOBEL_ORANGE_COLOR,
	        "color": "black",
	        "top": "100px",
            "height" : "27.5px",
            "font-size": ".75em",
            "padding-left" : "5px",
	        "left": "150px",
	        "box-shadow": "3px 20px 17px 4px #000",
	        "border-color": NOBEL_ORANGE_COLOR,
	    }).text("Gender").click(function () {
	        if (genderList[0].style.display === "none") {
	            genderList.show()
	        }
	        else {
	            genderList.hide();
	        }
	    })
	    sortDiv.append(genders)
        addBlackCloseIcon(genders)
	    base.append(genderList)
	    genderList.css({
	        "position": "absolute",
	        "width" : $("#genderButton").width() +2+ "px",
	        "border-bottom-left-radius": "4pt",
	        "border-bottom-right-radius": "4pt",
	        "background-color": NOBEL_ORANGE_COLOR,
	        "color": "black",
	        "top": isSurface ? "71px" : "76.5px",
	        "overflow": "hidden",
	        "padding-left": "3px",
	        "left": "150px",
	        "box-shadow": "3px 20px 17px 4px #000",
	        "border-color": NOBEL_ORANGE_COLOR,
	    }).attr({ id: "genderList" })
	    var ds = ["male","female"]
	    ds.forEach(function (d) {
	        var t = makeCheckDiv(d)
	        genderList.append(t);
	    })
	}
	function addBlackCloseIcon(div) {
	    var img = $(document.createElement('img'))
	    img.css({
	        "position": "absolute",
	        "padding-right": "8px",
	        "height": "50%",
	        "right": "5px",
            "width" : "auto",
            "transform" : "rotate(270deg)",
	        "top": "10%",
	    }).attr({ src: '../tagcore/images/icons/blackclose.svg' })
        div.append(img)
	}
})