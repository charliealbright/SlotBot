var fs = require('fs');
var requests = require('request');

var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var games, users;
readGames();
readUsers();

var devs = {
    "U0AQU2TKQ": true,
    "U0AQSDFHS": true,
    "U0AQWEX0D": true
};

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

var router = express.Router()

router.post('/', function (request, response) {
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
                users[userID] = gamertag;
                writeUsers();
                setResponse(request, response, "ephemeral", "\n\n\nYou're good to go! Type `/slotbot help` to learn how to use me :wink:");
                sendMessage(gamertag + " has been added to SlotBot! :bowtie:", request.body.response_url);
            } else {
                if (users[userID]) {

                    // RegEx Checks
                    var helpRE = /help/i;
                    var isLateRE = /(@?)(.+)is late/i;
                    var createPartyRE = /create party(.+)/i

                    if (request.body.text.match(helpRE)) {
                        response.json({
                            "response_type": "ephemeral",
                            "text": "*Here you go, <@" + request.body.user_id + ">. This might help:*",

                            "attachments": [
                                {
                                    "title": "Getting Help",
                                    "text": "`/slotbot help` Shows this help menu.",
                                    "color": "#e74c3c",
									"mrkdwn_in": ["text"]
								},
                                {
                                    "title": "Creating a Party",
                                    "text": "`/slotbot create party [slots] [time] [date]` Creates a new party with the specified parameters.",
                                    "color": "#f39c12",
                                    "fields": [
                                        {
                                            "title": "[slots]",
                                            "value": "Number of slots in party.",
                                            "short": true
										},
                                        {
                                            "title": "[time]",
                                            "value": "Time when party will begin.",
                                            "short": true
										},
                                        {
                                            "title": "[date]",
                                            "value": "Date of the party.",
                                            "short": true
										},
									],
									"mrkdwn_in": ["text"]
								},
								{
									"title": "Viewing Parties",
									"text": "`/slotbot show parties` Shows all the parties happening in the near future.\n*Note:* This will only show parties for the current game channel.",
									"color": "#f1c40f",
									"mrkdwn_in": ["text"]
								},
								{
									"title": "Joining Parties",
									"text": "`/slotbot join party [party_number]` This allows you to join a party with the specified number. Party numbers can be seen by using the 'show parties' command.",
									"color": "#2ecc71",
									"fields": [
										{
											"title": "[party_number]",
											"value": "The number of the party you want to join.",
											"short": true
										}
									],
									"mrkdwn_in": ["text"]
								}
							]
                        });

                    } else if (request.body.text.match(isLateRE)) {
                        var match = request.body.text.match(isLateRE);
                        setResponse(request, response, "in_channel", match[2] + " has been removed :cry:");
                        //REMOVE FROM PARTY
                    } else if (request.body.text.match(createPartyRE)) {
                        var match = request.body.text.match(createPartyRE);
                        var partyID = 7;
                        var time = "5:00PM";
                        var date = "Today";

                        setResponse(request, response);
                        sendMessage("@" + gamertag + " has created a new party! (" + time + " - " + date + ")\n To join, type `/slotbot join party " + partyID + "`", request.body.response_url);
                    } else {
                        setResponse(request, response, "ephemeral", "It looks like you didn't use a valid command or you forgot to include required parameters. Try using `/slotbot help`! :kissing_heart:");
                    }

                    // Create party "<!channel> <@" + request.body.user_id + "> has created a new party!"

                } else {
                    setResponse(request, response, "ephemeral", "It looks like you haven't used SlotBot before. Type */slotbot setup* to get started!");
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
