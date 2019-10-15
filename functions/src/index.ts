import admin = require('firebase-admin');
import functions = require('firebase-functions');

admin.initializeApp(functions.config().firebase);
//let db = admin.firestore();

exports.quotes = functions.https.onRequest(async (req, response) => {


  return response.contentType("json").status(200).send({
    "response_type": "ephemeral",
    "text": "in construction..."
  });
});

exports.addQuote = functions.https.onRequest((req, response) => {

  const text: string = req.body.text;
  const user_id: string = req.body.user_id;
  const [author, ...quote] = text ? text.split(' ') : Array(2).fill('');

  return response.contentType("json").status(200).send({
    "text": "Próbujesz dodać cytat",
    "attachments": [
      {
        "title": "Autor",
        "text": author
      },
      {
        "title": "Cytat",
        "text": `"${quote.join(' ').replace(/"/g, "")}"`
      },
      {
        "title": `<@${user_id}>, czy przyrzekasz, że powyższy cytat jest prawdziwy i nie spowoduje zanieczyszczenia bazy?`,
        "callback_id": "slack-app-add-quote",
        "color": "#3AA3E3",
        "attachment_type": "default",
        "actions": [
          {
            "name": "accept",
            "text": "Przyrzekam, dodaj",
            "type": "button",
            "value": "accept"
          },
          {
            "name": "cancel",
            "text": "Odrzuć",
            "type": "button",
            "value": "cancel"
          }
        ]
      }
    ]
  });
});
