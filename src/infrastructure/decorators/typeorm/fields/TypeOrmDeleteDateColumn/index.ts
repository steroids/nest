import {DeleteDateColumn} from 'typeorm';

export default () => [
    DeleteDateColumn({
        type: 'date',
        nullable: true,
    }),
];
