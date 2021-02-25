/**
 * Define Message model
 *
 */

import {MessageModel} from '../domain/MessageModel';
import { MessageStatus } from '../domain/MessageModel/MessageConstants';
import { IMessage } from '../interfaces/models/message';
import mongoose from '../providers/Database';

// Create the model schema & register your custom methods here
export interface IMessageModel extends IMessage, mongoose.Document {}

// Define the Message Schema
export const MessageSchema = new mongoose.Schema(
    {
        triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        body: String,
        subject: String,
        text: String,
        link: String,
        label: String,
        status: {
            type: String,
            enum: [MessageStatus.INITIATED, MessageStatus.SENT, MessageStatus.READ]
        },
        statusLog: [{ status: String, actionAt: Date }],
        templateId: { type: String}
    },
    {
        id: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
        timestamps: true,
        strict: false
    }
);

const Message = mongoose.model<MessageModel & mongoose.Document>('Message', MessageSchema);

export default Message;
