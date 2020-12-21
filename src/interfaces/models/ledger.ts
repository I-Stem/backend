/**
 * Define interface for Ledger model
 */

export interface ILedger {
    userId: String;
    reason: String;
    credited: Number;
    debited: Number;
}

export default ILedger;
