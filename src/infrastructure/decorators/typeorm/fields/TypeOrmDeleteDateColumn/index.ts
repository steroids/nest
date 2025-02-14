import {DeleteDateColumn} from '@steroidsjs/typeorm';

export default () => [
    DeleteDateColumn({
        type: 'date',
        nullable: true,
    }),
];
