import { model, Schema } from 'mongoose';

export const Client = model('Client', new Schema({
    _id: {
      type: String,
      required: true,
    },
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