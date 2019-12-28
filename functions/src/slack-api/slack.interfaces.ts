export interface ResponseObject {
  response_type?: "in_channel" | "ephemeral";
  "Content-type"?: string,
  replace_original?: "true" | "false";
  delete_original?: "true" | "false";
  text?: string;
  attachments?: Array<Object>;
}

export interface RequestObject {
  body : RequestBody
}

interface RequestBody {
  user_id: string,
  text?: string,
  response_url: string,
  payload?: Payload
}

interface Payload {
  actions: Array<Action>;
  user: string,
  type: string; 
  callback_id: string;
}

interface Action {
  name: string,
  value: string
}


