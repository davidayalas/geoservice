//set autocomplete and other
function setAutocomplete(field,key){
	var _i = $("#"+field).closest(".bloc").attr("blocn");
	if($("#field"+_i).val()!="geoaddress"){
		$("#sort"+_i).addClass("visible");
		$("#sort"+_i).removeClass("hidden");
		$("#compare"+_i).removeClass("hidden");
		$("#compare"+_i).addClass("visible");
		$("#range"+_i).removeClass("visible");
		$("#range"+_i).addClass("hidden");
		$("#"+field).autocomplete({
			source: function( request, response ) {
				$.ajax({
					url: "/"+$("#collections").val()+"/distinct?key="+key+"&cb=?",
					dataType: "jsonp",
					data: {
						query: "^"+$("#"+field).val()
					},
					success: function( data ) {	
						response( $.map( data, function( item ) {
							return {
								label: item,
								value: item
							}
						}));
					}
				});
			},
			minLength: 2
		});
	}else{
		$("#"+field).autocomplete("disable");
		$("#sort"+_i).addClass("hidden");
		$("#sort"+_i).removeClass("visible");
		$("#range"+_i).removeClass("hidden");
		$("#range"+_i).addClass("visible");
		$("#compare"+_i).removeClass("visible");
		$("#compare"+_i).addClass("hidden");
	}
}

function changeRangeValue(field){
	var r = $(field).next(".rangevalue");
	$(r).empty();
	$(r).html("<span>("+$(field).val()+" m)</span>");
} 

function loopObj(obj,tmp,allk){
	for(var _k in obj){
		if(typeof(obj[_k])=="object"){
			loopObj(obj[_k],tmp,allk+"."+_k);
		}else{
			tmp.push("<option value='",allk+"."+_k,"'>",allk+"."+_k,"</option>");
		}
	}
}

//field block template
var idblock = 0;
function fieldBuilderTemplate(){
	var tmp = [];
	var compare = {
		"LIKE" : "is like ",
		">" : "is greater than (>)",
		">=" : "is greater or equals than (>=)",
		"<" : "is less than(<)",
		"<=" : "is less or equals than (<=)"
	};
	tmp.push("<div class='bloc' blocn='"+idblock+"'>");
	tmp.push("<select name='field' id='field"+idblock+"' onchange='setAutocomplete(\"query"+idblock+"\",this.value)'>");
	var c=0,f_k;
	for(var k in geoservice_schemes[$("#collections").val()]){
		if(c==0){f_k=k;c++} 
		if(k=="loc"){
			tmp.push("<option value='geoaddress'>geoaddress</option>");
		}else{
			switch(typeof(geoservice_schemes[$("#collections").val()][k])){
				case "string":
					tmp.push("<option value='",k,"'>",k,"</option>");
					break;
				case "object":
					loopObj(geoservice_schemes[$("#collections").val()][k],tmp,k);
					//tmp.push("<option value='",k,"'>",k,"</option>");
					break;
			}
		}
	}
	tmp.push("</select>");
	tmp.push("<select name='compare' id='compare"+idblock+"'>");
	for(var k in compare){
		tmp.push("<option value='",k,"'>",compare[k],"</option>");
	}
	tmp.push("</select>");
	tmp.push("<input type='text' id='query"+idblock+"' >");
	tmp.push("<span id='sort"+idblock+"'><input type='checkbox' id='sortASC"+idblock+"' onchange='evalcheck(\"asc\","+idblock+")'> <label for='sortASC"+idblock+"'>sort ASC</label> <input type='checkbox' id='sortDESC"+idblock+"' onchange='evalcheck(\"desc\","+idblock+")'><label for='sortDESC"+idblock+"'>sort DESC</label></span> ");
	tmp.push("<span id='range"+idblock+"' class='hidden'><label for='rangeinput"+idblock+"'>distance: </label><input type='range' id='rangeinput"+idblock+"' min='100' max='10000' value='200' step='100' onchange='changeRangeValue(this)'/> <span class='rangevalue' id='rangevalue"+idblock+"'>(200 m)</span></span>");
	tmp.push("<a href='#' class='action icon delete' onclick='$(this).closest(\".bloc\").remove();evalexec();'>&nbsp;</a>");
	tmp.push("</div>");
	idblock++;
	$(tmp.join("")).insertBefore("#execquery");
	setAutocomplete("query"+(idblock-1),f_k)
	evalexec();
	return false;
}

function evalcheck(type,_idblock){
	var t = type.toUpperCase();
	var t2 = t=="ASC"?"DESC":"ASC";
	var v=$("#sort"+t+_idblock).attr("checked");
	if(v){
		$("#sort"+t2+_idblock).attr("checked",false);
	}
}

function evalexec(){
	if($(".bloc").size()>0){
		$("#execquery").css("display","block");
	}else{
		$("#execquery").css("display","none");
		getData();
	}
}

function setContent(geoservice_schemes,schema,col){
	var model = [];
	var f;

	if(col==""){
		$("#collections").attr("class","visible");
		$("#service").attr("class","visible");
	}else{
		if(col){
			$("#collections").val(col);
		}	
	}

	for(var k in geoservice_schemes[schema]){
		f={};
		f["display"] = k; 
		f["name"] = k; 
		f["width"] = 100; 
		f["sortable"] = true;
		model.push(f);
	}
	var options = {
		url : " ",
		dataType: 'json',
		title : $("#collections").val(),
		colModel : model,		
		usepager : true,
		useRp : false,
		rp : 100,
		height: screen.height>600?(screen.height-400):400
	}

	$("#querybuilder").empty();
	$('<form onsubmit="getData();return false;" action="#"><a href="#" class="action" onclick="return fieldBuilderTemplate()"><span class="icon add">&nbsp;</span> Add a field to the query</a><div class="clear"></div><input type="submit" id="execquery" value="execute query" /></form>').appendTo("#querybuilder");

	$("#datatable").empty();
	var _o = $("#datatable").remove();
	$(".flexigrid").remove();
	$(_o).appendTo("#content");
	$("#datatable").flexigrid(options);
	
	getData(1);
}
	
function getData(page,sort,order){
	//set the url params
	page = page || 1;
	var params = [];
	if(page>1){
		params.push("&skip=",(((page*1)-1)*100));
	}
	if(sort){
		params.push("&sort=",sort,",",order);
	}
	var collection = $("#collections").val();
	var z = $(".bloc").size();
	var aux;
	$(".bloc").each(
		function(){
			var i=$(this).attr("blocn");
			aux = $("#compare"+i).val();
			if($("#query"+i).val()){
				params.push("&",$("#field"+i).val(),"=",aux!="LIKE"?encodeURIComponent(aux):"",encodeURIComponent($("#query"+i).val()))
				if($("#field"+i).val()=="geoaddress"){
					params.push("&distance=",(($("#rangeinput"+i).val()*1)/1000))
				}
			}
			if($("#sortASC"+i).attr("checked") || $("#sortDESC"+i).attr("checked")){
				var order=$("#sortASC"+i).attr("checked")?"asc":"desc";
				params.push("&sort=",$("#field"+i).val(),",",order)
			}
		}
	);

	if(z==0) params.push("&id=%3E0");
	//get the data
	$.getJSON("/"+collection+"/search?"+params.join("")+"&cb=?", function(data){
		if(data){
			var d = {};
			d["page"] = ((page*100)/100);
			d["total"] = data.results.count;
			d["rows"] = [];
			var row;
			for(var i=0,z=data.results.items.length;i<z;i++){
				row = {};
				for(var k in data.results.items[i]){
					if(k=="id"){
						row["id"]=data.results.items[i].id;
					}
					if(!row.cell){row["cell"]={};}
					
					row["cell"][k]=typeof(data.results.items[i][k])=="object" ? JSON.stringify(data.results.items[i][k]) : data.results.items[i][k];
				}				
				d["rows"].push(row);
			}
			$("#datatable").flexAddData(d);
			
			//exports
			var tmp = [];
			var format_i=-1;
			if(_config[collection]){
				for(var i=0;i<_config[collection].format.length;i++){
					for(var _key in _config[collection].format[i]){
						if(_key=="kml_name"){
							format_i=i;
							i=_config[collection].format.length;
						}
					}
				}
			}

			var url_init = window.location.protocol +"//" + window.location.host + "/" + $("#collections").val() +"/search?" + params.join("").slice(1);
			
			var kml;
			if(format_i>-1){
				kml = url_init + "&format=kml&kml_name="+_config[collection].format[format_i].kml_name+"&kml_description="+_config[collection].format[format_i].kml_description;
			}else{
				kml = url_init + "&format=kml";
			}
			tmp.push("<a href='",kml,"'>KML</a> | ");
			tmp.push("<a href='",url_init,"&format=csv'>CSV</a> | ");
			tmp.push("<a href='",url_init,"&format=xls'>XLS</a> | ");
			tmp.push("<a href='",url_init,"'>URL</a> | ");
			tmp.push("<a href=\"http://maps.google.com?q=",encodeURIComponent(kml),"\" target='_blank'>View map</a>");
			$("#exports").empty();
			$("#exports").html(tmp.join(""));
		}
	});
}

var path = window.location.pathname.split("/");
getCollections(path.length>=3?path[1]:"");