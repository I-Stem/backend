import User, {IUserModel, UserRoleEnum, UserStatusEnum} from '../models/User';
import {IUser, Tokens} from '../interfaces/models/user';
import loggerFactory from '../middlewares/WinstonLogger';
import LedgerModel from './LedgerModel';
import {plainToClass} from 'class-transformer';
import { doesListContainElement } from '../utils/library';

export interface UserModelProps {
    userId?: string;
    fullname: string;
    _id?: string;
    email: string;
    accessRequestSent?: boolean;
    role?: string;
    tags?: string[];
}

class UserModel {
    static servicename = 'UserDomainModel';

    fullname = '';
    userId = '';
    email = '';
    password = '';
    isVerified = false;
    verifyUserToken = '';
    tokens: Tokens[] = [];
    role = '';
    accessRequestSent = false;
    tags?: string[];
    verifyUserExpires: Date = new Date();
    passwordResetExpires: Date = new Date();

    constructor(props: UserModelProps) {
        this.userId = props?.userId || props?._id || '';
        this.fullname = props?.fullname;
        this.email = props?.email;
        this.accessRequestSent = props?.accessRequestSent || false;
        this.role = props?.role || UserRoleEnum.REGULAR;
        this.tags = props?.tags;
    }

    public addUserTagIfDoesNotExist(tagName: string | undefined) {
const logger = loggerFactory(UserModel.servicename, 'addUserTag');

if (tagName === undefined || tagName === '') {
return;
}
try {
logger.info("adding tag: " + tagName + "to tags: %o", this.tags);
    if ( !doesListContainElement(this.tags, tagName)) {
    User.findByIdAndUpdate(this.userId, {$push: {
        tags: tagName
    }
    }).exec();
    }
} catch (error) {
    logger.error('error encountered while updating tag: %o', error);
}
    }

    public static async getUserById(userId: string) {
        const logger = loggerFactory(UserModel.servicename, 'getUserById');
        const user = await User.findById(userId).lean();
        if (user !== null) {
return new UserModel(user);
        } else {
        logger.error('couldn\'t get user by id: ' + userId);
        }

        return null;
    }

    public static async getUserByEmail(email: string): Promise<UserModel|null> {
        let methodname = 'getUserByEmail';
        let logger = loggerFactory(UserModel.servicename, methodname);

        let user: UserModel|null = null;
        try {
            let userInstance = await User.findOne({email: email}).lean();
            if (userInstance === null) {
        throw Error('couldn\'t find user in database for email id: ' + email);
        }
        user = new UserModel(userInstance);
        } catch (err) {
logger.error(err);
        }

        return user;
            }

            public deductCredits(amount: number, reason: string): void {
                    const methodname = 'deductCredits';
                    const logger = loggerFactory(UserModel.servicename, methodname);
                    LedgerModel.createDebitTransaction(this.userId, amount, reason);
            }

        public static async updateAccessRequestStatus(email: string, status: boolean): Promise<any> {
            const logger = loggerFactory(UserModel.servicename, 'updateAccessRequestStatus');
            let user: any = null;
            try {
                user = await  User.findOneAndUpdate(
                    { email },
                    { accessRequestSent: status },
                    { new: true }
                ).lean();
                if (user == null) {
                    throw Error('Error updating the status of access request for user: ' + email);
                }
        } catch (err) {
            logger.error('Error occured', err);
        }
            return user?.accessRequestSent;
        }

        public async changeUserRole(role: UserRoleEnum ): Promise<any> {
            const logger = loggerFactory(UserModel.servicename, 'changeUserRole');

            this.role = role;
            try {
                await User.findOneAndUpdate({ 
                    email: this.email 
                }, 
                { role }, 
                { new: true })
                .lean();
            } catch (err) {
                logger.error('Error occured', err);
            }
            return role;
        }

        public static async  updateUserStatusLog(email: string, status: UserStatusEnum) {
            const logger = loggerFactory(UserModel.servicename, 'updateUserStatusLog');
            logger.info(`Updating user status log`);
            const user = await User.findOneAndUpdate({ email }, {$push: {statusLog: {actionAt: new Date(), status}}});
            if (user !== null ) {
                logger.info(`User Status set successfully! `);
            } else {
                throw new Error(`Error updating the status log for user: `);
            }
        }
}

export default UserModel;
