import {IComputableFieldOptions, ComputableField} from './ComputableField';
import {ICreateTimeFieldOptions, CreateTimeField} from './CreateTimeField';
import {IDateFieldOptions, DateField} from './DateField';
import {IDateTimeFieldColumnOptions, DateTimeField} from './DateTimeField';
import {IDecimalFieldOptions, DecimalField} from './DecimalField';
import {IEmailFieldOptions, EmailField} from './EmailField';
import {IEnumFieldOptions, EnumField} from './EnumField';
import {IExtendFieldOptions, ExtendField} from './ExtendField';
import {IFileField, FileField} from './FileField';
import {IIntegerFieldOptions, IntegerField} from './IntegerField';
import {IJSONBFieldOptions, JSONBField} from './JSONBField';
import {IPhoneFieldOptions, PhoneField} from './PhoneField';
import {IRelationFieldOptions, RelationField} from './RelationField';
import {IRelationIdFieldOptions, RelationIdField} from './RelationIdField';
import {IStringFieldOptions, StringField} from './StringField';
import {IUpdateTimeFieldOptions, UpdateTimeField} from './UpdateTimeField';
import {BooleanField} from './BooleanField';
import {CoordinateField} from './CoordinateField';
import {DecimalNumberField} from './DecimalNumberField';
import {DeleteDateField} from './DeleteDateField';
import {HtmlField} from './HtmlField';
import {ImageField} from './ImageField';
import {PasswordField} from './PasswordField';
import {PrimaryKeyField} from './PrimaryKeyField';
import {TextField} from './TextField';
import {TimeField} from './TimeField';
import {UidField} from './UidField';
import {GeometryField, IGeometryFieldOptions} from './GeometryField';

export {BooleanField} from './BooleanField';
export {ComputableField} from './ComputableField';
export {CoordinateField} from './CoordinateField';
export {CreateTimeField} from './CreateTimeField';
export {DateField} from './DateField';
export {DateTimeField} from './DateTimeField';
export {DecimalField} from './DecimalField';
export {DecimalNumberField} from './DecimalNumberField';
export {DeleteDateField} from './DeleteDateField';
export {EmailField} from './EmailField';
export {EnumField} from './EnumField';
export {ExtendField} from './ExtendField';
export {FileField} from './FileField';
export {HtmlField} from './HtmlField';
export {ImageField} from './ImageField';
export {IntegerField} from './IntegerField';
export {JSONBField} from './JSONBField';
export {PasswordField} from './PasswordField';
export {PhoneField} from './PhoneField';
export {PrimaryKeyField} from './PrimaryKeyField';
export {RelationField} from './RelationField';
export {RelationIdField} from './RelationIdField';
export {StringField} from './StringField';
export {TextField} from './TextField';
export {TimeField} from './TimeField';
export {UidField} from './UidField';
export {UpdateTimeField} from './UpdateTimeField';
export {GeometryField} from './GeometryField';

export type IAllFieldOptions = ICreateTimeFieldOptions & IDateTimeFieldColumnOptions & IDecimalFieldOptions
    & IEnumFieldOptions & IExtendFieldOptions & IFileField & IRelationFieldOptions & IRelationIdFieldOptions
    & IUpdateTimeFieldOptions & IEmailFieldOptions & IPhoneFieldOptions & IStringFieldOptions & IIntegerFieldOptions
    & IDateFieldOptions & IComputableFieldOptions & IJSONBFieldOptions & IGeometryFieldOptions;

const DecoratorField = {
    BooleanField,
    ComputableField,
    CoordinateField,
    CreateTimeField,
    DateField,
    DateTimeField,
    DecimalField,
    DecimalNumberField,
    DeleteDateField,
    EmailField,
    EnumField,
    ExtendField,
    FileField,
    HtmlField,
    ImageField,
    IntegerField,
    JSONBField,
    PasswordField,
    PhoneField,
    PrimaryKeyField,
    RelationField,
    RelationIdField,
    StringField,
    TextField,
    TimeField,
    UidField,
    UpdateTimeField,
    GeometryField,
} as const;

export type DecoratorFieldName = keyof typeof DecoratorField;
