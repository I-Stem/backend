/**
 * Define Archived User model
 *
 */

import User from '../models/User';
import mongoose from 'mongoose';

const ArchivedUser = User.discriminator('ArchivedUser', new mongoose.Schema({
    email: {type: String, unique: false}
}));

export default ArchivedUser;
