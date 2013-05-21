var wsbase;
var netstaticon = '';
var netstatdesc = '';
var enckey = '';
var wsbusy = false;

function checkConnection() {
		try {
			var networkState = navigator.connection.type;
			var states = {};
			states[Connection.UNKNOWN]  = 'Unknown connection';
			states[Connection.ETHERNET] = 'Ethernet connection';
			states[Connection.WIFI]     = 'WiFi connection';
			states[Connection.CELL_2G]  = 'Cell 2G connection';
			states[Connection.CELL_3G]  = 'Cell 3G connection';
			states[Connection.CELL_4G]  = 'Cell 4G connection';
			states[Connection.CELL]     = 'Cell generic connection';
			states[Connection.NONE]     = 'No network connection';
			netstatdesc = states[networkState];
			states[Connection.UNKNOWN]  = 'gap/net/NONE.PNG';
			states[Connection.ETHERNET] = 'gap/net/WIFI.PNG';
			states[Connection.WIFI]     = 'gap/net/WIFI.png';
			states[Connection.CELL_2G]  = 'gap/net/2G.png';
			states[Connection.CELL_3G]  = 'gap/net/3G.png';
			states[Connection.CELL_4G]  = 'gap/net/3G.png';
			states[Connection.CELL]     = 'gap/net/2G.png';
			states[Connection.NONE]     = 'gap/net/0BARS.png';
			netstaticon = states[networkState];
			$('#netstatus').attr('src',states[networkState]);
		}
		catch (err) {
			netstatdesc = 'NOT AVAILABLE';
			netstaticon='';
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
	generic_ajax_sync('standby.asmx/ValidateUser',
					{	strAuth:'test',
						strUser:Decr(localStorage.alg_username),			
						strPassword:Decr(localStorage.alg_password)
					}, 	    
					funct);
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

function generic_ajax_sync(wsurl,data,funct) {
    wsbusy = true;

	var wscall= wsbase + wsurl;
	$.ajax( {	
		url:wscall,
		type:'GET',
		cache:false,
		async:true,
		data:data,
		username:Decr(localStorage.ws_username),
		password:Decr(localStorage.ws_password),
		success:funct,
		error: function (request, status, error,exception) {
			alert('De webservice kon niet worden aangeroepen.\nControleer je verbinding, en/of de gebruikernaam en wachtwoord, en probeer opnieuw\n' +
				  'url:' + wscall + '\n'+ 
				  'data:' + data + '\n'+ 
				  'status:' + request.status + '\n'+ 
				  'exception:' + exception);
		},
		dataType:'xml'
	});
}
function generic_ajax(wsurl,data,funct) {
                
    wsbusy = true;
	var wscall= wsbase + wsurl;
	$.ajax( {	
		url:wscall,
		type:'GET',
		cache:false,
		async:true,
		data:data,
		username:Decr(localStorage.ws_username),
		password:Decr(localStorage.ws_password),
		success:funct,
		error: function (request, status, error) {
			alert('De webservice kon niet worden aangeroepen.\nControleer je verbinding, en/of de gebruikernaam en wachtwoord, en probeer opnieuw\n' +
				  'url:' + wscall + '\n'+ 
				  'data:' + data + '\n'+ 
				'status:' + request.status);
		},
		dataType:'xml'
	});
}
function getStatusInfo() {
	return 'Ingelogd: ' + Decr(localStorage.alg_username) + ' || Webservice gebruikt:' +  Decr(localStorage.ws_username) + ' || Groep:' + Decr(localStorage.groupname);
}
