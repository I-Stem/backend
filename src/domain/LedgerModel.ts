import loggerFactory from '../middlewares/WinstonLogger';
import UserModel from './User';
import Ledger from '../models/Ledger';

class LedgerModel extends Ledger {
static serviceName = 'LedgerModel';

    public static async createDebitTransaction(userId: string, amount: number, reason: string) {
        const methodName = 'createDebitTransaction';
        const logger = loggerFactory(LedgerModel.serviceName, methodName);
        logger.info('debit transaction for user: ' + userId);
        const transactionData = {
            userId: userId,
            reason: reason,
            debited: amount,
            credited: 0
        };
        new Ledger(transactionData).save((err: Error) => {
            if (err) {
                logger.error(err.message);
            } else {
                logger.info(`${amount} deducted from account for user ` + userId);
            }
        });

    }

    public static async createCreditTransaction(userId: string, amount: number, reason: string) {
        const methodName = 'createCreditTransaction';
        const logger = loggerFactory(LedgerModel.serviceName, methodName);
        logger.info('credit transaction for user: ' + userId);
        const transactionData = {
            userId: userId,
            reason: reason,
            debited: 0,
            credited: amount
        };
        new Ledger(transactionData).save((err: Error) => {
            if (err) {
                logger.error(err.message);
            } else {
                logger.info(`${amount} credited to account for user ` + userId);
            }
        });
    }
}

export default LedgerModel;
