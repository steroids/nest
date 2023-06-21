import {BeforeApplicationShutdown} from "@nestjs/common";

export class GracefulService implements BeforeApplicationShutdown {
    public isShutdown = false;

    async beforeApplicationShutdown(signal?: string) {
        this.isShutdown = true;

        if (process.env.K8S_READINESS_FAILURE_THRESHOLD && process.env.K8S_READINESS_PERIOD_SECONDS) {
            const failureThreshold = parseInt(process.env.K8S_READINESS_FAILURE_THRESHOLD, 10);
            const periodSeconds = parseInt(process.env.K8S_READINESS_PERIOD_SECONDS, 10);

            await new Promise((resolve) => {
                setTimeout(resolve, failureThreshold * periodSeconds * 1000);
            });
        }
    }
}
