import * as functions from 'firebase-functions';

exports.quotes = functions.https.onRequest(async (request, response) => {


  return response.contentType("json").status(200).send({
    "response_type": "ephemeral",
    "text": "in construction..."
  });
});
