import {EventListenerTypes} from '@steroidsjs/typeorm/metadata/types/EventListenerTypes';
import {getMetadataArgsStorage} from '@steroidsjs/typeorm';
import {normalizeDateTime} from '../../../fields/DateTimeField';

export const TypeOrmUpdateTimeBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__updateTimeBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            this[propertyName] = normalizeDateTime(new Date(), false);
        };
    }

    [EventListenerTypes.BEFORE_INSERT, EventListenerTypes.BEFORE_INSERT].forEach(type => {
        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: methodName,
            type,
        });
    });
};
