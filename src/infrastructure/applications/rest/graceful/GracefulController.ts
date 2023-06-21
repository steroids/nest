import {Controller, Get, InternalServerErrorException} from "@nestjs/common";
import {GracefulService} from "./GracefulService";

@Controller()
export class GracefulController {
    constructor(
        public service: GracefulService
    ) { }

    @Get('health')
    checkHealth() {
        if (this.service.isShutdown) {
            throw new InternalServerErrorException('Application is currently shutting down.');
        }

        return 'ok';
    }
}
