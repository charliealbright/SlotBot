var express = require('express');
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

var router = express.Router()

router.post('/', function (request, response) {

    var helpRE = /help/i;
    var isLateRE = /(.+)is late/i;

    if (request.body.text.match(helpRE)) {
        setResponse(request, response, "ephemeral", "Here is teh HALP");

    } else if (request.body.text.match(helpRE)) {

    } else {
        setResponse(request, response, "ephemeral", request.body.user_name, request.body.text);
    }

    //	response.json({
    //		"response_type": "ephemeral",
    //		"text": "Development of SlotBot is currently underway!",
    //		"attachments": [
    //			{
    //				"text": request.body.text
    //			}
    //		]
    //	  });
});


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
