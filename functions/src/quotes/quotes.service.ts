const admin = require('firebase-admin');
import { QuoteData } from './interfaces/quotes.interface'
import serviceAccount = require('../../perms/slack-app-quotes-0b685d8685f7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export class DatabaseService {

  private author: String;
  private collectionName = 'quotes';
  private collection;

  constructor(author: String | null) {
    this.author = author;
    this.collection = db.collection(this.collectionName);
  }

  @FilterByAuthor(this.author)
  private getQuotesDocuments() {
    return this.collection;
  }

  @Random()
  public getQuoteDocument() {
    let result;
    this.getQuotesDocuments().then(documents => {
      result = documents;
    }).catch(() => {
      result = null;
    });
    return result;
  }

  public addQuote(quote: QuoteData): Boolean {
    let result: Boolean;
    this.collection.add(quote).then(ref => {
      result = true;
      console.log(`added doc id: ${ref}`)
    }).catch(err => {
      result = false;
      console.log(`error during adding doc: ${err}`)
    });
    return result;
  }
}

function FilterByAuthor(author: String) {
  return function (target: Object, key: String | Symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const result = method.apply(this, args);
      if (author) {
        return result.where('author', '==', author).get();
      } else {
        return result.get();
      }
    };
    return descriptor;
  };
}

function Random() {
  return function (target: Object, key: String | Symbol, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const documents = method.apply(this, args);
      if (documents && !documents.empty) {
        return getRandomDocument(documents);
      } else {
        return null;
      }
    };
    return descriptor;
  };
}

function getRandomDocument(documents) {
  const randomNumber = Math.round(Math.random() * (documents.size - 1));
  let iter = 0;
  documents.forEach(document => {
    if (iter++ === randomNumber) {
      return document.data();
    }
  });
  return null;
}