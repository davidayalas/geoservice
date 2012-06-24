/**
 * Dependencies
 */
var 
http = require('http'),
dbcfg = require('../config/db'),
utils= require('../utils/common'),
formats = require('../utils/formats');

var DB=null;

/**
 * Set the global DB to manage
 *
 * @param {MongoDB} _db
 */
exports.setDB = function(_db){
	DB = _db;
}

function testDB(res){
	if(!DB){ 
		res.write("Database not setted");
		res.end();
		return;
	}
}

/**
 * Set typeof members of the object schema
 *
 * @param {Object} obj
 */
function setTypeMembers(obj){
	for(var _k in obj){
		if(typeof(obj[_k])=="object"){
			setTypeMembers(obj[_k]);
		}else{
			obj[_k] = typeof(obj[_k]);
		}
	}
	return obj;
}
/**
 * write schema to output
 *
 * @param {Response} res 
 * @param {Object} obj
 * @param {String} cb
 */
function writeSchema(res,obj,cb){
	if(obj){
		delete obj["_id"];
		delete obj["updating"];
		delete obj["lastupdate"];
		delete obj["fulltext"];	
		if(cb){res.write(cb+"(");}
		res.write(JSON.stringify(setTypeMembers(obj)));
		if(cb){res.write(");");}
	}
	res.end();
}

/**
 * get one schema from collection
 *
 * @param {Response} res 
 * @param {String} db_collection
 * @param {String} cb
 */
exports.getSchema = function(res, db_collection, cb){
	testDB(res);
	DB.collection(dbcfg.metadata, function(err, metadata){
		metadata.findOne({"name":db_collection},function(err, metadoc){
			if(err==null){
				DB.collection(db_collection, function(err, collection){
					if(err!=null){res.end();return;}
					var query={};
					if(metadoc && metadoc.findone && metadoc.findone!=""){
						query=JSON.parse(metadoc.findone);
					}
					collection.findOne(query,function(err, obj){
						if(err!=null || obj==null){
							collection.findOne({},function(err, obj){
								if(err!=null){
									res.end();
								}else{
									writeSchema(res,obj,cb);
								}
							});
						}else{		
							writeSchema(res,obj,cb);
						}
					});
				});
			}else{
				if(cb){res.write(cb+"()");}
				res.end();
				return;
			}
		});
	});
}

/**
 * get collections
 *
 * @param {Response} res 
 * @param {String} cb
 */
exports.getCollections = function(res, cb){
	testDB(res);
	DB.collectionNames(function(err, collections){
		if(err!=null){res.end();return;}
		for(var i=collections.length-1,z=0;i>=z;i--){
			if(collections[i].name.indexOf("system")>-1 || collections[i].name.indexOf(dbcfg.metadata)>-1 || collections[i].name.indexOf("_test")>-1 || collections[i].name.indexOf("_bck")>-1){
				collections.splice(i,1);
			}
		}
		if(cb){res.write(cb+"(");}
		res.write(JSON.stringify(collections).replace(new RegExp(dbcfg.DB_NAME+".","ig"),""));
		if(cb){res.write(");");}
		res.end();
	});
}

/**
 * get distinct key
 *
 * @param {Response} res 
 * @param {String} config
 * @param {String} key
 * @param {String} cb
 */
exports.getDistinct = function(res, config, key, cb){	
	if(!config.fields || config.fields.length==0){
		res.write("query not setted");
		res.end();
		return;
	}
	testDB(res);
	res.writeHead(200,formats.getHead("json"));
	DB.collection(dbcfg.metadata, function(err, metadata){
		metadata.findOne({"name":config.COLLECTION_NAME},function(err, metadoc){
			DB.collection(config.COLLECTION_NAME, function(err, collection){
				var query={};
				if(metadoc && metadoc.findone && metadoc.findone!=""){
					query=JSON.parse(metadoc.findone);
				}			
				collection.findOne(query,function(err, sch){	
					var q = {};
					q = createSearch(config, sch, metadoc);
					if(err!=null){return;}
					var i=0;
					
					for(var k in q){
						if(i>1){break;}
						i++;
					}
					
					if(i<=1){
						res.write("error");
						res.end();
					}
					collection.distinct(key,q,function(err, values){
						var re = new RegExp(config.fields[key],"ig");
						for(var i=values.length-1,z=0;i>=0;i--){
							if(re && (!values[i] || !values[i].match(re))){
								values.splice(i,1);
							}
						}
						
						values.sort();
						if(cb){res.write(cb+"(");}
						res.write(JSON.stringify(values));
						if(cb){res.write(");");}
						res.end();
					});
				});
			});
		});
	});
}

/**
 * Geocode address.
 *
 * @param {String} address
 * @param {Object} config
 * 		@member {response} res (to write the output)
 * 		@member {Number} distance 
 * 		@member {Object} fields 
 * 		@member {String} COLLECTION_NAME 
 * 		@member {Number} skip 
 * 		@member {String} format 
 * 		@member {Function} cb (callback, optional) 
 */
exports.geocode = function(address,config){
	http.get({host: 'maps.googleapis.com', path:'/maps/api/geocode/json?address='+address+'&sensor=false'}, 
		function(resp) {  
			var data = '';
			resp.on('data', function(chunk){  
				data += chunk;
			});
			resp.on('end', function(){  
				result = JSON.parse(data);
				if(result.results.length>0){
					config.lat = result.results[0].geometry.location.lat*1;
					config.lng = result.results[0].geometry.location.lng*1;
					exec(config);
				}
			});
		}
	).on('error', function(e) {
		config.res.write("geocoding error");
		config.res.end();
	});   		
}

/**
 * Eval single param return object
 *
 * @param {String} s value of the field requested
 * @param {String} type typeof value 
 * @return {Object}
 */
function evalParam(s,type){
	if(!s || s.length==0) return;
	var op = s;
	if(op.indexOf("&gte;")==0){s=s.replace("&gte;",">=");}	
	else if(op.indexOf("&lte;")==0){s=s.replace("&lte;","<=");}	
	op = s.slice(0,1);
	if(s.length>=2){
		op = s.slice(1,2)=="=" ? op+"=" : op;
	}
	if(op.indexOf(">")>=0 || op.indexOf("<")>=0){
		s = s.replace(op,"");
	}
	//numeric field type
	//if(""+parseFloat(s)==s && type=="number"){s=s*1;type="number";}
	if(type=="number"){s=s*1;type="number";}
	if(op.indexOf("<")==-1 && op.indexOf(">")==-1){
		if(type=="number"){
			return s;
		}else{
			return {"$regex":s,"$options":"i","$exists":true};
		}
	}else{
		switch(op){
			case ">": return {"$gt":s,"$exists":true};
			case "<": return {"$lt":s,"$exists":true};
			case ">=": return {"$gte":s,"$exists":true};
			case "<=": return {"$lte":s,"$exists":true};
		}
	}
}

/**
 * Create search object evaluating query params
 *
 * @param {Object} config
 * @param {Object} schema for field setting
 * @param {Object} meta
 * @return {Object}
 */
function createSearch(config,schema,meta){
	var earthRadius = config.earthRadius || 6371;
	var search = {};
	//position
	if(config.lat && config.lng && config.distance){
		var geofield = "loc";
		if(meta && meta.geo && meta.geo.field){geofield = meta.geo.field;}
		search[geofield] = {
			$nearSphere:[config.lat,config.lng],
			$maxDistance : config.distance/earthRadius
		}
	}
	//fields
	var s,o,u,or=[],aux,range,i,t,a,aux;
	//search["$and"] = [];
	for(var _f in config.fields){
		//eval type of operation, if necessary 
		aux = {};
		t=_f.indexOf(".")>-1?_f.slice(0,_f.indexOf(".")):_f;
			
		//get field type	
		aux = _f.split(".");
		a=schema;
		for(i=0;i<aux.length;i++){
			if(a[aux[i]]){a=a[aux[i]];}
		}

		if(schema[t]){
			switch(typeof(config.fields[_f])){
				case "string":
					search[_f] = evalParam(config.fields[_f],a);
					break;
				case "object":
					o={},u=[],aux;
					for(i=0;i<config.fields[_f].length;i++){
						s = config.fields[_f][i];
						o = evalParam(config.fields[_f][i],a);
						//for(var _key in o){}
						if(s.indexOf("&gt;")==-1 && s.indexOf("&gte;")==-1 && s.indexOf("&lt;")==-1 && s.indexOf("&lte;")==-1){
							aux[_f]=o;
							or[or.length] = {};
							or[or.length-1][_f]=aux[_f];
						}else{
							range = true;
							aux={};
							aux[_f] = o;
							u.push(aux);
						}
					}
					if(range){
						search["$and"] = u;
					}/*else{
						search["$and"][search["$and"].length] = {};
						search["$and"][search["$and"].length-1]["$or"] = or;
					}*/
					break;
			}
		}
	}
	//OR conditions
	if(or.length>0){
		search["$or"] = or;
	}
	//if(search["$and"].length==0) delete search["$and"];
	search["updating"] = {$exists:false};
	return search;
}

/**
 * Check if a point is inside a circle ( (lat, lon) + distance )
 *
 * @param {Num} lat1
 * @param {Num} lon1
 * @param {Num} lat2
 * @param {Num} lon2
 * @param {Num} distance
 * @return {Boolean}
 */
function checkDistance(lat1,lon1,lat2,lon2,distance){
	if(!lat1 || !lon2 || !lat2 || !lon2 || !distance) return false;
	var R = 6371; // km
	var dLat = (lat2-lat1)*(Math.PI/180);
	var dLon = (lon2-lon1)*(Math.PI/180);
	var lat1 = lat1*(Math.PI/180);
	var lat2 = lat2*(Math.PI/180);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return((R * c)<=distance);
}

/**
 * Check if a doc is valid in a geosearh
 *
 * @param {Object} config
 * @param {Object} doc
 * @param {Array} geofield
 * @return {Object}
 */
function checkItemInsideRadius(config,doc,geofield){
	if(typeof(doc[geofield[0]])=="object"){
		if(typeof(doc[geofield[0]][0])=="object"){
			var del = [];
			var inside;
			for(var k in doc[geofield[0]]){
				inside = true;
				if(config.lat && config.lng && doc[geofield[0]][k][geofield[1]]){
					if(!checkDistance(config.lat,config.lng,doc[geofield[0]][k][geofield[1]][0],doc[geofield[0]][k][geofield[1]][1],config.distance)){
						inside = false;
					}
				}else if(!doc[geofield[0]][k][geofield[1]]){
					inside = false;
				}
				
				if(!inside && doc[geofield[0]].length){
					del.push(parseInt(k));
				}else if(!inside){
					delete doc[geofield[0]][k];
				}

			}
			
			if(del.length>0){
				for(var i=del.length-1;i>=0;i--){
					doc[geofield[0]].splice(del[i],1)
				}
			}
		}
	}
	return doc;
}

/**
 * Set sort values 
 *
 * @param {Object} config
 */
function setSortValues(config){
	var s;
	if(typeof(config.sort)=="object"){
		s=config.sort.join("|");
	}else{
		s=config.sort;
	}
	s=s.split("|");
	var o;
	config.sort={};
	for(var i=0;i<s.length;i++){
		if(s[i].indexOf(",")>-1){
			o=s[i].slice(s[i].indexOf(",")+1);
			s[i]=s[i].slice(0,s[i].indexOf(","));
			if(o=="desc"){o=-1;}
			else{o=0;}
		}
		config.sort[s[i]]=o;
	}
}

/**
 * Search on the database 
 *
 * @param {Object} config
 * 		@member {response} res (to write the output)
 * 		@member {Number} lat 
 * 		@member {Number} lng  
 * 		@member {Number} distance 
 * 		@member {Object} fields
 * 		@member {String} COLLECTION_NAME 
 * 		@member {Number} skip 
 * 		@member {String} format 
 * 		@member {Object|String} sort 
 * 		@member {Function} cb (callback, optional) 
 */
exports.exec = exec;

function exec(config){
	testDB(config.res);
	var stb = [];

	//first, search metadata collection for findone query, to get full schema keys.
	DB.collection(dbcfg.metadata, function(err, metadata){
		metadata.findOne({"name":config.COLLECTION_NAME},function(err, metadoc){
			DB.collection(config.COLLECTION_NAME, function(err, collection){
				var query={};
				if(metadoc && metadoc.findone && metadoc.findone!=""){
					query=JSON.parse(metadoc.findone);
				}			
				collection.findOne(query,function(err, sch){
					if(err!=null){
						console.error("error exec search");
						config.res.write("error");
						config.res.end();
						return;
					}
					//we get a schema
					if(sch==null){
						collection.findOne({},function(err, sch){
							if(sch==null){
								config.res.end();return;
							}else{
								launchSearch(config,sch,metadoc,collection,stb);
							}
						});	
					}else{
						launchSearch(config,sch,metadoc,collection,stb);
					}
				});
			});
		});
	});
}


/**
 * Search on the database 
 *
 * @param {Object} config
 * 		@member {response} res (to write the output)
 * 		@member {Number} lat 
 * 		@member {Number} lng  
 * 		@member {Number} distance 
 * 		@member {Object} fields
 * 		@member {String} COLLECTION_NAME 
 * 		@member {Number} skip 
 * 		@member {String} format 
 * 		@member {String} fulltext --> only for full text searches 
 * 		@member {Object|String} sort 
 * 		@member {Function} cb (callback, optional) 
 * @param {Object} sch
 * @param {Object} metadoc
 * @param {Object} collection
 * @param {Array} stb
 */
function launchSearch(config,sch,metadoc,collection,stb){
	delete sch._id;
	delete sch.updating;
	sch=setTypeMembers(sch);

	//create search and sort objects
	var search = createSearch(config, sch, metadoc);
	if(config.fulltext){//Full text search regexps 
		var tk = utils.flattenWord(config.fulltext).split(" ");
		var s=[];
		for(var ky in tk){
			s.push("(?=.*(\\s)",tk[ky],"(\\s))");
		}
		//console.log(s.join(""))
		search["fulltext"]= new RegExp(s.join(""));
	}
	if(config.sort){
		setSortValues(config);
	}
	if(config.sort){
		for(var k in config.sort){
			if(!search[k]){	
				search[k] = {"$exists":true};
			}
		}
	}
	collection.count(search, function(err, num){
		if(err==null){
			collection.find(search,{'skip':config.skip,'limit':100,'sort':config.sort||{}},function(err, cursor) {
				
				var geofield = "loc";
				if(metadoc && metadoc.geo && metadoc.geo.field){geofield = metadoc.geo.field;}
				geofield = geofield.split(".");
				
				cursor.each(function(err, doc){
					try{
						if(!doc){
							cursor.close(function(){
								formats.translate(config,stb,num);
							});
							return;
						}
						delete doc["_id"];delete doc["lastupdate"];delete doc["fulltext"];
						doc = checkItemInsideRadius(config,doc,geofield);
						//console.log(doc)
						stb.push(formats.get(doc,config.format,config.kml,sch,metadoc));
						if(config.format=="json"){
							stb.push(",");
						}
					}catch(e){
						console.log(""+e);
						config.res.end();
					}
				});		
			});
		}else{
			config.res.write(err.toString());	
			config.res.end();
			return;
		}
	});
}