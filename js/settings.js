var wsbase;
var netstaticon = '';
var enckey = '';
var platform ='';
var devicename = 'PC';
var devicemodel = '';
var isonline = true;
var hasPhoneGap = false;
var appVersion='';
var ajax_timeout = 5000;
var http_method = 'GET';
var ext_auth = false;
var alg_authmethode =  -1;

// Try catch block, so this call won't result in errors (only ment for mobile/gap use!
try { document.addEventListener("deviceready", onDeviceReady, false); }
catch (err) {}

getAuthMethod();
function getAuthMethod() {
		var t = localStorage.alg_authmethode;
		if (t==null || t=='') 
			localStorage.alg_authmethode = -1;
		alg_authmethode = t;
}

function addShake() {
	try {
		window.addEventListener('shake', shakeEventDidOccur, false);
	}
	catch (err) {}
}
function onDeviceReady() {
	try {
		hasPhoneGap = true;
		platform = device.platform;
		devicename = device.name; 
		devicemodel = device.model;
		// Added some extra auth methods to get around the Android 401 errors, but not needed for ios, so disabled here.. 
		if (platform=='IOS') 
			ext_auth = true;
	}
	catch (err) {
		alert('error on ondeviceready:' + err);
	}
}
function initKey() {
	if (!localStorage.enckey) {
		enckey = generatePrivateKey(50);
		localStorage.enckey = enckey;
	}
	else
		enckey = localStorage.enckey;
}
initKey();


function generatePrivateKey(limit) {
    limit = limit || 24;
    var privatekey = '';
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:;><!"£$%&/()=?^*°#_-@+[]{}|,.§ç';
    var list = chars.split('');
    var len = list.length, i = 0;
    do {
      i++;
      var index = Math.floor(Math.random() * len);
      privatekey += list[index];
    } while(i < limit);
    
	return privatekey;
}
function Validate(funct) {

	if (Decr(localStorage.alg_username)=='' || Decr(localStorage.alg_password) =='') {
		alert('Vul uw username/password in bij Instellingen!');
		try{navigator.splashscreen.hide();}
		catch(err) {}
		location='settings.html';
	}
	else if (Decr(localStorage.ws_username)=='' || Decr(localStorage.ws_password) =='') {
		alert('Vul de username/password in voor de webservices bij Instellingen!');
		try{navigator.splashscreen.hide();}
		catch(err) {}
		
		location='settings.html';
	}
	else
	{
		generic_ajax_sync('standby.asmx/ValidateUserEnc',
						{	strAuth:'test',
							strUser:s_enc(Decr(localStorage.alg_username)),			
							strPassword:s_enc(Decr(localStorage.alg_password))
						}, 	    
						funct);
	}
}
try
{
	wsbase  = Decr(localStorage.ws_url);
	if (wsbase=='') {
		initURL();
	}
}
catch (err) 
{
	initURL();
}
function Redirect(sw) {
		//alert('De door u gebruikte gebruiker en wachtwoord zijn niet geldig, controleer uw instellingen en probeer opnieuw!');
		location='settings.html';

}
function initURL() {
	wsbase = 'https://service.odfjell.nl/service_standby/';
	localStorage.ws_url = Enc(wsbase);
}
function Enc(strIn) {
	if (strIn==null) strIn = '';
	return sjcl.encrypt(enckey,strIn);
}
function Decr(strIn) 
{
	try 
	{
		if (strIn==null || strIn=='') {
			return 	'';
		}
		return sjcl.decrypt(enckey,strIn);
	}
	catch (err)
	{
		return '';
	}
}
function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
}
function generic_ajax_sync(wsurl,data,funct) {
	var wscall= wsbase + wsurl;
	$.ajax( {	
		url:wscall,
		type:http_method,
		cache:false,
		async:false,
		data:data,
		username:AuthUser(localStorage.ws_username),
		password:AuthUser(localStorage.ws_password),
		success:funct,
		beforeSend:extauth,
		timeout:ajax_timeout,
		error: function (request, status, error,exception) {
			handleError(wscall,data,request,status,error,exception);
		},
		dataType:'xml'
	});
}
function generic_ajax(wsurl,data,funct) {
	var wscall = '';
	
	if (wsurl.search('@@')>=0)
		wscall = wsurl.substring(2);
	else
		wscall = wsbase + wsurl;
	$.ajax( {	
		url:wscall,
		type:http_method,
		cache:false,
		async:true,
		data:data,
		timeout:ajax_timeout,
		beforeSend:extauth,
		username:AuthUser(localStorage.ws_username),
		password:AuthUser(localStorage.ws_password),
		success:funct,
		error: function (request, status, error,exception) {
			handleError(wscall,data,request,status,error,exception);
		},
		dataType:'xml'
	});
}
function AuthUser(strIn) {
	if (alg_authmethode==0 || alg_authmethode==1)	
		return '';
	else 
		return Decr(strIn)
}
function extauth(xhr) {
	if (ext_auth || alg_authmethode==0) {
		var un = Base64.encode( Decr(localStorage.ws_username));
		var up = Base64.encode(Decr(localStorage.ws_password));
		xhr.setRequestHeader('Authorization', 'Basic ' + un + ":" + up  );
	}
	else if (alg_authmethode==1) {
		xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(Decr(localStorage.ws_username) + ":"  + Decr(localStorage.ws_password) ));
	}
	
	
}
function handleError(wscall,data,request, status, error,exception) {

	if (localStorage.showerrors=='true' || window.location.href.indexOf("settings.html") >-1 ) {
		alert('De webservice kon niet worden aangeroepen.\nControleer je verbinding, en/of de gebruikernaam en wachtwoord, en probeer opnieuw\n' +
				  'url:' + wscall + '\n'+ 
				  'data:' + data + '\n'+ 
				  'platform:' + platform + '\n'+ 
				  'ext auth:' + ext_auth + '\n'+ 
				  'auth method:' + alg_authmethode  + '\n'+ 
				  'status:' + request.status + '\n'+ 
				  'exception:' + exception);
		
		if ( window.location.href.indexOf("settings.html") == -1 )
			location='settings.html';

	}
		

}
function getStatusInfo() {
	var retVal = 'Ingelogd: ' + Decr(localStorage.alg_username) + ' || ws acc:' +  Decr(localStorage.ws_username) + ' || Groep:' + Decr(localStorage.groupname) + ' || Device:' + devicename + ' ' + devicemodel;
	if (appVersion!='') 
		retVal = retVal + ' || Version:' + appVersion;
	return retVal;
}
function getVersion() {

	try {
		$.ajax( {	
			url:'config.xml',
			type:'GET',
			cache:false,
			async:true,
			success:gotVersion,
			error: function (request, status, error,exception) {
				handleError('config.xml','',request,status,error,exception);
			},
			dataType:'xml'
		});
	}
	catch(err) {}
}

function gotVersion(xml) {
	appVersion = $(xml).find('widget').attr('version');
	
	$('#footer').html(getStatusInfo());
}


var Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}
function getString(l)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+=-{}[]:;<>?,./";
    for( var i=0; i < l; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
function s_enc(pwin) {
	var oudpwd = pwin;
	var pwout = '';
	var t = '';
	for (var i = 0;i<oudpwd.length;i++) {
		var cur_char = oudpwd.charAt(i);
		var cur_code = oudpwd.charCodeAt(i);
		pwout = pwout + (cur_code-40) + getString(1)
	}
	pwout = getString(6) + pwout + getString(5);
	return pwout;
}