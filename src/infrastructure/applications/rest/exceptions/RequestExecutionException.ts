import {HttpStatus} from '@nestjs/common';

/**
 * Defines custom exception, when server action fails during execution.
 * By default, exception set status code as 'Internal Server Error'.
 *
 * @example Request to remove entity with exist relations will fail.
 */
export class RequestExecutionException {
    public message;

    public status = HttpStatus.INTERNAL_SERVER_ERROR;

    constructor(message: string) {
        this.message = message;
    }

    public getStatus(): number {
        return this.status;
    }

    public getMessage(): string {
        return this.message;
    }
}
