const COLLECTION_NAME = 'quotes';

const admin = require('firebase-admin');
const request = require('request')

import serviceAccount = require('../perms/slack-app-quotes-0b685d8685f7.json');

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
  db.collection(COLLECTION_NAME).add(quote).then(ref => {
    console.log('Added document with ID: ', ref.id);
    result = true;
  }).catch(err => {
    console.log(err);
    result = false;
  });
  return result;
}

export function getQuoteFromDB({ user_id, text: author, response_url }): void {
  if (author.trim()) {
    db.collection(COLLECTION_NAME).where('author', '==', author.trim()).get()
      .then(quoteData => {
        console.log(`author=${author}`);
        if (quoteData.empty) {
          request.post(response_url, {
            json: {
              "response_type": "ephemeral",
              "replace_original": "true",
              "text": `Nie znaleziono cytatów dla *${author}*`,
              "attachments": [{
                "text": `wywołał <@${user_id}>`
              }]
            }
          }, (err, res, body) => {
            if (err) {
              console.error(err)
              return err;
            }
          });
          return null;
        }
        const random = Math.round(Math.random() * (quoteData.size - 1));
        let iter = 0;
        quoteData.forEach(doc => {
          if (iter++ === random) {
            const data = doc.data();
            request.post(response_url, {
              json: {
                "response_type": "ephemeral",
                "replace_original": "true",
                "text": `*${data.author}*: _"${data.quote}"_`,
                "attachments": [{
                  "text": `wywołał <@${user_id}>`
                }]
              }
            }, (err, res, body) => {
              if (err) {
                console.error(err)
                return err;
              }
            });
          }
        });
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
  } else {
    db.collection(COLLECTION_NAME).get()
      .then(quoteData => {
        const random = Math.round(Math.random() * (quoteData.size - 1));
        console.log(`random num = ${random}`)
        let iter = 0;
        quoteData.forEach(doc => {
          console.log(`found doc ${doc.id} author=${JSON.stringify(doc.data())}`);
          if (iter++ === random) {
            const data = doc.data();
            request.post(response_url, {
              json: {
                "response_type": "ephemeral",
                "replace_original": "true",
                "text": `*${data.author}*: _"${data.quote}"_`,
                "attachments": [{
                  "text": `wywołał <@${user_id}>`
                }]
              }
            }, (err, res, body) => {
              if (err) {
                console.error(err)
                return err;
              }
            });
          }
        });
      })
      .catch(err => {
        console.log('Error getting documents', err);
      });
  }
}

