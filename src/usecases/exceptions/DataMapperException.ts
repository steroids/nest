export class DataMapperException extends Error {
    constructor(message) {
        message = 'DataMapper Exception. ' + message;
        super(message);
    }
}
