import functions = require('firebase-functions');

import { addQuoteToDB } from './database'
const moment = require('moment');

enum UserResponse {
  Accept = "accept",
  Cancel = "cancel"
}

exports.quotes = functions.https.onRequest(async (request, response) => {


  return response.contentType("json").status(200).send({
    "response_type": "ephemeral",
    "text": "in construction..."
  });
});

exports.quoteRequest = functions.https.onRequest(({ body: requestBody }, response) => {

  const text: string = requestBody.text;
  const user_id: string = requestBody.user_id;
  const [author, ...quoteInput] = text ? text.split(" ") : Array(2).fill(" ");
  const quote = quoteInput.join(" ").replace(/"/g, "");

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
            "value": "cancel",
            "style": "danger"
          }
        ]
      }
    ]
  });
});


exports.addQuote = functions.https.onRequest(({ body: requestBody }, response) => {
  const payload = JSON.parse(requestBody.payload);
  response.contentType("json").status(200).send(prepareResponse(payload));
  addQuoteToDB({ author: 'Tomasz', quote: 'yhyyyymmmm', date: Date.now()}).catch(err => console.log(err));
});
interface SlackResponse {
  text?: string,
  attachments?: Array<Object>,
  "Content-type"?: string,
  response_type?: string,
  delete_original?: string,
  replace_original?: string
}

function prepareResponse(payload): SlackResponse {
  const { type, actions, callback_id, user } = payload;

  if (type === "interactive_message" && callback_id === "addQuote" && actions.length > 0) {
    const { name, value } = actions[actions.length - 1];
    switch (name) {
      case UserResponse.Accept:
        const valueObject = JSON.parse(value);
        return {
          "Content-type": "application/json",
          // "response_type": "ephemeral",
          "replace_original": "true",
          "text": `<@${user.id}> dodaje nowy cytat  *${valueObject.author}*: _"${valueObject.quote}"_`
        };
      default:
      case UserResponse.Cancel:
        return {
          "Content-type": "application/json",
          "delete_original": "true"
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
