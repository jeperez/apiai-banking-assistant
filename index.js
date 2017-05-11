'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const firebase = require('firebase');

const restService = express();
restService.use(bodyParser.json());

// Initialize Firebase
var config = {
    apiKey: "AIzaSyAp_AD1BbSpYzXON5m2HEuymRdpppuVRDY",
    authDomain: "hackathon-qkquyv.firebaseapp.com",
    databaseURL: "https://hackathon-qkquyv.firebaseio.com",
    projectId: "hackathon-qkquyv",
    storageBucket: "hackathon-qkquyv.appspot.com",
    messagingSenderId: "196891096619"
};
firebase.initializeApp(config);
firebase.database().ref('accounts/john').set({
    name: "John"
});



restService.post('/hook', function (req, res) {

    console.log('hook request');

    try {
        var speech = 'empty speech';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                if (requestBody.result.parameters) {
                    var parameters = requestBody.result.parameters;

                    // todo doTransaction(parameters.account, parameters.money);
                }

                // remove these lines
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                if (requestBody.result.action) {
                    speech += 'action: ' + requestBody.result.action;
                }
                // end: remove these lines
            }
        }

        console.log('result: ', speech);

        // todo return result inside fulfillment node
        return res.json({
            speech: speech,
            displayText: speech,
            source: 'apiai-webhook-sample'
        });
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});