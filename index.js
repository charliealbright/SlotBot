var fs = require('fs');
var requests = require('request');

var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var games, users;

var devs = {
    "U0AQU2TKQ": true,
    "U0AQSDFHS": true
};

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

var router = express.Router()

router.post('/', function (request, response) {
    readGames();
    readUsers();
    var userID = request.body.user_id;

    var devRE = /dev(.*)/i;
    // DEV
    if (request.body.text.match(devRE)) {

        var matches = request.body.text.match(devRE);

        var clearAllUsersRE = / clear all users/i;
        var toggleDevStatusRE = / toggle dev status/i;

        if (matches[1].match(clearAllUsersRE)) {
            users = {};
            writeUsers();
            setResponse(request, response, "ephemeral", "All user data deleted");
        } else if (matches[1].match(toggleDevStatusRE)) {
            devs[userID] = !devs[userID];
            setResponse(request, response, "ephemeral", "Dev status set: " + devs[userID]);
        } else {
            setResponse(request, response, "ephemeral", "Dev...", JSON.stringify(request.body));
        }
    }
    // USER
    else {
        // If not a dev...
        if (!devs[userID]) {
            setResponse(request, response, "in_channel", "I'm sorry, but *SlotBot* is still in beta. As a matter of fact, it's a closed beta and you didn't get an invite. :shit:");
        } else {
            var gamertag = request.body.user_name;

            var setupRE = /setup/i;
            if (request.body.text.match(setupRE)) {
                users.userID = gamertag;
                writeUsers();
                setResponse(request, response, "ephemeral", "You're good to go! Type _*/slotbot help*_ to learn how to use me :wink:");
                sendMessage(gamertag + " has been added to SlotBot! :bowtie:", request.body.response_url);
            } else {
                if (users.userID) {

                    var helpRE = /help/i;
                    var isLateRE = /(@?)(.+)is late/i;

                    if (request.body.text.match(helpRE)) {
                        response.json({
                            "response_type": "ephemeral",
                            "text": "Here you go, <@" + request.body.user_id + ">. This might help:"
                        });

                    } else if (request.body.text.match(isLateRE)) {
                        var match = request.body.text.match(isLateRE);
                        setResponse(request, response, "in_channel", match[2] + " has been removed :cry:");
                        //REMOVE FROM PARTY
                    } else {
                        setResponse(request, response, "ephemeral", request.body.user_name, request.body.text);
                    }
                } else {
                    setResponse(request, response, "ephemeral", "It looks like you haven't use SlotBot before. Type */slotbot setup* to get started!");
                }
            }
        }
    }
});

function readGames() {
    try {
        gamesFile = fs.lstatSync('games.json');
        if (gamesFile.isFile()) {
            games = JSON.parse(fs.readFileSync('games.json', 'utf8'));
            console.log('It worked!');
        }
    } catch (e) {
        games = {};
    }
}

function readUsers() {
    try {
        usersFile = fs.lstatSync('users.json');
        if (usersFile.isFile()) {
            users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
        }
    } catch (e) {
        users = {};
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

app.use('/api', router);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
