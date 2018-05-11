"use strict";

var Alexa = require("alexa-sdk");
var twilio = require('twilio');
var TWILIO_ACCOUNT_SID = process.env.tAccSID || require('./config.js').twilAccSID;
var TWILIO_AUTH_TOKEN = process.env.tAuthToken || require('./config.js').twilAuthToken;
var TWILIO_RECEIVER_NUMBER = process.env.tReceiverNumber || require('./config.js').twilReceiverNumber;
var TWILIO_SENDER_NUMBER = process.env.tSenderNumber || require('./config.js').twilSenderNumber;
var client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
  alexa.dynamoDBTableName = 'GroceryList';
  alexa.registerHandlers(handlers);
  alexa.execute();
};

var handlers = {
  "LaunchRequest": function () {
    this.emit(':ask',`Welcome to your grocery list app.`);
  },
  "ReadList" : function() {
    var theList = this.attributes['groceryList'];
    if (theList.length < 1) {
      this.emit(':ask',`Your grocery list is empty.`);
    } else {
      this.emit(':ask',`Your grocery list has the following items. ${theList}`);
    }
  },
  "AddItem" : function() {
    var newItem = this.event.request.intent.slots.food.value;
    this.attributes['groceryList'].push(newItem);
    this.emit(':ask',`Okay, I'm adding ${newItem} to the list.`);
  },
  "RemoveItem" : function() {
    var itemToRemove = this.event.request.intent.slots.food.value;
    var theList = this.attributes['groceryList'];
    var itemIndex = theList.indexOf(itemToRemove);

    if(itemIndex != -1){
      theList.splice(itemIndex, 1);
      this.emit(':ask',`Okay, I'm removing ${itemToRemove} from the list.`);
    } else {
      this.emit(':ask',`I could not find ${itemToRemove} on the list.`);
    }
  },
  "ClearList" : function() {
    this.attributes['groceryList'] = [];
    this.emit(':ask',`Okay. Your list is now empty.`);
  },
  "SendList" : function() {
    var theList = this.attributes['groceryList'];
    var listToSend = theList.join(", ");

    client.messages.create({
      to: TWILIO_RECEIVER_NUMBER,
      from: TWILIO_SENDER_NUMBER,
      body: listToSend
    }).then(message => console.log(message.sid))
      .done();
    this.emit(':ask',`Okay. I'm texting Karen the list now.`);
  },
  // Stop
  'AMAZON.StopIntent': function() {
    this.response.speak('Okay.');
    this.emit(':responseReady');
  },
  // Cancel
  'AMAZON.CancelIntent': function() {
    this.response.speak('Okay.');
    this.emit(':responseReady');
  },
  // Save state
  'SessionEndedRequest': function() {
    console.log('CONSOLE.LOG - session ended!');
    this.emit(':saveState', true);
  }
};
