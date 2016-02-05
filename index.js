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
									"color": "#7CD197"
								},
								{
									"title": "Creating a Party",
									"text": "`/slotbot create party [slots] [time] [date]` Creates a new party with the specified parameters.",
									"color": "#F35A00",
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
									]
									
								}
							]
							
							
//                            "\n\
//                            \n1) Create a new party: `/slotbot create party [# slots] [time] [date]`\
//                            \n\t_# slots_: number of slots in number format\
//                            \n\t_time_: time when the party will begin as a specific time (5:00PM) or a relative time ('1 hour from now')\
//                            \n\t_date_: date of the part which can be a specific date (4/20/16) or a relative date ('tomorrow' or 'saturday')\
//                            \n\
//                            \n2) Show Parties: `/slotbot show parties`\
//                            \n\
//                            \n3) Join a Party: `/slotbot join party [party #]`\
//                            \n\t_party #_: this can be obtained through the 'show parties' command\
//                            \n\t"
                        });

                    } else if (request.body.text.match(isLateRE)) {
                        var match = request.body.text.match(isLateRE);
                        setResponse(request, response, "in_channel", match[2] + " has been removed :cry:");
                        //REMOVE FROM PARTY
                    } else if (request.body.text.match(createPartyRE)) {
                        var match = request.body.text.match(createPartyRE);
                        partyID = 7;
                        setResponse(request, response, "in_channel", "New party created! To join, type `/slotbot join party " + partyID + "`");
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
