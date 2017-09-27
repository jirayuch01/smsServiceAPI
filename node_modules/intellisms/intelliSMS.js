var http = require('http');
var https = require('https');
var querystring = require('querystring');
var fs = require('fs');
var FormData = require('form-data');
var path = require('path');
var _ = require('underscore');
var package = require('./package');

var IntelliSMS = function(username,password,options){
	/* Setup Default Options */
	this.options = _.extend({
		username:username,
		password:password,
		host:['www.intellisoftware.co.uk','www.intellisoftware2.co.uk'],
		timeout:5000,
		useHost:0,
		secure:false,
		lineBreak:"\r\n",
		sendsPerRequest:100
	},options);
};


IntelliSMS.prototype.SendMessage = function(options,cb){
	/* Set Scope */
	var self = this;
	/* Default Options */
	var sendOptions = _.extend({
		username : this.options.username,
		password: this.options.password,
		type:1
	},options);
	
	/* Validate Options */
	if(sendOptions.to){
		if(typeof(sendOptions.to)=='string') sendOptions.to = [sendOptions.to];
		if(sendOptions.to instanceof Array === false) throw new Error('To numbers are an invalid type');
	}else{
		throw new Error('Enter a number to send to');
	}
	if([1,6,4].indexOf(sendOptions.type)>-1 && !sendOptions.text) throw new Error('Enter Enter Text to Send');
	if(sendOptions.type==2 && !sendOptions.hex) throw new Error('Enter Enter Hex to Send');
	if(sendOptions.type==3 && !sendOptions.ud) throw new Error('Enter Enter User Data to Send');

	/* get maxconcat if not set and text is set */
	if(!sendOptions.maxconcat && sendOptions.text) sendOptions.maxconcat = concatLength(sendOptions.text);

	/* Get Send Batch */
	var processNext = sendOptions.to.slice(this.options.sendsPerRequest)
	sendOptions.to = sendOptions.to.slice(0,this.options.sendsPerRequest).join(',');

	/* process Batch */

	this.processRequest('/smsgateway/sendmsg.aspx',sendOptions,function(err,result){
		if(!err && result.id) result = result.id;
		cb(err,result);
	});

	/* process Next Batch if any */
	if(processNext.length>0){
		process.nextTick(function(){
			sendOptions.to =processNext;
			self.SendMessage(sendOptions,cb);
		});
	}
	return this;
};

IntelliSMS.prototype.SendWapMessage = function(options,cb){
	var sendOptions = _.extend({type : 4},options);
	if(!sendOptions.href) throw new Error('Enter a URL to Send');
	return this.SendMessage(sendOptions,cb);
};

IntelliSMS.prototype.SendUnicodeMessageHex = function(options,cb){
	var sendOptions = _.extend({type : 2},options);
	if(!sendOptions.hex) throw new Error('Enter a Hex Value');
	return this.SendMessage(sendOptions,cb);
};

IntelliSMS.prototype.SendBinaryMessage = function(options,cb){
	var sendOptions = _.extend({type : 3},options);
	if(!sendOptions.ud) throw new Error('Enter a User Data');
	return this.SendMessage(sendOptions,cb);
};

IntelliSMS.prototype.SendMessageWithUserContext = function(options,cb){
	if(!options.usercontext) throw new Error('Enter user content');
	return this.SendMessage(options,cb);
};
IntelliSMS.prototype.SendVoiceMessage = function(options,cb){
	var sendOptions = _.extend({type : 6},options);
	return this.SendMessage(options,cb);
};


IntelliSMS.prototype.SendMMSMessage = function(options,filepaths,cb){
	if (filepaths instanceof Array ===false) filepaths = [filepaths];
	/* Set Scope */
	var self = this;
	/* Default Options */
	var sendOptions = _.extend({
		username : this.options.username,
		password: this.options.password,
		type:5
	},options);
	
	/* Validate Options */
	if(sendOptions.to){
		if(typeof(sendOptions.to)=='string') sendOptions.to = [sendOptions.to];
		if(sendOptions.to instanceof Array === false) throw new Error('To numbers are an invalid type');
	}else{
		throw new Error('Enter a number to send to');
	}
	if(!sendOptions.text) throw new Error('Enter some Data to Send');

	/* Get Send Batch */
	var processNext = sendOptions.to.slice(this.options.sendsPerRequest)
	sendOptions.to = sendOptions.to.slice(0,this.options.sendsPerRequest).join(',');

	/* Set Form Values */
	var form = new FormData();
	_.each(_.keys(sendOptions),function(key){
		if(key!='maxconcat') form.append(key,sendOptions[key]);
	});

	/* Attach Files */
	filepaths.forEach(function(filepath){
		if(typeof(filepath)=='string'){
			form.append(path.basename(filepath),fs.createReadStream(filepath));
		}else if(filepath.on && filepath.path){
			form.append(path.basename(filepath.path),filepath);
		}else{
			form.append('file',filepath);
		}
	});

	/* Set URL */
	var protocol = (this.options.secure)? 'https://':'http://';
	var url = protocol+this.options.host[this.options.useHost]+'/smsgateway/default.aspx';

	/* Callbacks */
	form.on('error', function(e) {
		if(self.options.useHost<(self.options.host.length-1)){
			self.options.useHost++;
			self.SendMMSMessage(sendOptions,filepaths,cb);
		}else{
			cb(e);
		}
	})
	.on('socket', function (socket) {
		socket.setTimeout(self.options.timeout);  
		socket.on('timeout', function() {
			if(this.options.useHost<(this.options.host.length-1)){
				self.options.useHost++;
				self.SendMMSMessage(sendOptions,filepaths,cb);
			}else{
				cb(e);
			}
		});
	})
	.submit(url,function(err,res){
		if(err){
			cb(err);
		}else{
			var data = '';
			res.setEncoding('UTF-8');
			res.on('data',function(chunk){ data += chunk})
			res.on('end',function(){
				self.processResponse(data,function(err,result){
					if(!err && result.id) result = result.id;
					cb(err,result);
				});
			});		
		}
	});

	/* process Next Batch if any */
	if(processNext.length>0){
		process.nextTick(function(){
			sendOptions.to =processNext;
			self.SendMMSMessage(sendOptions,filepaths,cb);
		});
	} 

	return this;
};


IntelliSMS.prototype.GetBalance = function(cb){
	this.processRequest('/smsgateway/getbalance.aspx',{
		username : this.options.username,
		password: this.options.password
	},function(err,result){
		if(!err && result.balance) result = result.balance;
		cb(err,result);
	});
	return this;
};


IntelliSMS.prototype.UpdateSubscriptionList = function(sublistname,msisdn,action,cb){
	var options = {
		username : this.options.username,
		password: this.options.password,
		sublistname:sublistname,
		msisdn:msisdn,
		action:action
	};

	this.processRequest('/smsgateway/updatesubscriptionlist.aspx',options,function(err,result){
		cb(err,result);
	});
	return this;
};

IntelliSMS.prototype.RetrieveMMSPart = function(msgid,msgpart,cb){
	var options = {
		username : this.options.username,
		password: this.options.password,
		msgid:sublistname,
		msgpart:msgpart
	};

	this.processRequest('/smsgateway/retrievemms.aspx',options,function(err,result){
		cb(err,result);
	});
	return this;
};



IntelliSMS.prototype.processRequest = function(endPoint,postData,cb){
	var self = this;
	if(typeof(postData)=='object') postData = querystring.stringify(postData);
	var handler =(this.options.secure)? https:http;
	var port =(this.options.secure)? 443:80;

	var postOptions = {
		host: this.options.host[this.options.useHost],
		port: port,
		path: endPoint,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
			'user-agent': 'intelliSMS/'+package.version+' node.js'
		}
	};
	
	var request = handler.request(postOptions, function(res) {
		var data = '';
		res.setEncoding('UTF-8');
		res.on('data',function(chunk){ data += chunk})
		res.on('end',function(){
			self.processResponse(data,cb);
		});			
	})
	.on('error', function(e) {
		if(self.options.useHost<(self.options.host.length-1)){
			self.options.useHost++;
			self.processRequest(endPoint,postData,cb);
		}else{
			cb(e);
		}
	})
	.on('socket', function (socket) {
		socket.setTimeout(self.options.timeout);  
		socket.on('timeout', function() {
			if(self.options.useHost<(self.options.host.length-1)){
				self.options.useHost++;
				self.processRequest(endPoint,postData,cb);
			}else{
				cb(e);
			}
		});
	});
	request.write(postData);
	request.end();
	return this;
};

IntelliSMS.prototype.processResponse = function(responseBody,cb){
	var lines = responseBody.split(this.options.lineBreak);
	if(lines[lines.length-1].length==0) lines.pop();//Remove blank last line
	if(lines.length>0){
		for(var i=0;i<lines.length;i++){
			var line = trim(lines[i]);
			var number=null;
			if(line.indexOf(',')>=0){
				var lineParts = line.split(',');
				number = lineParts.shift();
				line = lineParts.shift();
			}
			if(line.indexOf(':')>=0){
				var responseParts = line.split(':');
				if(responseParts.length!=2){
					cb(new Error('Invalid Data Response'));
				}else{
					if(responseParts[0]=='ERR'){
						cb(new Error(responseParts[1]));
					}else{
						var callbackResponse = {};
						callbackResponse[responseParts[0].toLowerCase()]=responseParts[1];
						cb(null,callbackResponse,number);
					}
				}
			}else{
				cb(new Error('Invalid Data Response'));
			}
		}
	}else{
		cb(new Error('No Data Returned'));
	}
	return this;
};

/* Helper function to trim a string */
var trim = function(str) {
	var	str = str.replace(/^\s\s*/, ''),
		ws = /\s/,
		i = str.length;
	while (ws.test(str.charAt(--i)));
	return str.slice(0, i + 1);
};

var concatLength=function(text){
	return Math.ceil(text.length/128);
};

module.exports =  IntelliSMS;