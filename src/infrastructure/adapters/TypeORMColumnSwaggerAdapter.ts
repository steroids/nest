import {ColumnType} from '@steroidsjs/typeorm/driver/types/ColumnTypes';

const intTypes = new Set([
    'int', 'int2', 'int4', 'int8', 'int64',
    'integer', 'tinyint', 'smallint', 'mediumint', 'bigint',
    'unsigned big int', 'smallmoney', 'money',
    'year', 'rowversion',
]);

const numberTypes = new Set([
    'float', 'float4', 'float8', 'float64',
    'double', 'double precision', 'real',
    'dec', 'decimal', 'smalldecimal', 'fixed', 'numeric', 'number',
    'long', 'rowid', 'urowid',
]);

const stringTypes = new Set([
    'character varying', 'varying character', 'char varying',
    'nvarchar', 'national varchar', 'character', 'native character',
    'varchar', 'char', 'nchar', 'national char',
    'varchar2', 'nvarchar2', 'alphanum', 'shorttext',
    'text', 'ntext', 'citext', 'clob', 'nclob', 'longtext',
    'mediumtext', 'tinytext', 'string',
    'uuid', 'xml', 'json', 'jsonb', 'hstore',
    'date', 'datetime', 'datetime2', 'datetimeoffset',
    'time', 'time with time zone', 'time without time zone', 'timetz',
    'timestamp', 'timestamp without time zone', 'timestamp with time zone',
    'timestamp with local time zone', 'timestamptz',
    'smalldatetime', 'seconddate',
    'interval', 'interval year to month', 'interval day to second',
    'cidr', 'inet', 'inet4', 'inet6', 'macaddr',
    'bit', 'bit varying', 'varbit',
    'tsvector', 'tsquery',
    'int4range', 'int8range', 'numrange', 'tsrange', 'tstzrange', 'daterange',
    'int4multirange', 'int8multirange', 'nummultirange',
    'tsmultirange', 'tstzmultirange', 'datemultirange',
    'enum', 'set',
    'point', 'line', 'lseg', 'box', 'circle', 'path', 'polygon',
    'geography', 'geometry', 'linestring',
    'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection',
    'st_geometry', 'st_point',
    'cube', 'ltree',
    'hierarchyid', 'sql_variant', 'uniqueidentifier',
    'raw', 'long raw', 'bfile', 'urowid',
    'simple-json', 'simple-enum',
]);

const booleanTypes = new Set(['boolean', 'bool']);

const binaryTypes = new Set([
    'binary', 'varbinary',
    'tinyblob', 'blob', 'mediumblob', 'longblob',
    'bytea', 'bytes', 'image', 'raw',
]);

const arrayTypes = new Set(['array', 'simple-array']);

export function mapColumnTypeToSwagger(type?: ColumnType) {
    if (typeof type === 'string') {
        if (intTypes.has(type)) return 'integer';
        if (numberTypes.has(type)) return 'number';
        if (booleanTypes.has(type)) return 'boolean';
        if (arrayTypes.has(type)) return 'array';
        if (binaryTypes.has(type)) return 'string';
        if (stringTypes.has(type)) return 'string';
    }
    return 'string';
}
