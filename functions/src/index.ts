import functions = require('firebase-functions');
import { addQuoteToDB, getQuoteFromDB, QuoteData } from './database';
import { authenticate } from './config/authentications';

enum UserResponse {
  Accept = "accept",
  Cancel = "cancel",
  WrongInput = "wrongInput"
}

exports.quotes = functions.https.onRequest((req, response) => {
  getQuoteFromDB(req);
  const text = "przygotowuję cytat, może to trochę potrwać...";

  return response.contentType("json").status(200).send({
    "response_type": "ephemeral",
    "text": text
  });
});

exports.quoteRequest = functions.https.onRequest((req, response) => {
  const { body: requestBody } = req;
  const text: string = requestBody.text;
  const user_id: string = requestBody.user_id;
  const [author, ...quoteInput] = text ? text.split(" ") : Array(2).fill(" ");
  const quote = quoteInput.join(" ").replace(/"/g, "");

  if (!authenticate(req)) {
    return response.contentType("json").status(401).send({
      "text": "Nieautoryzowana próba",
      "Content-type": "application/json",
      "response_type": "ephemeral",
    });
  } else {
    return response.contentType("json").status(200).send({
      "text": "Próbujesz dodać cytat",
      "Content-type": "application/json",
      "response_type": "ephemeral",
      "attachments": [
        {
          "title": "Autor",
          "text": author
        },
        {
          "title": "Cytat",
          "text": quote
        },
        {
          "title": `<@${user_id}>, czy przyrzekasz, że powyższy cytat jest prawdziwy i nie spowoduje zanieczyszczenia bazy?`,
          "callback_id": "addQuote",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": UserResponse.Accept,
              "text": "Przyrzekam, dodaj :ricardomilos: ",
              "type": "button",
              "value": JSON.stringify({
                "author": author,
                "quote": quote
              }),
              "style": "primary"
            },
            {
              "name": UserResponse.Cancel,
              "text": "Odrzuć :mikecry: ",
              "type": "button",
              "value": UserResponse.Cancel,
              "style": "danger"
            }
          ]
        }
      ]
    });
  }

});


exports.addQuote = functions.https.onRequest(({ body: requestBody }, response) => {
  const payload = JSON.parse(requestBody.payload);
  const quote = prepareQuote(payload);
  if (quote && quote.author && quote.quote) {
     addQuoteToDB(quote);
  }
  response.contentType("json").status(200).send(prepareResponse(payload));
});

interface SlackResponse {
  text?: string,
  attachments?: Array<Object>,
  "Content-type"?: string,
  response_type?: string,
  delete_original?: string,
  replace_original?: string
}

function prepareQuote(payload): QuoteData | null {
  if (!payload) {
    return null;
  }
  const { actions, user } = payload;
  const { length, [length - 1]: lastAction } = actions;
  const { name: reason, value } = lastAction;
  if (reason !== UserResponse.Accept) {
    return null;
  }
  const valueObject = JSON.parse(value);

  return {
    author: valueObject.author,
    quote: valueObject.quote,
    addedDate: Date.now(),
    addedby: user
  };
}

function prepareResponse(payload): SlackResponse {
  const { type, actions, callback_id, user } = payload;

  if (type === "interactive_message" && callback_id === "addQuote" && actions.length > 0) {
    let { name: reason, value } = actions[actions.length - 1];
    let valueObject;
    if (value !== UserResponse.Cancel) {
      valueObject = JSON.parse(value);
      if (!valueObject.author.trim() || !valueObject.quote.trim()) {
        reason = UserResponse.WrongInput;
      }
    }
    switch (reason) {
      case UserResponse.Accept:
        return {
          "Content-type": "application/json",
          "response_type": "in_channel",
          "replace_original": "true",
          "text": `<@${user.id}> dodaje nowy cytat  *${valueObject.author}*: _"${valueObject.quote}"_`
        };
      case UserResponse.Cancel:
        return {
          "Content-type": "application/json",
          "delete_original": "true"
        };
      default:
      case UserResponse.WrongInput:
        return {
          "Content-type": "application/json",
          "replace_original": "true",
          "response_type": "ephemeral",
          "text": "Nie podałeś autora i/lub cytatu"
        };
    }
  } else {
    return {
      "Content-type": "application/json",
      "replace_original": "true",
      "text": "Coś poszło nie tak :("
    };
  }
}
