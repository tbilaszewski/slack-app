const admin = require('firebase-admin');
import { QuoteData } from './interfaces/quotes.interface'
import { loadData } from './events'
import serviceAccount = require('../../perms/slack-app-quotes-0b685d8685f7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export class DatabaseService {

  private author: String;
  private collectionName = 'quotes';
  private collection;
  private document;

  constructor(author: String | null) {
    this.author = author;
    this.collection = db.collection(this.collectionName);
  }

  //@FilterByAuthor(this.author, this)
  private getQuotesDocuments() {
    if (this.author) {
      return this.collection.where('author', '==', this.author).get();
    } else {
      return this.collection.get();
    }
  }

  //@Random(this)
  public prepareQuoteDocument() {
    return this.getQuotesDocuments().then(documents => {
      console.log(`found documents ${documents}`)
      this.document = getRandomDocument(documents);
    }).catch(() => {
      console.log(`documents not found`)
      this.document = null;
    }).finally(() => {
      loadData.emit('finished');
    });
  }

  public getuQoteDocument() {
    return this.document;
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

// function FilterByAuthor(author: String, self) {
//   return function (target: Object, key: String | Symbol, descriptor: PropertyDescriptor) {
//     const method = descriptor.value;
//     descriptor.value = function (...args: any[]) {
//       const result = method.apply(self, args);
//       if (author) {
//         return result.where('author', '==', author).get();
//       } else {
//         return result.get();
//       }
//     };
//     return descriptor;
//   };
// }

// function Random(self) {
//   return function (target: Object, key: String | Symbol, descriptor: PropertyDescriptor) {
//     const method = descriptor.value;
//     descriptor.value = function (...args: any[]) {
//       const documents = method.apply(self, args);
//       if (documents && !documents.empty) {
//         return getRandomDocument(documents);
//       } else {
//         return null;
//       }
//     };
//     return descriptor;
//   };
// }

function getRandomDocument(documents) {
  console.log(`getRandomDocument from ${documents.size} documents`)
  const randomNumber = Math.round(Math.random() * (documents.size - 1));
  let iter = 0;
  let result = null;
  documents.forEach(document => {
    if (iter++ === randomNumber) {
      console.log(`return doc ${JSON.stringify(document.data())}`);
      result =  document.data();
    }
  });
  return result;
}