import {getMetadataArgsStorage} from '@steroidsjs/typeorm';
import {EventListenerTypes} from '@steroidsjs/typeorm/metadata/types/EventListenerTypes';
import {normalizeDateTime} from '../../fields/DateTimeField';

export const CreateTimeBehaviour = (object, propertyName) => {
    const methodName = propertyName + '__createTimeBehaviour';
    if (!object[methodName]) {
        // eslint-disable-next-line func-names
        object[methodName] = function () {
            this[propertyName] = normalizeDateTime(new Date(), false);
        };
    }

    getMetadataArgsStorage().entityListeners.push({
        target: object.constructor,
        propertyName: methodName,
        type: EventListenerTypes.BEFORE_INSERT,
    });
};
