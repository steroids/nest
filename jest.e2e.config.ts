import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    modulePathIgnorePatterns: [
        'dist',
        // ignore usecases tests - it's for unit tests
        'usecases',
    ],
};
export default config;
