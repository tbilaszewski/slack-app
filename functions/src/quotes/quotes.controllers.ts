import { RequestObject, ResponseObject } from '../slack-api/slack.interfaces';
import { QuoteData } from './interfaces/quotes.interface';
import { DatabaseService } from './quotes.service';
import { loadData } from './events';

const axios = require('axios');

const request = require('request');

enum UserResponse {
  Accept = "accept",
  Cancel = "cancel",
  WrongInput = "wrongInput"
}

export default class QuoteController {
  public author: String;
  public quote: String;
  private user_id: String;
  private response_url: String;
  private payload: RequestObject['body']['payload'];
  private dbService: DatabaseService;
  private req;

  constructor({ body } :RequestObject) {
    this.req = body;
    console.log(JSON.stringify(body))
    const { text } = body;
    const [author, ...quotesArray] = text ? text.split(" ") : Array(2).fill(null);
    this.author = author;
    this.quote = quotesArray.join(" ").replace(/"/g, "");
    this.user_id = body.user_id;
    this.response_url = body.response_url;
    this.payload = body?.payload;
    this.dbService = new DatabaseService(this.author);
  }

  public getQuote() {
    console.log('QuoteController.getQuote()')
    this.dbService.prepareQuoteDocument();
    loadData.once('finished', () => {
      const document = this.dbService.getuQoteDocument();
      const message = this.formatResponseMessage(document);
      console.log(`doc=${JSON.stringify(message)}`)
      this.sendResponse(message);
    });
  }

  public getNewQuoteForm() {
    return {
      "text": "Próbujesz dodać cytat",
      "Content-type": "application/json",
      "response_type": "ephemeral",
      "attachments": [
        {
          "title": "Autor",
          "text": this.author
        },
        {
          "title": "Cytat",
          "text": this.quote
        },
        {
          "title": "request",
          "text": JSON.stringify(this.req)
        },
        {
          "title": `<@${this.user_id}>, czy przyrzekasz, że powyższy cytat jest prawdziwy i nie spowoduje zanieczyszczenia bazy?`,
          "callback_id": "addQuote",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": UserResponse.Accept,
              "text": "Przyrzekam, dodaj :ricardomilos: ",
              "type": "button",
              "value": JSON.stringify({
                "author": this.author,
                "quote": this.quote
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
    }
  }

  public addQuote(): Boolean {
    const quoteObject = this.buildQuote();
    return this.dbService.addQuote(quoteObject);
  }

  private formatResponseMessage(document): ResponseObject {
    if (document) {
      return {
        response_type: "in_channel",
        replace_original: "true",
        text: `*${document.author}*: _"${document.quote}"_`,
        attachments: [{
          text: `wywołał <@${this.user_id}>`
        }]
      }
    } else {
      return {
        response_type: "ephemeral",
        replace_original: "true",
        text: `Nie znaleziono cytatów dla *${this.author}*`,
        attachments: [{
          text: `wywołał <@${this.user_id}>`
        }]
      }
    }
  }

  public newQuoteResponse(): ResponseObject {
    const { type, actions, callback_id, user } = this.payload;
    console.log(`this.payload=${JSON.stringify(this.payload)}`)
    if (type === "interactive_message" && callback_id === "addQuote" && actions.length > 0) {
      console.log(`type=${type} callback_id=${callback_id} actions.length=${actions.length}`)
      let { name, value } = actions[actions.length - 1];
      let valueObject;
      if (value !== UserResponse.Cancel) {
        valueObject = JSON.parse(value);
        if (!valueObject.author.trim() || !valueObject.quote.trim()) {
          name = UserResponse.WrongInput;
        }
      }
      console.log(`name=${name}`);
      switch (name) {
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
        case UserResponse.WrongInput:
          return {
            "Content-type": "application/json",
            "replace_original": "true",
            "response_type": "ephemeral",
            "text": "Nie podałeś autora i/lub cytatu"
          };
        default:
          return {
            "Content-type": "application/json",
            "replace_original": "true",
            "text": "Coś poszło nie tak :("
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

  private buildQuote(): QuoteData | null {
    let object;
    const { actions, user } = this.payload ?? {actions: [null], user: null};
    const { length, [length - 1]: lastAction } = actions;
    const { name: reason, value } = lastAction;
    if (reason !== UserResponse.Accept) {
      return null;
    }
    object.author = this.author;
    object.quote = this.quote;
    object.addedby = user ?? this.user_id;
    object.addedDate = Date.now();

    return object;
  }

  private sendResponse(data: ResponseObject): Boolean {
    let result: Boolean;
    if (!this.response_url) return false;
    axios.post(this.response_url, {
      data: data
    }).then(() => {
      result = true;
    }).catch(() => {
      result = false;
    })
    return result;
  }
}