import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    roots: ['<rootDir>/src'],
    testPathIgnorePatterns: ['<rootDir>/src/infrastructure/tests'],
};
export default config;
