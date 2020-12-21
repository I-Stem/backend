/**
 * Define interface for File Model
 *
 */

export interface IFile {
    users: String[];
    name: String;
    hash: String;
    inputURL: String;
    outputURL?: String;
    size: Number;
    json: Object;
    waitingQueue?: String[];
    OCRVersion: String;
}

export default IFile;
