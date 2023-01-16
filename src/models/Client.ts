import { model, Schema } from 'mongoose';

export const Client = model('Client', new Schema({
    restaurant: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    greetingMessage: {
      type: String,
      required: true,
    },
    confirmMessage: {
      type: String,
      required: true,
    },
}))
;