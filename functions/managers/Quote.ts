const admin = require('firebase-admin');
import env from "../config/env";
import Quote from '../model/Quote';

admin.initializeApp({
  credential: admin.credential.cert(env.firebase)
});

const { firebase } = admin;

export const addQuote = async (quote: Quote): Promise<boolean> => {
  return await firebase
    .collection("quotes")
    .get()
    .then(quotes => {
      return quotes;
    })
    .catch(error => {
      return error;
    });
}

export const getQuotesByAuthor = async (author: string): Promise<any> => {
  return await firebase
    .collection("quotes")
    .where("author", "==", author)
    .get()
    .then(quotes => {
      return quotes;
    })
    .catch(error => {
      return error;
    });
};

export const getQuotes = async (): Promise<any> => {
  return await firebase
    .collection("quotes")
    .get()
    .then(quotes => {
      return quotes;
    })
    .catch(error => {
      return error;
    });
};