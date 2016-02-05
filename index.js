var fs = require('fs');
var request = require('request');

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
    readGames();
    readUsers();

    var devRE = /dev(.*)/i;

    // DEV
    if (request.body.text.match(devRE)) {
        setResponse(request, response, "ephemeral", "Dev...");
        var matches = request.body.text.match(devRE);

        var clearAllUsers = / clear all users/i;
        if (matches[1].match(clearAllUsers)) {
            users = {};
            writeUsers();
        }
    }
    // USER
    else {
        var userID = request.body.user_id;
        var gamertag = request.body.user_name;

        var setupRE = /setup/i;
        if (request.body.text.match(setupRE)) {
            users.userID = gamertag;
            writeUsers();
            setResponse(request, response, "ephemeral", "You're good to go! Type _*/slotbot help*_ to learn how to use me :wink:");
            sendMessage(gamertag + "has been added to SlotBot! :bowtie:", request.body.response_url);
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

    var postData = querystring.stringify({
        "response_type": "in_channel",
        "text": message
    });

    var options = {
        hostname: destination,
        port: 80,
        method: 'POST',
        path: '',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };


    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        //        console.log(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
}

app.use('/api', router);

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
