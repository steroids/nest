import {getMetadataArgsStorage} from 'typeorm';
import {EventListenerTypes} from 'typeorm/metadata/types/EventListenerTypes';
import {normalizeDateTime} from '../../../fields/DateTimeField';

export const TypeOrmUpdateTimeBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__updateTimeBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            this[propertyName] = normalizeDateTime(new Date(), false);
        };
    }

    [EventListenerTypes.BEFORE_INSERT, EventListenerTypes.BEFORE_UPDATE].forEach(type => {
        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: methodName,
            type,
        });
    });
};
