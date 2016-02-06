var fs = require('fs');
var requests = require('request');

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require("body-parser");

// GLOBAL VARS
var games, users, helpJSON;
var devs = {
    "U0AQU2TKQ": true,
    "U0AQSDFHS": true,
    "U0AQWEX0D": true
};

var commands = {
    "dev": /dev(.*)/i,
    "setup": /setup/i,
    "help": /help/i,
    "late": /(@?)(.+)is late/i,
    "create": /create party(.+)/i
};

// INITIALIZATION
// On boot, read existing data in from file
readGames();
readUsers();
readHelpJSON();
connectToDB();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

var router = express.Router();

// COMMAND HANDLER
router.post('/', function (request, response) {
    // Immediately grab userID for all future checks
    var userID = request.body.user_id;
    var gamertag = request.body.user_name;
    var messageData = {
        "userID": userID,
        "request": request,
        "response": response,
        "gamertag": gamertag
    };

    // DEV COMMANDS
    if (requestIsOfType(request, commands.dev)) {
        // Check if user is dev
        if (isDev(userID)) {
            // User is dev
            devCommands(messageData);
        } else {
            // User is not dev
            setResponse(request, response, "ephemeral", "*YOU ARE NOT AN AUTHORIZED DEV. THIS ACTION WILL BE LOGGED AND YOUR ACCOUNT WILL BE SUSPENDED AFTER FUTURE ATTEMPTS*.");
        }
    }
    // USER COMMANDS
    else {
        // If not a dev, prevent user from gaining access during beta
        // REMOVE AT END OF BETA
        if (!isDev(userID)) {
            setResponse(request, response, "in_channel", "I'm sorry, but *SlotBot* is still in beta. As a matter of fact, it's a closed beta and you didn't get an invite. :shit:");
        } else {
            // USER IS VERIFIED - At this point, the user is entering a non-dev command
            if (requestIsOfType(request, commands.setup)) {
                if (isSetup(userID)) {
                    // USER IS ALREADY SETUP AND TRIED AGAIN
                    setResponse(request, response, "in_channel", "You think this is a mother fucking game? How dare you try to make me do work I've already done... :shit:");
                } else {
                    // USER IS NOT SETUP, CREATE THEIR ACCOUNT
                    setupUser(messageData);
                }
            } else {
                if (isSetup(userID)) {
                    // USER IS SETUP AND HAS ENTERED A COMMAND
                    if (requestIsOfType(request, commands.help)) {
                        // HELP COMMAND
                        response.json(helpJSON);
                    } else if (requestIsOfType(request, commands.late)) {
                        // USER IS LATE COMMAND
                        userIsLate(messageData);
                    } else if (requestIsOfType(request, commands.create)) {
                        // CREATE PARTY COMMAND
                        createParty(messageData);
                    } else {
                        // INVALID COMMAND
                        setResponse(request, response, "ephemeral", "It looks like you didn't use a valid command or you forgot to include required parameters. Try using `/slotbot help`!: kissing_heart: ");
                    }
                } else {
                    setResponse(request, response, "ephemeral", "It looks like you haven't used SlotBot before. Type */slotbot setup* to get started!");
                }
            }
        }
    }
});

app.use('/api', router);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});






// USER CHECK FUNCTIONS
function isDev(userID) {
    if (devs[userID]) {
        return true;
    }
    return false;
}

function isSetup(userID) {
    if (users[userID]) {
        return true;
    }
    return false;
}






// RegEx FUNCTIONS
function requestIsOfType(request, commandRE) {
    if (request.body.text.match(commandRE)) {
        return true;
    }
    return false;
}




// COMMAND FUNCTIONS
// DEV:
function devCommands(messageData) {
    var matches = messageData.request.body.text.match(commands.dev);

    var clearAllUsersRE = / clear all users/i;
    var toggleDevStatusRE = / toggle dev status/i;

    if (matches[1].match(clearAllUsersRE)) {
        users = {};
        writeUsers();
        setResponse(messageData.request, messageData.response, "ephemeral", "All user data deleted");
    } else if (matches[1].match(toggleDevStatusRE)) {
        devs[messageData.userID] = !devs[messageData.userID];
        setResponse(messageData.request, messageData.response, "ephemeral", "Dev status set: " + devs[messageData.userID]);
    } else {
        setResponse(messageData.request, messageData.response, "ephemeral", "Dev...", JSON.stringify(messageData.request.body));
    }
}

//USER:
function setupUser(messageData) {
    users[messageData.userID] = messageData.gamertag;
    writeUsers();
    setResponse(messageData.request, messageData.response, "ephemeral", "\n\n\nYou're good to go! Type `/slotbot help` to learn how to use me :wink:");
    sendMessage(messageData.gamertag + " has been added to SlotBot! :bowtie:", messageData.request.body.response_url);
}

function userIsLate(messageData) {
    var match = messageData.request.body.text.match(commands.late);
    var lateGT = match[2];
    lateGT = lateGT.trim();
    setResponse(messageData.request, messageData.response, "in_channel", "@" + lateGT + "was late to the party. They have been removed :cry: but their spot has been vacted :sunglasses:");
}

function createParty(messageData) {
    var match = messageData.request.body.text.match(commands.create);
    var partyID = 7;
    var time = "5:00PM";
    var date = "Today";

    setResponse(messageData.request, messageData.response);
    sendMessage("@" + messageData.gamertag + " has created a new party! (" + time + " - " + date + ")\n To join, type `/slotbot join party " + partyID + "`", messageData.request.body.response_url);
}






// IO FUNCTIONS
function readGames() {
    try {
        var gamesFile = fs.lstatSync('games.json');
        if (gamesFile.isFile()) {
            games = JSON.parse(fs.readFileSync('games.json', 'utf8'));
        }
    } catch (e) {
        games = {};
    }
}

function readUsers() {
    try {
        var usersFile = fs.lstatSync('users.json');
        if (usersFile.isFile()) {
            users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        }
    } catch (e) {
        users = {};
    }
}

function readHelpJSON() {
    try {
        var helpFile = fs.lstatSync('help.json');
        if (helpFile.isFile()) {
            helpJSON = JSON.parse(fs.readFileSync('help.json', 'utf8'));
            console.log(JSON.stringify(helpJSON));
        }
    } catch (e) {
        helpJSON = {
            "text": "The server encountered an unexpected error. Please message one of the devs. (" + e + ")"
        };
    }
}

function writeGames() {
    fs.writeFile('games.json', JSON.stringify(games), function (err) {
        if (err) return console.log(err);
    });
}

function writeUsers() {
    fs.writeFile('users.json', JSON.stringify(users), function (err) {
        if (err) return console.log(err);
    });
}







// COMMUNICATION FUNCTIONS
function setResponse(request, response, type, text, attachmentText) {
    if (!type) {
        type = "ephemeral";
    }

    response.json({
        "response_type": type,
        "text": text,
        "attachments": [
            {
                "text": attachmentText
                }
            ]
    });
}

function sendMessage(message, destination) {

    var postData = JSON.stringify({
        "response_type": "in_channel",
        "text": message
    });

    requests.post({
        headers: {
            'content-type': 'application/json'
        },
        url: destination,
        body: postData
    }, function (error, response, body) {
        console.log(body);
    });
}

function connectToDB() {
    mongoose.connect(process.env.MONGOLAB_URI);

    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
}
