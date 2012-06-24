/**
 * Get the results in the format requested
 *
 * @param {Object} obj JSON object to transform
 * @param {String} format
 * @param {Object} kmlfields
 * @param {Object} schema
 * @return {String}
 */
exports.get = function(obj,format,kmlfields,schema,meta){
	formats.format = format;
	switch(format){
		case "json":
			return JSON.stringify(obj);
		case "csv":
			return formats.getCSV(obj);
		case "xls":
			return formats.getXLS(obj);
		case "html":
			return formats.getHTML(obj);
		case "kml":
			//if(!kmlfields.name && !kmlfields.description){return;}
			return formats.getKML(obj,kmlfields,schema,meta);
		case "layar": //json specialization
			return formats.getLayar(obj,meta);
	}
}

/**
 * Get the header of the requested format
 *
 * @param {String} format
 * @param {String} name  the name of the attachment
 * @return {Object}
*/
exports.getHead = getHead;
function getHead(format,name){
	switch(format){
		case "json":
		case "layar":
			return {'content-type': 'application/x-javascript; charset=UTF-8'};
		case "csv":
			//return {'content-type': 'text/plain;charset=UTF-8'};
			return {'content-type': 'text/plain;charset=UTF-8','Content-Disposition': 'attachment; filename='+name+'.csv'};
		case "xls":
			return {'content-type': 'application/vnd.ms-excel; charset=UTF-8','Content-Disposition': 'attachment; filename='+name+'.xls'};
		case "html":
			return {'content-type': 'text/html; charset=UTF-8'};
		case "kml":
			//return {'content-type': 'application/xml'};
			return {'content-type': 'application/vnd.google-earth.kml+xml','Content-Disposition': 'attachment; filename='+name+'.kml'};
	}
}


/**
 * Clean double quote
 *
 * @param {String} str
 * @return {String}
 */
exports.cleanDblQuote = cleanDblQuote;

function cleanDblQuote(str){
	if(str!=undefined && str!=null && str.length>0){
		return str.replace(/\"/g, " ");
	}
	return str;
}

/**
 * Prepare string to URI uses
 *
 * @param {String} str
 * @return {String}
 */
exports.encodeURI = function(str){
	if(str!=undefined && str!=null && str.length>0){
		return str.replace(/\"/g, " ").replace(/\s/g, "%20");
	}
	return str;
}

/**
 * Set the results in the format requested
 *
 * @param {Object} config
 * 		@member {response} res (to write the output)
 * 		@member {String} format 
 * 		@member {Function} cb (callback, optional) 
 * @param {Array} stb
 * @param {Number} num  
 */
exports.translate = function(config,stb,num){
	config.res.writeHead(200,getHead(config.format,config.COLLECTION_NAME));
	switch(config.format){
		case "json":
			if(config.cb){config.res.write(config.cb+"(");}
			config.res.write("{\"results\":{");
			config.res.write("\"count\":" + num + ",");
			config.res.write("\"items\":[");
			break;
		case "xls":
			config.res.write("<table>");
			break;
		case "html":
			config.res.write("<!DOCTYPE html><html><head><link type='text/css' href='/css/table.css' rel='stylesheet' /></head><body>");	
			config.res.write("<table>");
			break;
		case "kml":
			config.res.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\r");
			config.res.write("<kml xmlns=\"http://www.opengis.net/kml/2.2\"><Document>");
			break;
		case "layar":
			config.res.write("{\"hotspots\":[");
			break;
	}
	
	config.res.write(stb.join("").slice(0,stb.join("").length-1));
	
	switch(config.format){
		case "json":
			config.res.write("]}}");
			if(config.cb){config.res.write(");");}
			break;
		case "xls":
			config.res.write("</table>");
			break;
		case "html":
			config.res.write("</table></body></html>");
			break;
		case "kml":
			config.res.write("</Document></kml>");
			break;
		case "layar":
			config.res.write("],");
			config.res.write("\"layer\": \""+config.COLLECTION_NAME+"\",");
			config.res.write("\"errorString\": \"ok\","); 
			config.res.write("\"errorCode\": 0");			
			config.res.write("}");
			break;

	}
	config.res.end();
}


/**
 * Private members to translate formats
 */
var formats = {
	stb : [],
	format : "",
	first_key : "",
	
	/**
	* Loop over object and child objects
	* @param {Object} obj
	*/

	loopObj : function(obj){
		for(var _k in obj){
			if(obj[_k] && typeof(obj[_k])=="object"){

				if(formats.format=="layar"){
					formats.stb.push(_k,":");
				}else if(formats.format=="html"){
					if(formats.stb[formats.stb.length-1]=="</td>" || formats.stb[formats.stb.length-1]=="</table></td>"){
						formats.stb.push("<td><table>");
					}
					if(formats.stb[formats.stb.length-1]!="<tr>"){
						formats.stb.push("<tr>");
					}
				}
					
				formats.loopObj(obj[_k]);

				if(formats.format=="html"){
					if(formats.stb[formats.stb.length-1]!="</tr>"){
						formats.stb.push("</tr>");
					}
					if(!obj.length && formats.stb[formats.stb.length-1]=="</tr>"){
						formats.stb.push("</table></td>");
					}
				}
			}else{
				switch(formats.format){
					case "csv":
						formats.stb.push("\"",obj[_k],"\",");
						break;
					case "xls":
						formats.stb.push("<td>",obj[_k],"</td>");
						break;
					case "html":
						formats.stb.push("<td class='",_k,"'>",obj[_k]?obj[_k]:"-","</td>");
						break;
					case "layar":
						formats.stb.push(_k,":",cleanDblQuote(obj[_k]),". ");
						break;
				}			
			}
		}
	},

	/**
	* Get csv output
	* @param {Object} obj
	* @return {String}
	*/
	getCSV : function(obj){
		formats.stb = [];
		formats.loopObj(obj);
		return formats.stb.join("").slice(0,formats.stb.join("").length-1)+"\r";
	},
	
	/**
	* Get xls output
	* @param {Object} obj
	* @return {String}
	*/
	getXLS : function(obj){
		formats.stb = [];
		formats.stb.push("<tr>");
		formats.loopObj(obj);
		formats.stb.push("</tr>");
		return formats.stb.join("")+" ";
	},
	
	/**
	* Get html output
	* @param {Object} obj
	* @return {String}
	*/
	getHTML : function(obj){
		formats.stb = [];
		formats.stb.push("<tr>");
		formats.loopObj(obj);
		formats.stb.push("</tr>");
		return formats.stb.join("")+" ";
	},
	
	/**
	* Get kml output
	* @param {Object} obj
	* @param {Object} fields
	* @param {Object} schema
	* @param {Object} meta	
	* @return {String}
	*/
	getKML : function(obj,fields,schema,meta){
		formats.stb = [];
		formats.stb.push("<Placemark>");
		
		//name
		var f, n=[];
		formats.stb.push("<name><![CDATA[");
		//si venen informats els camps a posar...
		if(fields.name){
			f = fields.name.split(",");
			for(var i=0;i<f.length;i++){
				if(obj[f[i]])
				formats.stb.push(obj[f[i]], " ");
			}
		}else if(meta && meta.geo && meta.geo.name){
			for(var i=0,z=meta.geo.name.length;i<z;i++){
				n.push(cleanDblQuote(obj[meta.geo.name[i]]),". ");
			}			
			formats.stb.push(n.join(""));
		}else{//si no, schema
			if(schema.name){
				formats.stb.push(obj["name"], " ");
			}else{
				for(var k in schema){break;}
				formats.stb.push(obj[k], " ");
			}
		}				
		formats.stb.push("]]></name>");
		
		//description
		formats.stb.push("<description><![CDATA[");
		if(fields.description){
			var fds;
			f = fields.description.split(",");
			for(var i=0;i<f.length;i++){
				if(f[i].indexOf(".")>-1){
					aux_o=obj;
					fds = f[i].split(".")
					for(var z=0;z<fds.length;z++){
						if(aux_o[fds[z]]){
							aux_o = aux_o[fds[z]];
						}
					}
				}else if(obj[f[i]]){			
					aux_o = obj[f[i]];
				}
				if(aux_o){formats.stb.push(f[i] + ": " + aux_o, ". ")};
			}				
		}else if(meta && meta.geo && meta.geo.description){
			formats.setDescriptionFromMeta(obj,meta.geo.description);
		}else{
			var i=0;
			for(var k in schema){
				if(i>0 && k!="loc" && k!="id"){
					formats.stb.push(obj[k], ". ");
				}
				i++;
			}
		}				

		formats.stb.push("]]></description>");
		
		var point = fields.point;
		
		if(meta.geo.field){
			point = meta.geo.field;
		}
		
		point = point.split(".");
		
		if(obj[point[0]]){
			if(meta.geo.field){
				var places = [];
				var commonFields = formats.stb.join("");
				
				for(var i=0;i<obj[point[0]].length;i++){
					if(obj[point[0]][i][point[1]]){
						places.push(commonFields,"<Point><coordinates>",obj[point[0]][i][point[1]][1],",",obj[point[0]][i][point[1]][0],",0</coordinates></Point></Placemark>");
					}
				}
				formats.stb = places;
			}else{
				formats.stb.push("<Point><coordinates>",obj[point[0]][1],",",obj[point[0]][0],",0</coordinates></Point>");
				formats.stb.push("</Placemark>");
			}
		}
		
		return formats.stb.join("")+" ";
	},
	
	/**
	* Get layar output
	* @param {Object} obj
	* @param {Object} meta
	* @return {String}
	*/
	getLayar : function(obj,meta){
		formats.stb = [];
		formats.stb.push("{\"id\":\"",obj.id,"\",");
		formats.stb.push("\"anchor\":{\"geolocation\":{\"lat\":",obj.loc[0],",\"lon\":",obj.loc[1],"}},");
		var n=[];
		if(meta && meta.geo && meta.geo.name){
			for(var i=0,z=meta.geo.name.length;i<z;i++){
				n.push(cleanDblQuote(obj[meta.geo.name[i]]),". ");
			}
		}else{n.push(cleanDblQuote(obj.name));}
		formats.stb.push("\"text\":{\"title\":\"",n.join(""),"\",\"description\":\"");

		if(meta && meta.geo && meta.geo.description){
			formats.setDescriptionFromMeta(obj,meta.geo.description);
		}else{
			for(var k in obj){
				if(k!="id" && k!="name" && k!="loc"){
					if(typeof(obj[k])=="object"){
						formats.loopObj(obj[k]);
					}else{
						formats.stb.push(cleanDblQuote(obj[k]),". ");
					}
				}
			}
		}
		formats.stb.push("\"},");
		//layar actions
		if(meta && meta.layar){
			formats.setLayarActions(obj,meta.layar);
		}	
		formats.stb.push("},");
		return formats.stb.join("");
	},
	
	/**
	* if meta.geo.description, set the description for layar and KML
	* @param {Object} obj
	* @param {String} description
	*/	
	setDescriptionFromMeta : function(obj,description){
		var c,o;
		for(var i=0,z=description.length;i<z;i++){
			c = description[i];
			if(c.indexOf(".")>-1){
				c = c.split(".");
				o=obj;
				for(var x=0;x<c.length;x++){
					if(o[c[x]]){
						o=o[c[x]];
					}
				}
				if(o && typeof(o)!="object"){
					formats.stb.push(description[i].replace("."," "),": ",cleanDblQuote(o),". ");
				}
			}else{
				formats.stb.push(cleanDblQuote(obj[c]),". ");
			}
		}
	},

	/**
	* if meta.layar, set the actions
	* @param {Object} obj
	* @param {Object} actions
	*/	
	setLayarActions : function(obj,actions){
		var c,o;
		formats.stb.push("\"actions\":[");
		for(var k in actions){
			switch(k){
				case "tel":
					formats.stb.push("{\"label\":\"Llamar\",\"uri\":\"tel:+34"+obj[actions[k]]+"\"}");
			}
		}
		formats.stb.push("]");

	}
	
	
}

