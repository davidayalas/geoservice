//getcollection names
function strong(str){
	return str.replace(/\?/g,"?<strong>").replace(/\&/g,"&<strong>").replace(/=/g,"</strong>=");
}

function setContent(geoservice_schemes,schema){
	var _url;
	var _collection = "/"+schema;
	schema = _config[schema]?schema:"common";
	
	var url_init = window.location.protocol +"//" + window.location.host;
	
	//geoqueries
	$("#geo").html("");
	_url = url_init+_collection+"/search?loc="+_config.location+"&distance="+ (_config[schema]?_config[schema].distance:1);
	$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#geo");
	
	_url = url_init+_collection+"/search?geoaddress="+(_config[schema]?_config[schema].address:"montmeló")+"&distance="+(_config[schema]?_config[schema].distance:1);
	$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#geo");

	var _qs;

	//fieldname
	$("#fieldname").html("");
	for(var i=0;i<_config[schema].fields.length;i++){
		_qs = [];
		for(var _key in _config[schema].fields[i]){
			_qs.push("&",_key,"=",_config[schema].fields[i][_key]);
		}
		_url = url_init+_collection+"/search?"+_qs.join("").slice(1);
		$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#fieldname");
	}

	//distinct
	$("#distinct").html("");
	for(var i=0;i<_config[schema].distinct.length;i++){
		_qs = [];
		var z=0;
		for(var _key in _config[schema].distinct[i]){
			_qs.push("&",_key,"=",_config[schema].distinct[i][_key]);
		}
		_url = url_init+_collection+"/distinct?"+_qs.join("").slice(1);
		$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#distinct");
	}
	
	//mixed
	$("#mixed").html("");
	$("#callback").html("");
	for(var i=0;i<_config[schema].mixed.length;i++){
		_qs = [];
		for(var _key in _config[schema].mixed[i]){
			_qs.push("&",_key,"=",_config[schema].mixed[i][_key]);
		}
		_url = url_init+_collection+"/search?"+_qs.join("").slice(1);
		$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#mixed");
		_url = _url + "&cb=f";
		$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#callback");
	}
	
	//pagination
	$("#pagination").html("");
	_url = url_init+_collection+"/search?loc="+_config.location+"&distance=100&skip=100";
	$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#pagination");

	//get collection schema
	$("#schema").html("");
	_url = url_init+_collection+"/schema";
	$("<li><a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#schema");
	
	//visualizations
	$("#visu").html("");
	_url = url_init+_collection+"/explorer";
	$("<li>Data explorer <a href=\""+_url+"\">"+strong(_url)+"</a></li>").appendTo("#visu");
	_url = url_init+_collection+"/map";
	$("<li>Map view <a href=\""+_url+"\" target='_blank'>"+strong(_url)+"</a></li>").appendTo("#visu");

	//visualizations
	$("#layar").html("");
	_url = url_init+"/layar?layerName="+_collection.slice(1)+"&lat=41.426639333132655&lon=2.1454238891601562&radius=2000";
	$("<li>Layar <a href=\""+_url+"\">"+strong(_url)+"</a></li>").appendTo("#layar");
	
	//format examples			
	$("#format_samples").html("");
	var map;
	for(var i=0;i<_config[schema].format.length;i++){
		_qs = [];
		map=false;
		for(var _key in _config[schema].format[i]){
			_qs.push("&",_key,"=",_config[schema].format[i][_key]);
			if(_config[schema].format[i][_key]=="kml"){map=true}
		}
		_url = url_init+_collection+"/search?"+_qs.join("").slice(1);
		if(map){
			map = " <br/>[<a href=\"http://maps.google.com?q="+encodeURIComponent(_url)+"\" target=\"_blank\">view map</a>]";
		}
		$("<li><a href=\""+_url+"\">"+strong(_url)+"</a>"+(map?map:"")+"</li>").appendTo("#format_samples");
	}
}

getCollections();