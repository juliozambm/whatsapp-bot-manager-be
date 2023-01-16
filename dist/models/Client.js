"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const mongoose_1 = require("mongoose");
exports.Client = (0, mongoose_1.model)('Client', new mongoose_1.Schema({
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
}));
