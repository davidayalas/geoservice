$.getJSON("/metadata/search?id=^&cb=?",
	function(data){
		for(var i=0,z=data.results.count;i<z;i++){
			$("<li><strong>"+data.results.items[i].description+"</strong><br />Fuente: <a href='"+data.results.items[i].source_link+"'>"+data.results.items[i].source+"</a><br />&Uacute;ltima actualizaci&oacute;n: "+data.results.items[i].updated+"<br />Ver <a href='/"+data.results.items[i].name+"/explorer'>Explorer</a> o <a href='/"+data.results.items[i].name+"/map'>Mapa</a> <br /><br /></li>").appendTo("#catalogs");
		}
	}
);