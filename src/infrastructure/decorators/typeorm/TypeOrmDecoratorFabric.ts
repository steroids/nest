import {Column, DeleteDateColumn, PrimaryGeneratedColumn} from '@steroidsjs/typeorm';
import {
    BooleanField,
    CoordinateField,
    CreateTimeField,
    DateField,
    DateTimeField,
    DecimalField,
    DecimalNumberField,
    DecoratorFieldName,
    DeleteDateField,
    EmailField,
    EnumField,
    FileField,
    HtmlField,
    IAllFieldOptions,
    ImageField,
    IntegerField,
    JSONBField,
    PasswordField,
    PhoneField,
    PrimaryKeyField,
    RelationField,
    RelationIdField, StringField, TextField, TimeField, UidField, UpdateTimeField,
} from '../fields';
import {CreateTimeBehaviour} from './behaviours/CreateTimeBehaviour';
import {getOwningDecorator, getRelationDecorator} from './behaviours/RelationBehaviour';
import {UidBehaviour} from './behaviours/UidBehaviour';
import {UpdateTimeBehaviour} from './behaviours/UpdateTimeBehaviour';
import {getTableFromModel} from '../../base/ModelTableStorage';

const decoratorFabricMap: {[key in DecoratorFieldName]?: (options: IAllFieldOptions) => Array<(target: any, fieldName: string) => void>} = {
    [BooleanField.name]: (options: IAllFieldOptions) => [
        Column({
            type: options.dbType || 'boolean',
            default: options.defaultValue ?? false,
            nullable: options.nullable ?? false,
        }),
    ],
    [CoordinateField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 12,
            scale: options.scale || 9,
        }),
    ],
    [CreateTimeField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'timestamp',
            precision: options.precision || 0,
            default: options.defaultValue,
            nullable: options.nullable ?? false,
        }),
        CreateTimeBehaviour,
    ],
    [DateField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'date',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [DateTimeField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'timestamp',
            precision: options.precision || 0,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [DecimalField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 10,
            scale: options.scale || 2,
        }),
    ],
    [DecimalNumberField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'decimal',
            default: options.defaultValue,
            nullable: options.nullable,
            precision: options.precision || 10,
            scale: options.scale || 2,
        }),
    ],
    [DeleteDateField.name]: () => [
        DeleteDateColumn({
            type: 'date',
            nullable: true,
        }),
    ],
    [EmailField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'varchar',
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
        }),
    ],
    [EnumField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'varchar',
            default: options.defaultValue,
            nullable: options.nullable,
            array: options.isArray,
        }),
    ],
    [FileField.name]: (options: IAllFieldOptions) => [
        Column({
            type: options.multiple ? 'simple-array' : 'integer',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [HtmlField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'text',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [ImageField.name]: (options: IAllFieldOptions) => [
        Column({
            type: options.multiple ? 'simple-array' : 'integer',
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [IntegerField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'integer',
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
        }),
    ],
    [JSONBField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'jsonb',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
            array: options.isArray,
        }),
    ],
    [PasswordField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'text',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [PhoneField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'varchar',
            length: options.max || 16,
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
        }),
    ],
    [PrimaryKeyField.name]: () => [
        PrimaryGeneratedColumn({type: 'integer'}),
    ],
    [RelationField.name]: (options: IAllFieldOptions) => {
        const OwningDecorator = getOwningDecorator(options as any);
        let owningDecoratorOptions;
        if ('tableName' in options) {
            owningDecoratorOptions = {name: options.tableName};
        }
        return [
            getRelationDecorator(options.type)(
                () => getTableFromModel(options.relationClass()),
                (options as any).inverseSide,
                {cascade: ['insert', 'update'],
                    onUpdate: 'CASCADE'},
            ),
            OwningDecorator && OwningDecorator(owningDecoratorOptions),
        ].filter(Boolean);
    },
    [RelationIdField.name]: (options: IAllFieldOptions) => [
        !options.isArray && Column({
            type: 'int',
            nullable: options.nullable,
        }),
    ].filter(Boolean),
    [StringField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'varchar',
            length: options.max,
            default: options.defaultValue,
            unique: options.unique,
            nullable: options.nullable,
            array: options.isArray,
        }),
    ],
    [TextField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'text',
            length: options.max,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [TimeField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'varchar',
            length: 5,
            default: options.defaultValue,
            nullable: options.nullable,
        }),
    ],
    [UidField.name]: (options: IAllFieldOptions) => [
        Column({
            type: options.dbType || 'varchar',
            length: 36,
            default: null,
            update: false,
        }),
        UidBehaviour,
    ],
    [UpdateTimeField.name]: (options: IAllFieldOptions) => [
        Column({
            type: 'timestamp',
            precision: options.precision || 0,
            default: options.defaultValue,
            nullable: options.nullable ?? false,
        }),
        UpdateTimeBehaviour,
    ],
};

export function typeOrmDecoratorFabric(decoratorName: DecoratorFieldName, options: IAllFieldOptions): any[] {
    const fabric = decoratorFabricMap[decoratorName];
    if (!fabric) {
        throw new Error(`Unsupported decorator name: ${decoratorName}`);
    }
    return fabric(options);
}
