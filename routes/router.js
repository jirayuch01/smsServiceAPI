var express = require('express');
var router = express.Router();
var User = require('../models/user');
var multer = require('multer');
var crypto = require('crypto');
var path = require('path');
var bodyParser = require('body-parser');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var fs = require('fs');
var assert = require('assert');

const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server');
  }
  console.log('Connected to MongoDB server');
});

router.get('/', function (req, res, next) {
  return res.sendFile(path.join(__dirname + '/templateLogReg/index.html'));
});

router.use(bodyParser.json());
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    //cb(null, file.fieldname + '-' + Date.now() + '.xls');
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err);
      cb(null, file.originalname);
      //cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
})
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (['xls'], ['xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
      return cb(new Error('wrong extension type'));
    }
    cb(null, true);
  }
}).single('filename');

router.post('/show', function (req, res) {
  //return res.redirect('/home');
  //return res.send(req.files);
  //return res.render('show.hbs');
  var exceltojson;
  upload(req, res, function (err) {
    if (err) {
      //res.json({ error_code: 1, err_desc: err });
      res.render('errorUpload.hbs');
      return;
    }
    if (!req.file) {
      console.log("No file received");
      // return res.send({
      //   success: false
      // });
      //res.render('home.hbs');
      //res.json({ error_code: 1, err_desc: "No file passed" });
      res.render('errorUpload.hbs');
      return;
    }
    else {
      console.log('file received');
      // return res.send({
      //   success: true
      // });
      //return res.render('show.hbs');
    }
    if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
      exceltojson = xlsxtojson;
    } else {
      exceltojson = xlstojson;
    }
    console.log(req.file.path);
    try {
      exceltojson({
        input: req.file.path,
        output: "public/outputs/output.json",
        lowerCaseHeaders: true
      }, function (err, result) {
        if (err) {
          return res.json({ error_code: 1, err_desc: err, data: null });
        }
        //res.json({ error_code: 0, err_desc: null, data: result });
        MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
          if (err) { console.log(err); throw err; }
          fs.readFile('public/outputs/output.json', 'utf8', function (err, data) {
            if (err) throw err;
            //console.log(data);
            var json = JSON.parse(data);
            db.collection('test').insert(json, function (err, records) {
              console.log("insert!!");
              if (err) throw err;
            });
          });
        });
        res.redirect('/show');
      });
    } catch (e) {
      res.json({ error_code: 1, err_desc: "Corupted excel file" });
    }
  });
});

// router.post('/forget', function (req, res, next) {
//   res.render('forget.hbs');
// });

// router.post('/forgets', function (req, res, next) { 
//   var item = {
//     email: req.body.email,
//     password: req.body.password,
//     passwordConf: req.body.passwordConf,
//   };
//   var email = req.body.email;
//   MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
//     assert.equal(null, err);
//     db.collection('users').updateOne({ 
//       email: req.body.email  
//     }, { $set: item }, function (err, result) {
//       assert.equal(null, err);
//       db.close();
//     });
//   });
//   return res.redirect('/');
// });

router.post('/', function (req, res, next) {
  if (req.body.password !== req.body.passwordConf) {
    // var err = new Error('Passwords do not match.');
    // err.status = 400;
    // res.send("passwords dont match");
    // return next(err);
    return res.render('errorMatchPassword.hbs');
  }
  if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConf: req.body.passwordConf,
    }
    User.create(userData, function (error, user) {
      if (error) {
        return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect('/home');
      }
    });
  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        // var err = new Error('Wrong email or password.');
        // err.status = 401;
        // return next(err);
        return res.render('errorPassword.hbs');
      } else {
        req.session.userId = user._id;
        return res.redirect('/home');
      }
    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
});

router.post('/', function (req, res, next) {
  if (req.body.password !== req.body.passwordConf) {
    // var err = new Error('Passwords do not match.');
    // err.status = 400;
    // res.send("passwords dont match");
    // return next(err);
    return res.render('errorMatchPassword.hbs');
  }
  if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConf: req.body.passwordConf,
    }
    User.create(userData, function (error, user) {
      if (error) {
        return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect('/contact');
      }
    });
  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        return res.redirect('/contact');
      }
    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
});

router.post('/', function (req, res, next) {
  if (req.body.password !== req.body.passwordConf) {
    // var err = new Error('Passwords do not match.');
    // err.status = 400;
    // res.send("passwords dont match");
    // return next(err);
    return res.render('errorMatchPassword.hbs');
  }
  if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      passwordConf: req.body.passwordConf,
    }
    User.create(userData, function (error, user) {
      if (error) {
        return next(error);
      } else {
        req.session.userId = user._id;
        return res.redirect('/show');
      }
    });
  } else if (req.body.logemail && req.body.logpassword) {
    User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        return res.redirect('/show');
      }
    });
  } else {
    var err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
});

router.get('/home', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          return res.render('errorAuthorized.hbs');
          // var err = new Error('Not authorized! Go back!');
          // err.status = 400;
          // return next(err);
        } else {
          return res.render('home.hbs', {
            username: user.username
          });
          //return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: 
          //</h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
        }
      }
    });
});

router.get('/contact', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          return res.render('errorAuthorized.hbs');
          // var err = new Error('Not authorized! Go back!');
          // err.status = 400;
          // return next(err);
        } else {
          return res.render('contact.hbs', {
            username: user.username
          });
          //return res.send('<h1>Name: </h1>' + user.username + '<h2>Mail: 
          //</h2>' + user.email + '<br><a type="button" href="/logout">Logout</a>')
        }
      }
    });
});

router.get('/show', function (req, res, next) {
  var data = req.session.userId;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        if (err) { console.log(err); throw err; }
        data = '';
        db.collection('test').find().toArray(function (err, docs) {
          if (err) throw err;
          res.render('show.hbs', {
            data: docs,
            username: user.username
          });
          db.close();
        });
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
});

function searchFirst(req, res) {
  var data = req.session.userId;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      var resultArray = [];
      var first = req.body.search;
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        assert.equal(null, err);
        var cursor = db.collection('test').find({
          first: new RegExp(req.body.search)
        });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          resultArray.push(doc);
          console.log(doc);
        }, function () {
          if (resultArray == '') {
            res.render('notFound.hbs', {
              username: user.username
            });
          } else {
            db.close();
            res.render('result.hbs', {
              items: resultArray,
              username: user.username
            });
          }
        });
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
}

function searchLast(req, res) {
  var data = req.session.userId;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      var resultArray = [];
      var last = req.body.search;
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        assert.equal(null, err);
        var cursor = db.collection('test').find({
          last: new RegExp(req.body.search)
        });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          resultArray.push(doc);
          console.log(doc);
        }, function () {
          if (resultArray == '') {
            res.render('notFound.hbs', {
              username: user.username
            });
          } else {
            db.close();
            res.render('result.hbs', {
              items: resultArray,
              username: user.username
            });
          }
        });
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
}

function searchTel(req, res) {
  var data = req.session.userId;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      var resultArray = [];
      var tel = req.body.search;
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        assert.equal(null, err);
        var cursor = db.collection('test').find({
          tel: new RegExp(req.body.search)
        });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          resultArray.push(doc);
          console.log(doc);
        }, function () {
          if (resultArray == '') {
            res.render('notFound.hbs', {
              username: user.username
            });
          } else {
            db.close();
            res.render('result.hbs', {
              items: resultArray,
              username: user.username
            });
          }
        });
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
}

function searchMeg(req, res) {
  var data = req.session.userId;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      var resultArray = [];
      var meg = req.body.search;
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        assert.equal(null, err);
        var cursor = db.collection('test').find({
          meg: new RegExp(req.body.search)
        });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          resultArray.push(doc);
          console.log(doc);
        }, function () {
          if (resultArray == '') {
            res.render('notFound.hbs', {
              username: user.username
            });
          } else {
            db.close();
            res.render('result.hbs', {
              items: resultArray,
              username: user.username
            });
          }
        });
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
}

function notFound(req, res) {
  var data = req.session.userId;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      var resultArray = [];
      var meg = req.body.search;
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        assert.equal(null, err);
        var cursor = db.collection('test').find({
          meg: new RegExp(req.body.search)
        });
        cursor.forEach(function (doc, err) {
          assert.equal(null, err);
          resultArray.push(doc);
          console.log(doc);
        }, function () {
          if (resultArray == '') {
            res.render('notFound.hbs', {
              username: user.username
            });
          } else {
            db.close();
            res.render('notFound.hbs', {
              username: user.username
            });
          }
        });
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
}

router.post('/search', function (req, res, next) {
  var select = req.body.select;
  console.log('select is', select);
  if (select == "de") {
    console.log('select is notFound');
    notFound(req, res);
  }
  if (select == "first") {
    console.log('select is first');
    searchFirst(req, res);
  }
  if (select == "last") {
    console.log('select is last');
    searchLast(req, res);
  }
  if (select == "tel") {
    console.log('select is tel');
    searchTel(req, res);
  }
  if (select == "meg") {
    console.log('select is meg');
    searchMeg(req, res);
  }
});

router.post('/create', (req, res) => {
  var item = {
    first: req.body.first,
    last: req.body.last,
    tel: req.body.tel,
    meg: req.body.meg
  };
  MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
    assert.equal(null, err);
    db.collection('test').insertOne(item, function (err, result) {
      assert.equal(null, err);
      console.log('Item inserted');
      db.close();
    });
  });
  res.redirect('/show');
});

// router.get('/send/:id', (req, res) => {
//   //https://www.intellisoftware.co.uk
//   var intelliSMS = require('intellisms');
//   var sms = new intelliSMS('smshospital', 'smsservice');
//   // console.log(req.body.telno + " " + req.body.msg_data);
//   //number and message 
//   var id = req.params.id;
//   sms.SendMessage({ 
//     to: "66950193878", 
//     text: "Hi" 
//   }, function(err, id) {
//       if (err) console.log(err);
//       console.log(id);
//       //console.log("Send message to " + req.body.fname + " " + req.body.lname + " " + req.body.telno)
//       res.render('success.hbs');
//   });
// });

// router.get('/send/:id', function (req, res, next) {
//   var data = req.session.userId;
//   var id = req.params.id;
//   User.findById(req.session.userId).exec(function (error, user) {
//     if (data != null && data != undefined) {
//         //https://www.intellisoftware.co.uk
//         var intelliSMS = require('intellisms');
//         var sms = new intelliSMS('smshospital', 'smsservice');
//         // console.log(req.body.telno + " " + req.body.msg_data);
//         //number and message 
//         var id = req.params.id;
//         sms.SendMessage({ 
//           to: "66950193878", 
//           text: "Hi" 
//         }, function(err, id) {
//             if (err) console.log(err);
//             console.log(id);
//             //console.log("Send message to " + req.body.fname + " " + req.body.lname + " " + req.body.telno)
//             res.render('success.hbs', {
//               username: user.username
//             });
//         });
//     } else {
//       res.render('errorAuthorized.hbs');
//     }
//   });
// });

router.get('/send/:id', function (req, res, next) {
  var data = req.session.userId;
  var id = req.params.id;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        if (err) { console.log(err); throw err; }
        data = '';
        db.collection('test').findOne({
          _id: new ObjectID(id)
        }, (err, result) => {
          if (err) return console.log(err);
          console.log(JSON.stringify(result));
          db.close();
          console.log(result.tel);
          console.log(result.meg);
          //https://www.intellisoftware.co.uk
          var intelliSMS = require('intellisms');
          var sms = new intelliSMS('smsAPI', 'smsAPI');
          // console.log(req.body.telno + " " + req.body.msg_data);
          //number and message 
          sms.SendMessage({
            to: result.tel,
            text: result.meg
          }, function (err, id) {
            if (err) console.log(err);
            //console.log("Send message to " + req.body.fname + " " + req.body.lname + " " + req.body.telno)
            res.render('success.hbs', {
              result: result,
              username: user.username
            });
          });
        })
        console.log(req.params.id);
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
});

router.get('/delete/:id', function (req, res, next) {
  var id = req.params.id;
  MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
    db.collection('test').findOneAndDelete({
      _id: new ObjectID(id)
    }, function (err, result) {
      console.log(id);
      res.redirect('/show');
      db.close();
    });
  });
});

// router.get('/deleteall', function (req, res, next) {
//   MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
//     db.collection('test').remove({}, function (err, removed) {
//       res.redirect('/show');
//       db.close();
//     });
//   });
// });

router.get('/fetchdata/:id', function (req, res, next) {
  var data = req.session.userId;
  var id = req.params.id;
  User.findById(req.session.userId).exec(function (error, user) {
    if (data != null && data != undefined) {
      MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
        if (err) { console.log(err); throw err; }
        data = '';
        db.collection('test').findOne({
          _id: new ObjectID(id)
        }, (err, result) => {
          if (err) return console.log(err);
          console.log(JSON.stringify(result));
          db.close();
          // res.send(result);   
          // res.send(result[0]);   
          res.render('edit.hbs', {
            result: result,
            username: user.username
          });
          console.log(result.tel);
        })
        console.log(req.params.id);
      });
    } else {
      res.render('errorAuthorized.hbs');
    }
  });
});

router.post('/edit', (req, res) => {
  MongoClient.connect('mongodb://localhost:27017/forAuth', (err, db) => {
    db.collection('test').findOneAndUpdate({
      _id: new ObjectID(req.body._id)
    }, {
        $set: {
          first: req.body.first,
          last: req.body.last,
          tel: req.body.tel,
          meg: req.body.meg
        }
      }, function (err, results) {
        console.log(results.result);
      });
    db.close();
    res.redirect('/show');
  });
});

router.get('/logout', function (req, res, next) {
  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

// var twilio = require('twilio');
// var accountSid = 'AC35d5786dd649930913467c42d7994e17';
// var authToken = '0de9b2ccc05b326dac529c300672beb2';
// var client = new twilio(accountSid, authToken);
// client.messages.create({
//     to: '+66950193878',
//     from: '+12402582361',
//     body: 'Hi, Jirayu'
// }, function (error, message) {
//     if (!error) {
//         console.log('Success! The SID for this SMS message is: ' + message.sid);
//         console.log('Message sent on: ' + message.dateCreated);
//     } else {
//         console.log('Oops! There was an error.');
//     }
// });

module.exports = router;