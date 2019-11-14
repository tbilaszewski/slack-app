const qs = require('qs');
const crypto = require('crypto');

const SECRET: string = String(process.env.SLACK_SIGNING_SECRET);

export function authenticate(req): boolean {
  return true;
  let requestBody = qs.stringify(req.body, { format: 'RFC1738' });
  let timestamp = req.headers['x-slack-request-timestamp'];
  const sig_basestring = 'v0:' + timestamp + ':' + requestBody;
  const my_signature = 'v0=' + crypto.createHmac('sha256', SECRET).update(sig_basestring, 'utf8').digest('hex');
  const slack_signature = req.headers['x-slack-signature'];

  return crypto.timingSafeEqual(Buffer.from(my_signature, 'utf8'), Buffer.from(slack_signature, 'utf8') && checkDateValidity(req));
}

function checkDateValidity(req): boolean {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const now = Math.ceil(Date.now() / 1000);
  console.log('now:'+now);
  console.log('nowtimestamp:'+timestamp);
  if (Math.abs(now - timestamp) > 60) {
    return false;
  } else {
    return true;
  }
}
