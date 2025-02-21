import {getMetadataArgsStorage} from '@steroidsjs/typeorm';
import {EventListenerTypes} from '@steroidsjs/typeorm/metadata/types/EventListenerTypes';
import {v4 as uuidv4} from 'uuid';

export const generateUid = (): string => uuidv4();

export const TypeOrmUidBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__uidBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            if (!this[propertyName]) {
                this[propertyName] = generateUid();
            }
        };
    }

    getMetadataArgsStorage().entityListeners.push({
        target: object.constructor,
        propertyName: methodName,
        type: EventListenerTypes.BEFORE_INSERT,
    });
};
