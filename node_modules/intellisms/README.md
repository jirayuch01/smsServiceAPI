# intelliSMS
intelliSMS is a node.js module to connect to the [Intellisoftware][intelli] SMS Gateway API

## Overview
SMS Gateway Services from [Intellisoftware][intelli] makes it easy to stay connected with your customers, clients or mobile staff. [Intellisoftware][intelli] have a wide range of mobile communication solutions including Web SMS, Email to SMS, MMS and SMS API Interfaces. Our SMS Gateway is reliable, fast, cost effective and covers almost all operators in the world.

The intelliSMS node.js module provides all the functions available to the existing [php][phpsdk], [.net][.netsdk] frameworks provided by [Intellisoftware][intelli] but provides them in the evented way.

## Installation
via NPM

    npm install intellisms
    
## Example
You can send a sms message to one recipient by:

    var intelliSMS = require('intellisms');
    
    var sms = new intelliSMS('username','password');
    
    sms.SendMessage({to:'447123456789',text:"My Text Message"},function(err,id){
        if(err) console.log(err);
    	console.log(id);
    });
    
You can also send to multiple recipients by:
    
    var intelliSMS = require('intellisms');
    
    var sms = new intelliSMS('username','password');
    
    sms.SendMessage({to:['447123456789','447123456788'],text:"My Text Message"},function(err,id,number){
        if(err) console.log(err);
        if(!err) console.log('Sent to %s ID: %s',number,id);
    });
    
You can send an MMS message by:
    
    var fs = require('fs');
    var intelliSMS = require('intellisms');
    
    var sms = new intelliSMS('username','password');
    
    var options = {to:'447123456789',text:"My Text Message"};
    
    /* files can be a string or a stream. You can also add multiple by using an array */
    var files = fs.createReadStream('test.jpg');
    
    sms.SendMMSMessage(options,files,function(err,id){
        if(err) console.log(err);
        if(!err) console.log('ID: %s',id);
    });
 
You can send to as many recipients as you want in one go. The module will buffer the requests if sending to more than 100 recipients. 
 
The callback will be called for each recipient sent to.

## API
Create a new intelliSMS

    var sms = new intelliSMS('username','password',options);

Options available are:

* **timeout** - the timeout time to connect to the API in ms, default: 5000
* **secure** - use a secure https connection to the API, default: false
* **sendsPerRequest** - the maximum number of recipients to sent in 1 request, default: 100

### Send a SMS message

    sms.SendMessage(options,callback);

Options available are:

* **to** - an array or string of recipient numbers. Required
* **text** - the message you want to send. Required
* **from** - This is the source/sender's phone number or name. Optional
* **maxconcat** -  Maximum number of concatenated SMS messages that will be sent per recipient. Leave blank to auto calculate length. Optional
* **type** - use 1 for a standard text message. use 6 for a voice sms.  Default: 1, Optional
* **usercontext** - a string that is sent along when a user replys to a text message. [Click here for more info on reply callbacks][intelliforward]

###  Send a Wap SMS message

    sms.SendWapMessage(options,callback);

Options available are:

* **to** - an array or string of recipient numbers. Required
* **text** - the message you want to send. Required
* **href** - the url you want to send. Required
* **from** - This is the source/sender's phone number or name. Optional
* **maxconcat** -  Maximum number of concatenated SMS messages that will be sent per recipient. Leave blank to auto calculate length. Optional
* **usercontext** - a string that is sent along when a user replys to a text message. [Click here for more info on reply callbacks][intelliforward]

### Send Unicode Message

    sms.SendUnicodeMessageHex(options,callback);

Options available are:

* **to** - an array or string of recipient numbers. Required
* **hex** - Unicode text encoded in hexadecimal (140 octets max, 70 unicode characters). Required
* **from** - This is the source/sender's phone number or name. Optional
* **usercontext** - a string that is sent along when a user replys to a text message. [Click here for more info on reply callbacks][intelliforward]

### Send Binary Message

    sms.SendBinaryMessage(options,callback);

Options available are:

* **to** - an array or string of recipient numbers. Required
* **ud** - User Data (140 octets max). Required
* **udh** - User Data Header. Optional
* **from** - This is the source/sender's phone number or name. Optional
* **usercontext** - a string that is sent along when a user replys to a text message. [Click here for more info on reply callbacks][intelliforward]

###  Send a Voice message

    sms.SendVoiceMessage(options,callback);

Options available are:

* **to** - an array or string of recipient numbers. Required
* **text** - the message you want to send. Required
* **from** - This is the source/sender's phone number or name. Optional
* **maxconcat** -  Maximum number of concatenated SMS messages that will be sent per recipient. Leave blank to auto calculate length. Optional

### Send MMS Message

    sms.SendMMSMessage(options,files,callback);

Options available are:

* **to** - an array or string of recipient numbers. Required
* **text** - the message you want to send. Required
* **from** - This is the source/sender's phone number or name. Optional

Files can be a string, stream or a mixed array or strings or streams.

### Callback Function

The callback will be called for every recipient and will return:

* **error** - returns null on no error or an Error Object with the API error.
* **id** - returns returns the API queue ID on success
* **number** - returns which number the callback is for. This is only applicable for sending to more than one recipient.  The phone numbers listed in the response may not be identical to the numbers submitted. This is due to processing done to the numbers, e.g. international dialling codes added, duplicate numbers removed.

## Miscellaneous API
There are also some helper functions that do not send messages but are helpful for other aspects.

### Get Balance
Get the number of credits left on your account.

    sms.GetBalance(function(err,balance){
        if(err) console.log(err);
        if(!err) console.log('My Balance is %d',balance);
    });
    
### Update Subscribtion list
update, remove and add entries to Subscription List. [more info here][intellisub]

    sms.UpdateSubscriptionList(sublistname,msisdn,action,cb);
    
### Retrieve MMS Part
You can retrieve an MMS Message part. [more info here][intellimms] 

    sms.RetrieveMMSPart(msgid,msgpart,cb);


  [intelli]: http://www.intellisoftware.co.uk/
  [phpsdk]: http://www.intellisoftware.co.uk/sms-gateway/php-sdk/
  [.netsdk]: http://www.intellisoftware.co.uk/sms-gateway/dotnet-component/
  [intelliforward]: http://www.intellisoftware.co.uk/sms-gateway/inbound-sms/
  [intellisub]: http://www.intellisoftware.co.uk/sms-gateway/subscription-lists
  [intellimms]: http://www.intellisoftware.co.uk/sms-gateway/http-interface/retrieve-mms/

  
    