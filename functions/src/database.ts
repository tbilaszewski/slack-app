const COLLECTION_NAME = 'quotes';

const admin = require('firebase-admin');
const axios = require('axios')

import serviceAccount = require('../perms/slack-app-quotes-0b685d8685f7.json');
import { authenticate } from './authentications';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


export interface QuoteData {
  author: string,
  quote: string,
  addedDate: number,
  addedby: object
}

export function addQuoteToDB(quote: QuoteData): boolean {
  let result;
  if (!quote.author.trim() || !quote.quote.trim()) {
    return false;
  }
  db.collection(COLLECTION_NAME).add(quote).then(ref => {
    result = true;
  }).catch(err => {
    result = false;
  });
  return result;
}

export function getQuoteFromDB(req): void {
  const { user_id, text: author, response_url } = req.body;
  if (author) {
    db.collection(COLLECTION_NAME).where('author', '==', author).get()
      .then(quoteData => {
        if (quoteData.empty) {
          sendResponseToUser(response_url, {
            "response_type": "ephemeral",
            "replace_original": "true",
            "text": `Nie znaleziono cytatów dla *${author}*`,
            "attachments": [{
              "text": `wywołał <@${user_id}>`
            }]
          });
        } else {
          const random = Math.round(Math.random() * (quoteData.size - 1));
          let iter = 0;
          quoteData.forEach(doc => {
            if (iter++ === random) {
              const data = doc.data();
              sendResponseToUser(response_url, {
                "response_type": "in_channel",
                "replace_original": "true",
                "text": `*${data.author}*: _"${data.quote}"_`,
                "attachments": [{
                  "text": `wywołał <@${user_id}>`
                }]
              });
            }
          });
        }
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
  } else {
    db.collection(COLLECTION_NAME).get()
      .then(quoteData => {
        const random = Math.round(Math.random() * (quoteData.size - 1));
        let iter = 0;
        quoteData.forEach(doc => {
          if (iter++ === random) {
            const data = doc.data();
            sendResponseToUser(response_url, {
              "response_type": "in_channel",
              "replace_original": "true",
              "text": `*${data.author}*: _"${data.quote}"_`,
              "attachments": [{
                "text": `wywołał <@${user_id}>`
              }]
            });
          }
        });
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
  }
}

function sendResponseToUser(response_url: string, data: Object) {
  if (!response_url) return;
  axios.post(response_url, {
    data: data
  }).then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
}
