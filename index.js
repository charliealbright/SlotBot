fs = require('fs');

var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var games, users;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

var router = express.Router()

router.post('/', function (request, response) {
//    readGames();
//    readUsers();

    var devRE = /dev(.+)/i;

    // DEV
    if (request.body.text.match(devRE)) {
        setResponse(request, response, "ephemeral", "Dev...");
    }
    // USER
    else {

        var userID = request.body.user_id;

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

app.use('/api', router);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
