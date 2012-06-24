var geoservice_schemes = {};
function getCollections(col){
	$.getJSON("/collections?cb=?",
		function(result){
			var aux,first_schema = "";
			for(var i=0;i<result.length;i++){
				aux = result[i].name.slice(result[i].name.indexOf(".")+1);
				if(i==0){first_schema = aux};
				//if(aux!="farmacias"){
					$("<option value='" + aux + "'>" + aux + "</option>").appendTo("#collections");
				//}
			}
		
			var last = $("#collections option:last").val();
			$("#collections").change(
				function(){
					setContent(geoservice_schemes,this.value);
				}
			);
			$("#collections").children("option").each(
				function(i,v) {
					$.getJSON("/"+v.value+"/schema?cb=?", function(schema){
						geoservice_schemes[v.value] = schema;
						if(last==v.value){setContent(geoservice_schemes,col?col:first_schema,col);}
					});
				}				
			)
		}
	);
}

var _config = {
	location : "41.554,2.2510",
	equipamentscatalunya : {
		distance : 0.3,
		address : "montmelo",
		fields : 
		[
				{
					locality : "barcelona",
					cp : "08003"
				},
				{
					locality : "badalona",
					name : "biblioteca"
				}
		],
		distinct : 
		[
				{
					key : "locality",
					locality : "^mon"
				},
				{
					key : "cp",
					region : "^pallars"
				}
		],				
		mixed : 
		[
				{
					name : "biblioteca",
					loc : "41.554,2.2510",
					distance : 3
				},
				{
					name : "biblioteca",
					geoaddress : "Figueres",
					distance : 2
				}
		],
		format : [
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "csv"
			},
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "xls"
			},
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "kml",
				kml_name : "name",
				kml_description : "address,locality,cp"
			},				
		]
	},
	tdt : {
		distance : 4,
		address : "igualada",
		fields : 
		[
				{
					name : "terrassa"
				},
				{
					name : "igualada",
					"description.TVC1.freq" : "61"
				}
		],
		distinct : 
		[
				{
					key : "name",
					name : "^mon"
				},
				{
					key : "description.TVC1.freq",
					name : "^"
				}
		],					
		mixed : 
		[
				{
					"description.TVC1.freq" : "61",
					loc : "41.554,2.2510",
					distance : 10
				},
				{
					"description.TVC1.freq" : "61",
					geoaddress : "esparraguera",
					distance : 12
				}
		],
		format : [
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "csv"
			},
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "xls"
			},
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "kml",
				kml_name : "name",
				kml_description : "description.TVC1.estat,description.TVC1.freq"
			}			
		]				
	},
	common:	{	
		distance : 4,
		address : "barcelona",
		fields : 
		[
				{
					id : "153"
				},
				{
					"loc.0" : ">42.123",
					"loc.0" : "<42.456"
				}
		],
		distinct : 
		[
				{
					key : "id",
					id : "41"
				}
		],					
		mixed : 
		[
				{
					"id" : "<9",
					loc : "41.554,2.2510",
					distance : 10
				}
		],
		format : [
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "csv"
			},
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "xls"
			},
			{
				loc : "41.554,2.2510",
				distance : 10,
				format : "kml"
			}
		]
	}	
}
