'use strict';
require('rootpath')();

var paypal_api = require('paypal-rest-sdk');
var User = require('libs/cassandra/user.js')
var config_opts = ({
  'host': 'api.sandbox.paypal.com',
  'port': '',
  'client_id': 'AQRGfxC6XW8jB7EjK_rlQKxfP7ghd7dtJ1YlJ5TQJS3fEyYwZk_sw_5wUoEq',
  'client_secret': 'EHSERBCFit8bDALDSpuEqDwCn1akLlEbvF_jRWrg8SO-JwyW-i5azCUA4x6n'
})


function getCreditCard(cardType, cardNumber, expireMonth, expireYear, cvv2, firstName, lastName) {
  var card_data = {
    "type": cardType,
    "number": cardNumber,
    "expire_month": expireMonth,
    "expire_year": expireYear,
    "cvv2": cvv2,
    "first_name": firstName,
    "last_name": lastName
  }
  paypal_api.credit_card.create(card_data, config_opts, function(error, credit_card){
    if (error) {
      console.log(error);
      throw error;
    }
    else {
      console.log("Create Credit-Card Response");
      console.log(credit_card);
    }
  })
}


function makePaymentCreditCard(cardType, cardNumber, expireMonth, expireYear, cvv2, firstName, lastName, line1, city, state, postalCode, countryCode, amount, callback) {
  var paymentJson = {
    "intent": "sale",
    "payer" : {
      "payment_method": "credit_card",
      "funding_instruments": [{
        "credit_card": {
          "type": cardType,
          "number": cardNumber,
          "expire_month": expireMonth,
          "expire_year": expireYear,
          "cvv2": cvv2,
          "first_name": firstName,
          "last_name": lastName,
          "billing_address": {
            "line1": line1,
            "city": city,
            "state": state,
            "postal_code": postalCode,
            "country_code": countryCode
          }
        }
      }]
    },
    "transactions": [{
      "amount": {
        "total": amount,
        "currency": "USD",
        "details": {
          "subtotal": amount,
          "tax": "0",
          "shipping": "0"
        }
      },
      "description": "You have deposited " + amount + " dollars."
    }]
  }
  callback(null, paymentJson);
}

function createPayment(user, cardType, cardNumber,
  expireMonth, expireYear, cvv2, firstName, lastName,
  line1, city, state, postalCode, countryCode, amount, callback) {

  makePaymentCreditCard(cardType, cardNumber, expireMonth, expireYear,
    cvv2, firstName, lastName, line1, city, state, postalCode,
    countryCode, amount, function(err, result) {

    if (err) {
      callback(err)
    }
    else {
      var paymentJson = result;
      paypal_api.payment.create(paymentJson, config_opts, function(err) {
        if (err) {
          console.log("Error Payment: " + err); //change to flash message
        }
        else {
          User.updateMoneyOneUser(amount, user, function(err) {
            callback(err);
          });
        }
      });
    }
  })
}

var submitPayment = function(req, res, next) {
  var user = req.user.user_id;
  var cardType = req.body.cardType;
  var cardNumber = req.body.cardNumber;
  var expireMonth = req.body.expireMonth;
  var expireYear = req.body.expireYear;
  var cvv2 = req.body.cvv2;
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var line1 = req.body.address1;
  var city = req.body.city;
  var state = req.body.state;
  var postalCode = req.body.postalCode;
  var amount = req.body.amount;
  if (req.user) {
    createPayment(user, cardType, cardNumber, expireMonth, expireYear, cvv2,
      firstName, lastName, line1, city, state, postalCode, 'US', amount,
      function(err) {
      if (err) {
        console.log("1")
        console.log(err);
      }
      else {
        console.log("2");
        res.redirect('/user');
      }
    });
  }
}

exports.submitPayment = submitPayment;

/*
createPayment(user, 'visa', '4266841355673748', '07', '2016', '028', 'Jeffrey', 'Yan', '160 Scranton Avenue', 'Lynbrook', 'NY', '11563', 'US', '0.05', function(err) {
  if (err) {
    console.log(err);
  }
})*/