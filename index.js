var express = require('express');
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

var router = express.Router()

router.post('/', function(request, response) {
	response.json(request);
//	response.json({
//		  "response_type": "ephemeral",
//		  "text": "Development of SlotBot is currently underway!"
//	  });
});

app.use('/api', router);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


