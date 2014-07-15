window.onload = load;

function load() {
	initHandlers();
}

function initHandlers() {
	$('#test1').on('click', function() {
		telemetryRequest('POST', 'startPage');
	});
	$('#test2').on('click', function() {
		telemetryRequest('GET', 'collectionsPage');
	});
}

// borrowed from http://stackoverflow.com/questions/5916900/detect-version-of-browser
function browserVersion() {
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    M= M[2]? [M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    return M.join(' ');
}

/**
 * Handles returned data from server after a get request.
 * @param {Array} data
 */
function handleGetRequestData(data) {
	var elt = $('#results'),
		table,
		tableHeaders = [],
		tr, td, th;

	if(!data || data.length === 0) {
		return;
	}

	elt.empty();

	table = createTable(data);

	elt.append(table);

}

function createTable(data) {
 	var i, j,
 		table,
 		numResults,
 		tableHead,
 		tableHeader,
 		tableBody,
 		tableEntry, text,
 		prop,
		data, headers = [], inputClass, numRows, numCols;
		
	data = data || [];

	for(prop in data[0]) {
		if(data[0].hasOwnProperty(prop)) {
			headers.push(prop);
		}
	}
	
	numResults = data.length || 0;
	numColumns = headers.length || 0;
	
	console.log("numResults = " + numResults);

	if(numResults.length === 0) {
		return;
	}

 	table = $(document.createElement('table'));

	if(headers.length > 0) {
 		tableHead = $(document.createElement('thead'));
	 	tableRow = $(document.createElement('tr'));
	 	tableHead.append(tableRow);
	 	for(i=0;i<numColumns;i++) {
	 		tableHeader = $(document.createElement('th'));
	 		tableRow.append(tableHeader);
	 		tableHeader.text(headers[i]);
	 	}
	 	table.append(tableHead);
	}

 	tableBody = $(document.createElement('tbody'));
 	table.append(tableBody);
 	for(i=0;i<numResults;i++) {
 		tableRow = $(document.createElement('tr'));
 		tableBody.append(tableRow);
 		for(j=0;j<numColumns;j++) {
 			tableEntry = $(document.createElement('td'));
 			tableRow.append(tableEntry);
 			tableEntry.css('width', (100/numColumns)+'%')
			if(j===0 && headers[0] === "") {
				tableEntry.css({
					'vertical-align':'text-top',
					'font-size':'90%'
				});
 				text = formatTime(startTime + i);
 			} else {
 				text = data.length > 0 ? data[i][headers[j]] : '';
 			}
 			tableEntry.text(text);
 		}
 	}
 	return table;
}

/**
 * Make a request to the telemetry server
 * @param type      'POST' for updating data or 'GET' for getting it
 * @param data      object; data to be sent in body of request
 */
function telemetryRequest(type, ttype) {
	if(!type) {
		console.log('no request type provided!');
		return;
	}

	data = {
		ttype: ttype,
		tagserver: localStorage.ip || '',
		browser: browserVersion(),
		platform: navigator.platform
	}; 

	$.ajax({
		type: type,
		url: 'http://127.0.0.1:9999/',
		data: data,
		async: true, // this is the default, but just make it explicit
		success: function(data) {
			console.log(type+' request to server worked');
			if(type === 'GET') {
				handleGetRequestData(JSON.parse(data));
			}
		},
		error: function(e) {
			console.log('telemetry error! look at node output...');
		}
	});
}