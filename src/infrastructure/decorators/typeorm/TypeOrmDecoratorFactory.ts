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
    FileField, GeometryField,
    HtmlField,
    IAllFieldOptions,
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
} from '../fields';
import typeOrmBooleanField from './fields/TypeOrmBooleanField';
import typeOrmCoordinateField from './fields/TypeOrmCoordinateField';
import typeOrmCreateTimeField from './fields/TypeOrmCreateTimeField';
import typeOrmDateField from './fields/TypeOrmDateField';
import typeOrmDateTimeField from './fields/TypeOrmDateTimeField';
import typeOrmDecimalField from './fields/TypeOrmDecimalField';
import typeOrmDecimalNumberField from './fields/TypeOrmDecimalNumberField';
import typeOrmDeleteDateColumn from './fields/TypeOrmDeleteDateColumn';
import typeOrmEmailField from './fields/TypeOrmEmailField';
import typeOrmEnumField from './fields/TypeOrmEnumField';
import typeOrmFileField from './fields/TypeOrmFileField';
import typeOrmHtmlField from './fields/TypeOrmHtmlField';
import typeOrmImageField from './fields/TypeOrmImageField';
import typeOrmIntegerField from './fields/TypeOrmIntegerField';
import typeOrmJSONBField from './fields/TypeOrmJSONBField';
import typeOrmPasswordField from './fields/TypeOrmPasswordField';
import typeOrmPhoneField from './fields/TypeOrmPhoneField';
import typeOrmPrimaryKeyField from './fields/TypeOrmPrimaryKeyField';
import typeOrmRelationField from './fields/TypeOrmRelationField';
import typeOrmRelationIdField from './fields/TypeOrmRelationIdField';
import typeOrmStringField from './fields/TypeOrmStringField';
import typeOrmTextField from './fields/TypeOrmTextField';
import typeOrmTimeField from './fields/TypeOrmTimeField';
import typeOrmUidField from './fields/TypeOrmUidField';
import typeOrmUpdateTimeField from './fields/TypeOrmUpdateTimeField';
import typeOrmGeometryField from './fields/TypeOrmGeometryField';

const fieldTypeOrmMap: {[key in DecoratorFieldName]?: (options: IAllFieldOptions) => Array<(target: any, fieldName: string) => void>} = {
    [BooleanField.name]: typeOrmBooleanField,
    [CoordinateField.name]: typeOrmCoordinateField,
    [CreateTimeField.name]: typeOrmCreateTimeField,
    [DateField.name]: typeOrmDateField,
    [DateTimeField.name]: typeOrmDateTimeField,
    [DecimalField.name]: typeOrmDecimalField,
    [DecimalNumberField.name]: typeOrmDecimalNumberField,
    [DeleteDateField.name]: typeOrmDeleteDateColumn,
    [EmailField.name]: typeOrmEmailField,
    [EnumField.name]: typeOrmEnumField,
    [FileField.name]: typeOrmFileField,
    [HtmlField.name]: typeOrmHtmlField,
    [ImageField.name]: typeOrmImageField,
    [IntegerField.name]: typeOrmIntegerField,
    [JSONBField.name]: typeOrmJSONBField,
    [PasswordField.name]: typeOrmPasswordField,
    [PhoneField.name]: typeOrmPhoneField,
    [PrimaryKeyField.name]: typeOrmPrimaryKeyField,
    [RelationField.name]: typeOrmRelationField,
    [RelationIdField.name]: typeOrmRelationIdField,
    [StringField.name]: typeOrmStringField,
    [TextField.name]: typeOrmTextField,
    [TimeField.name]: typeOrmTimeField,
    [UidField.name]: typeOrmUidField,
    [UpdateTimeField.name]: typeOrmUpdateTimeField,
    [GeometryField.name]: typeOrmGeometryField,
};

export function typeOrmDecoratorFactory(decoratorName: DecoratorFieldName, options: IAllFieldOptions):
    Array<(target: any, fieldName: string) => void> {
    const fieldDecorator = fieldTypeOrmMap[decoratorName];
    if (!fieldDecorator) {
        throw new Error(`Unsupported decorator name: ${decoratorName}`);
    }
    return fieldDecorator(options);
}
