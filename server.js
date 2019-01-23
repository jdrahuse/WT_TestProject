/**
* File        : server.js
* Description : API containing Name Game server logic for creating new game (/newGame) and making a guess (/guess). 
                It is implimented using Node.js platform and Express framework.
* Author      : Jacquelynn Drahuse
* Date        : 2019 January 23
* Version     : 1.0
*/

const http       = require("http")
const express    = require('express')
const bodyParser = require('body-parser')
const path       = require('path')
const request    = require('request')

const PORT       = process.env.PORT || 8000
const SERVER_API = '/api/v1.0'
const CLIENT_DIR = '/client'

var profileData  = {}
var url          = "https://www.willowtreeapps.com/api/v1.0/profiles"


/**
* Decription:  The function performs a Knuth (Fisher-Yates) shuffle randomly 
*              shuffles the array when called. 
* Source    :  https://www.kirupa.com/html5/shuffling_array_js.htm
* Returns   :  Array  input  The shuffled array. 
*/ 
Array.prototype.shuffle = function() {
  var input = this
  for (var i = input.length - 1; i >= 0; i--) {
    var randomIndex = Math.floor(Math.random() * (i + 1))
    var itemAtIndex = input[randomIndex]
    input[randomIndex] = input[i]
    input[i] = itemAtIndex
  }
  return input
}

/**
* Description:  The request retrieves profiles from the data source and sets it in the
*               server variable 'profileData'. If data source fails to be retrieved or
*               less than six profiles are returned, the program is exitted.
* Response   :  200
* Parameters :  String  url  The data source web address provided by Willowtree
*/
request({ url: url, json: true }, function (error, response, body) {
  if (!error && response.statusCode === 200) {
	// Filters data source to use only profiles with required game parameters 
    profileData = body.filter(function (profile) {  
      return (
      profile.hasOwnProperty('id')           &&
      profile.hasOwnProperty('firstName')    &&
      profile.hasOwnProperty('lastName')     &&
      profile.hasOwnProperty('headshot')     &&
      profile.headshot.hasOwnProperty('url') &&
      profile.headshot.hasOwnProperty('alt'))
    })
    if (profileData.length < 6) {  
      console.log('Data source does not contain enough valid profiles.')
      process.exit(1)
    }
  } else {
    console.log('Failure to retrieve profile data source')
    process.exit(1)
  }
})


var app = express()
app.listen(PORT, function() {
  console.log('The "Name Game" RESTful API server is running on port: ' + PORT)
})

// Sends client html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + CLIENT_DIR + '/index.html'))
})

/**
* Description:  Initializes game data based upon game mode selected. If no mode is defined
*               or an invalid mode is requested. 
* Parameter  :  String mode
* Produces   :  application/json, text/json
* Response   :  200, 400
*/
app.get(SERVER_API + '/newGame', (req, res, next) => {
  var status;
  var mode = req.query.mode
  var gameData = {}
  
  switch(mode) {
    case "basic": 
      // Basic mode returns six headshots and one name
	  status = 200
      profileData.shuffle()
      gameData.headshots = []
      // Selects the first six profile headshots and ids of shuffled profileData
      for(var i = 0; i < 6; i++) {
        gameData.headshots.push({
          "id"       : profileData[i].id,
          "headshot" : profileData[i].headshot
        })
      }  
	  // Selects random name of the six profiles by using a random index ranging from 0 to 5. 
      var randomKey = Math.floor(Math.random() * 5);
      gameData.firstName = profileData[randomKey].firstName;
      gameData.lastName  = profileData[randomKey].lastName;
      
    break;
	
    case "reverse": 
      // Reverse mode returns six names and one headshot
	  status = 200; 
      profileData.shuffle()
      gameData.headshot = {}
      gameData.names    = []
	  // Selects the first six profiles names and ids of shuffled profileData
      for(var i = 0; i < 6; i++) {
        gameData.names.push({
          "firstName" : profileData[i].firstName,
          "lastName"  : profileData[i].lastName
        })
      }
	  // Selects random headshot of the six profiles by using a random index ranging from 0 to 5. 
      var randomKey = Math.floor(Math.random() * 5); 
      gameData.headshot = {
        "id"       : profileData[randomKey].id,
        "headshot" : profileData[randomKey].headshot
      } 
      break;
	
	/* This mode can be uncommented for future game mode implimentations.  
    case "matt":
      status = 200;
	  
      break;
	*/
	 
    default: 
	  // Bad Resquest: Invalid mode or no mode defined. 
      status = 400; 
  }
  
  res.status(status).send(JSON.stringify(gameData))
 
});


/**
* Verifies if profile id of selected/provided headshot matches that of name. 
* Parameter:   String  id
*              String  firstName
*              String  lastName 
* Returns  :   boolean true/false 
* Response :   200, 400
*/
app.post(SERVER_API + '/guess', (req, res) => {
  var status;
  var firstName   = req.query.firstName
  var lastName    = req.query.lastName
  var guessId     = req.query.id 

  for (var i = 0; i < profileData.length; i++) {
    if(profileData[i].id == guessId) {
      if (profileData[i].firstName === firstName &&
        profileData[i].lastName  === lastName) {
        res.status(200).send(true)  // Match
      } else {
        res.status(200).send(false) // No Match
      }
      return;
    } 
  }
  
  // Bad Request
  res.status(400).send("Invalid profile id.")
  
});

