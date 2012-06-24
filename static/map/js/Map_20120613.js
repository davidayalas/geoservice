function getCollection(){
	var path = window.location.pathname.split("/");
	return path[1];
}

function getDescription(obj,inf,lastk,putlastk){
	for(var k in obj){
		if(k!="id" && k!="loc"){
			if(typeof(obj[k])=="object"){
				getDescription(obj[k],inf,k,true)
			}else{
				inf.push((putlastk?lastk + " " + k + ": ":"")+ obj[k],". ");
			}
		}
	}
	return inf;
}

var labDT = {
	map : null,
	map_canvas : null,
	markerClusterer : null,	
	infowindow : null,
	circle : null,
	marker : null,
	maxZoom : 16,
	defaultRadius : 200,
	icon : "http://chart.apis.google.com/chart?cht=mm&chs=24x24&chco=FFFFFF,0099CC,000000&ext=.png",
	vizContainer : null,
	searchFrm : null,
	searchInput : null,
	areaInput : null,
	geocoder : null,

	createMarkersSearch : function (data){
		if(!data) return;
		results = data.results.items;
		if (this.markerClusterer) {
		  this.markerClusterer.clearMarkers();
		}	
		var _markers = [];
		var z;
		var _latlng;
	
		for(var i=0,z=results.length; i<z; i++){
			if(results[i].loc){
				_latlng = results[i].loc;
				_latlng = new google.maps.LatLng(_latlng[0],_latlng[1]);
				(function(){
					var marker = new google.maps.Marker({
						position: _latlng,
						icon : labDT.icon,
						title : results[i].name
					});
					var inf=[];
					inf = getDescription(results[i],inf,false);
					var infowindow = new google.maps.InfoWindow({
						content : inf.join("")
					});
					google.maps.event.addListener(marker, 'click', function() {
						infowindow.open(labDT.map,marker);
					});
					_markers.push(marker);
				})();
			}
		}
		this.markerClusterer = new MarkerClusterer(this.map, _markers, {
			maxZoom: labDT.maxZoom
		});
	},
	getData : function(){
		var pos = this.marker.getPosition();
		var radius = this.defaultRadius/1000;
		var cadena;
		$.getJSON("/"+getCollection()+"/search?loc=" + pos.lat() + "," + pos.lng() + "&distance=" + radius + "&cb=?",
		   function(data){
			  labDT.createMarkersSearch(data);
		   }
		);
	},
	codeAddress : function(address){
		labDT.geocoder.geocode( { 'address': address}, function(results, status) {
		  if (status == google.maps.GeocoderStatus.OK){
			if(labDT.marker==null){
				labDT.createMarker(results[0].geometry.location);
			}
			labDT.map.setCenter(results[0].geometry.location);
			labDT.marker.setPosition(results[0].geometry.location)
			labDT.getData();
		  }else {
			alert("Error geocoding");
		  }			
		});
	},
	createMarker:function(pos){
		this.marker = new google.maps.Marker({
			position: pos, 
			map: this.map,
			title : "current position",
			draggable : true
		}); 
		
		this.circle = new google.maps.Circle({
		  map: this.map,
		  radius: 200
		});
		
		this.circle.bindTo('center', this.marker, 'position');
		google.maps.event.addListener(this.marker, 'dragend', function() {
			labDT.getData();
		});
	},
	init : function(_config){
		if(!document.getElementById) return;
		if(!_config.canvas || _config.canvas==null) return;
		
		this.canvas = _config.canvas;
		this.searchFrm = _config.searchForm;
		this.searchInput = _config.searchText;
		this.geocoder = new google.maps.Geocoder();

		if(_config.onclicksearch!="" && _config.search!=""){
			if(document.getElementById(_config.onclicksearch)){
				document.getElementById(_config.onclicksearch).onclick = function(){
					labDT.getData();
				}
			}
		}

		if(_config.searchFrm!=""){
			if(document.getElementById(this.searchFrm)){
				document.getElementById(this.searchFrm).onsubmit = function(){
					if($("#"+labDT.searchInput).val()!=""){
						labDT.codeAddress($("#"+labDT.searchInput).val());
					}else{
						labDT.getData();
					}
					return false;
				}
			}
		}
		
		if(_config.onchangesearch!="" && _config.search!=""){
			if(document.getElementById(_config.onchangesearch)){

				document.getElementById(_config.onchangesearch).onchange = function(){
					labDT.circle.setRadius(parseInt(this.value));
					labDT.defaultRadius = this.value;
					labDT.getData();
				}
			}
		}
		
		var pos = new google.maps.LatLng(41.818408,1.590271);
		var myOptions = {
			zoom: 14,
			center: pos,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(document.getElementById(this.canvas), myOptions);
		if(navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				labDT.map.setCenter(pos);
				labDT.createMarker(pos);
				labDT.getData();
			}, function(){
				labDT.createMarker(pos);
				labDT.getData();
			});		
		}else{
			this.createMarker(pos);
			this.getData();
		}			
	}
}

window.onload = function(){
	detectBrowser();
	labDT.init({
		canvas : "map",
		searchText : "cerca",
		searchForm : "search",
		area : "area",
		onclicksearch : "enviar",
		onchangesearch : "area" //range input
	})
}

function detectBrowser() {
  var useragent = navigator.userAgent;
  var mapdiv = document.getElementById("map");
  var D = document;
  var height = Math.max(
		Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
		Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
		Math.max(D.body.clientHeight, D.documentElement.clientHeight)
  )-28;
		 
  if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1 ) {
	mapdiv.style.width = '100%';
	mapdiv.style.height = height + "px";
	window.scrollTo(0, 1);
  } else {
	mapdiv.style.width = '100%';
	mapdiv.style.height = height + "px";
  }
}