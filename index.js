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

function doTransaction(accountKey, transaction, onError, onSuccess) {

    firebase.database().ref('accounts').once('value', function (snapshot) {

        if (snapshot.hasChild(accountKey)) {

            firebase.database().ref('accounts/' + transaction.sender).once('value').then(function (snapshot) {
                var userBalance = snapshot.val().balance;

                if (userBalance.amount < transaction.money.amount) {
                    onError('Sorry, you do not have enough balance.');
                } else {

                    // charge balance of sender
                    userBalance.amount -= transaction.money.amount;
                    firebase.database().ref('accounts/' + transaction.sender + '/balance').set(userBalance);

                    // update lastTransaction of receiver
                    firebase.database().ref('accounts/' + accountKey + '/lastTransaction').set(transaction);

                    // increase balance of receiver
                    firebase.database().ref('accounts/' + accountKey).once('value').then(function (snapshot) {
                        var balance = snapshot.val().balance;
                        balance.amount += transaction.money.amount;
                        balance.currency = transaction.money.currency;
                        firebase.database().ref('accounts/' + accountKey + '/balance').set(balance);
                    });

                    console.log('Doing transaction on Firebase: ' + transaction.sender + ' -> (' + transaction.money.amount + ') -> ' + accountKey);
                    onSuccess('Your current balance is ' + userBalance.amount + ' ' + userBalance.currency + ' after transaction.');
                }
            });

        } else {

            onError('Sorry. ' + accountKey + ' could not found. Try another name later.');

        }
    });




}

restService.post('/hook', function (req, res) {

    console.log('hook request');

    try {

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {

                if (requestBody.result.action === 'actionLogin') {

                    if (requestBody.result.parameters) {
                        var parameters = requestBody.result.parameters;

                        // check sender exists from firebase
                        firebase.database().ref('accounts').once('value', function (snapshot) {

                            if (snapshot.hasChild(parameters.username.toLowerCase())) {
                                returnSuccess(res, requestBody.result.fulfillment.speech, '');
                            } else {
                                returnError(res, 'Sorry ' + parameters.username + '. I could not find your registration. Please, try again.');
                            }
                        });

                    }

                } else if (requestBody.result.action === 'actionTransfer') {

                    if (requestBody.result.parameters) {
                        var parameters = requestBody.result.parameters;

                        doTransaction(parameters.account.toLowerCase(), {
                            sender: parameters.username.toLowerCase(),
                            money: parameters.money
                        }, function (errorMessage) {
                            returnError(res, errorMessage);
                        }, function (successMessage) {
                            returnSuccess(res, requestBody.result.fulfillment.speech, successMessage);
                        })
                    }
                }
            }
        }

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

function returnError(res, errorMessage) {
    return res.json({
        speech: errorMessage,
        displayText: errorMessage,
        source: 'apiai-webhook-sample'
    });
}

function returnSuccess(res, speech, successMessage) {
    var result = speech + ' ' + successMessage;
    console.log('result: ', result);
    return res.json({
        speech: result,
        displayText: result,
        source: 'apiai-webhook-sample'
    });
}

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});