/**
 * Define interface for Template Model
 *
 */

export interface ITemplate {
    name: String;
    body: String;
    subject: String;
    type: Number;
    link: String;
    text: String;
    isEmail: Boolean;
    isDashboard: Boolean;
}

export default ITemplate;
