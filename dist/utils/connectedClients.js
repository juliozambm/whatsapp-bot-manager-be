"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConnectedClients = exports.connectedClients = void 0;
exports.connectedClients = [];
const updateConnectedClients = (updatedData) => {
    exports.connectedClients = updatedData;
};
exports.updateConnectedClients = updateConnectedClients;
