import functions = require('firebase-functions');

import QuoteController from './quotes/quotes.controllers'

exports.quotes = functions.https.onRequest((request, response) => {
  const controller = new QuoteController(request);
  controller.getQuote();

  return response.contentType("json").status(200).send({
    "response_type": "ephemeral",
    "text": "przygotowuję cytat, może to trochę potrwać..."
  });
});

exports.quoteRequest = functions.https.onRequest((request, response) => {
  const controller = new QuoteController(request);
  const formObject = controller.getNewQuoteForm();

  return response.contentType("json").status(200).send(formObject);
});

exports.addQuote = functions.https.onRequest((request, response) => {
  const controller = new QuoteController(request);
  if (controller.author && controller.quote) {
    controller.addQuote();
  }
  response.contentType("json").status(200).send(controller.newQuoteResponse());
});