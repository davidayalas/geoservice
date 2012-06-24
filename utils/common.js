/**
 * trim all spaces
 *
 * @param {String} text
 * @return {String}
 */	
exports.trim=function(stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g,"");
}

/**
 * trim spaces on the left side
 *
 * @param {String} text
 * @return {String}
 */	
exports.ltrim=function(stringToTrim) {
	return stringToTrim.replace(/^\s+/,"");
}


/**
 * trim spaces on the right side
 *
 * @param {String} text
 * @return {String}
 */	
exports.rtrim=function(stringToTrim) {
	return stringToTrim.replace(/\s+$/,"");
}

/**
 * Decode HTML Entities
 *
 * @param {String} text
 */	
exports.decodeHtmlEntities=function(text){
  var decoded = [];
  var entity = "";
  for (var i=0; i<text.length; i++) {
	if(text.slice(i,i+1)=="&"){
		entity = "";	
		while(text.slice(i,i+1)!=";"){
			if(text.slice(i,i+1)!="#" && text.slice(i,i+1)!="&"){
				entity += text.slice(i,i+1);
			}
			i++;
		}
		decoded.push(String.fromCharCode(entity));
	}else{
		decoded.push(text.slice(i,i+1)); 
	}
  }
  return decoded.join("");
}

/**
 * Translate to unicode
 *
 * @param {String} theString
 * @return {String}
 */
exports.toUnicode = function(theString) {
  var unicodeString = '';
  theString = theString.toLowerCase();
  for (var i=0; i < theString.length; i++) {
	if(theString.charCodeAt(i)>=128){
		var theUnicode = theString.charCodeAt(i).toString(16);
		while (theUnicode.length < 4) {
			theUnicode = '0' + theUnicode;
		}	
		theUnicode = '\\u' + theUnicode;
		unicodeString += theUnicode;
	}else{
		unicodeString += theString.slice(i,i+1);
	}
  }
  return unicodeString;
}

/**
 * Translate to unicode
 *
 * @param {String} theString
 * @return {String}
 */
exports.decodeUnicode = function(theString) {
  return new String(theString);
}

/* flatten words without diacritics */
exports.flattenWord=function(str){
	try{
		str=decodeURIComponent(str.toLowerCase());
	}catch(e){
		str=str.toLowerCase();
	}
	var rExps=[
		{re:/[\xE0-\xE6]/g, ch:'a'},
		{re:/[\xE8-\xEB]/g, ch:'e'},
		{re:/[\xEC-\xEF]/g, ch:'i'},
		{re:/[\xF2-\xF6]/g, ch:'o'},
		{re:/[\xF9-\xFC]/g, ch:'u'},
		{re:/[\xF1]/g, ch:'n'} 
	];

	for(var i=0, len=rExps.length; i<len; i++){
		str=str.replace(rExps[i].re, rExps[i].ch);
	}
	return str;
}
