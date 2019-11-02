const COLLECTION_NAME = 'quotes';

const admin = require('firebase-admin');

import  serviceAccount = require('./slack-app-quotes-0b685d8685f7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();


interface QuoteData {
  author: string,
  quote: string,
  addedDate: number
}

export function addQuoteToDB(quote: QuoteData): boolean {
  let result;
  db.collection(COLLECTION_NAME).add(quote).then(ref => {
    console.log('Added document with ID: ', ref.id);
    result = true;
  }).catch(err =>{
    console.log(err);
    result = false;
  });
  return result;
}

