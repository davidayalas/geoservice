var url = require('url'),
	content = require('node-static'),
	formats = require('../utils/formats'),
	search = require('../managers/search');


/**
 * Manage REST actions
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Object} db
 */
exports.controller = function(req,res,db){

	search.setDB(db);
	
	var params = {};
	var action = "";
	var _url = url.parse(req.url, true);

	var path = _url.pathname.split("/");
	path.splice(0,1)
	
	if(path[0]=="favicon.ico"){
		res.end();
		return;
	}
	
	/**
		Gets collection and action
	**/
	if(path[0]!="css" && path[0]!="js" && path[0]!="img"){
		params["COLLECTION_NAME"] = path[0];
		if(path.length>1){
			action = path[1];
		}else{
			params["COLLECTION_NAME"] = null;
			action = path[0];
		}
	}
	
	params["fields"] = null;

	/**
		Gets all fields in querystring (except reserved)
	**/
	var camps = false;
	for(var _key in _url.query){
		if(_key!="loc" && _key!="geoaddress" && _key!="distance" && _key!="cb" && _key!="_" && _key!="collection" && _key!="skip" && _key!="getdistinct" && _key!="query" && _key!="format" && _key!="kml_name" && _key!="kml_description"){
			if(params["fields"] == null) params["fields"]={};
			params["fields"][_key] = _url.query[_key];
			camps = true;
		}
	}

	/**
		invalid request
	**/
	if((!params["COLLECTION_NAME"] && (_url.query.loc || _url.query.geoaddress || params["fields"])) && !action=="layar"){
		res.write("collection param missing");
		res.end();
		return;
	}

	/**
		set working params
	**/	
	params["earthRadius"] = !isNaN(_url.query.earthRadius) ? _url.query.earthRadius*1 : null;
	params["distance"] = !isNaN(_url.query.distance) ? _url.query.distance*1 : 1;
	params["cb"] = _url.query.cb;
	params["format"] = _url.query.format ? _url.query.format.toLowerCase() : "json";
	params["skip"] = !isNaN(_url.query.skip) ? _url.query.skip*1 : 0;
	params["res"] = res;
	params["sort"] = _url.query.sort;
			
	/**
		KML params
	**/
	params["kml"] = {}
	params.kml["name"] = _url.query.kml_name;
	params.kml["description"] = _url.query.kml_description;
	params.kml["point"] = "loc";
	
	/**
		Dispatch action
	**/
	switch(action){
		case "search":
			/**
				check if is full text search
			**/			
			if(_url.query["fulltext"]){
				params["fulltext"] = _url.query["fulltext"];
				delete params.fields["fulltext"]
			}

			/**
				check if is geo search with lat/lon
			**/			
			if(_url.query.loc && !_url.query.getcollections){
				var loc = formats.encodeURI(_url.query.loc);
				if(loc.indexOf(",")>-1){
					var error = false;
					params["lat"] = loc.slice(0,loc.indexOf(","))*1;
					if(!isNaN(params["lat"])){
						params["lng"] = loc.slice(loc.indexOf(",")+1)*1;
						if(!isNaN(params["lng"])){search.exec(params);}
						else{error = true;}
					}else{error = true;}
				}else{
					error = true;
				}
				
				if(error){
					res.write("error en les coordenades");
					res.end();
					return;
				}
			/**
				check if is reverse geo 
			**/			
			}else if(_url.query.geoaddress){
				search.geocode(encodeURI(_url.query.geoaddress), params);
			/**
				normal search (field=value)
			**/			
			}else if(camps){
				search.exec(params);
			}else{
				res.end();
				return;
			}
			break;
		
		/**
			get all collections
		**/			
		case "collections":	
			search.getCollections(res,params.cb);
			break;

		/**
			get distinct values
		**/			
		case "distinct":
			delete params["fields"]["key"];
			search.getDistinct(res,params,_url.query.key, params.cb);
			break;

		/**
			get collection schema
		**/			
		case "schema":
			if(params.COLLECTION_NAME){
				search.getSchema(res, params.COLLECTION_NAME, params.cb);
			}
			break;

		/**
			layar output
		**/			
		case "layar":
			params["format"] = "layar";
			params["fields"] = {};
			params["lat"] = !isNaN(_url.query.lat)?_url.query.lat*1:0;
			params["lng"] = !isNaN(_url.query.lon)?_url.query.lon*1:0;
			params["distance"] = (_url.query.radius*1)/1000;
			params["COLLECTION_NAME"] = _url.query.layerName;
			search.exec(params);
			break;

		/**
			serve static content
		**/			
		default:
			if(action!="map" && action!="explorer"){
				action="";
			}else{
				req.url = req.url.replace("/"+params["COLLECTION_NAME"],"");
			}
			var fileServer = new content.Server('./static/');
			fileServer.serve(req, res, function(err, result){
				if (err) { // There was an error serving the file
					console.error("Error serving " + req.url + " - " + err.message);
					res.writeHead(err.status, err.headers);
					res.end();
				}
			});
	}
}