import {Type} from '@nestjs/common';
import {toInteger as _toInteger} from 'lodash';
import {DataMapper} from '../helpers/DataMapper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import SearchQuery from '../base/SearchQuery';
import {ContextDto} from '../dtos/ContextDto';
import {getMetaRelations, getRelationsByFilter} from '../../infrastructure/decorators/fields/BaseField';
import {RelationTypeEnum} from '../../domain/enums/RelationTypeEnum';
import {UserException} from "../exceptions";
import {ReadService} from './ReadService';

/**
 * Generic CRUD service
 */
export class CrudService<TModel,
    TSearchDto = ISearchInputDto,
    TSaveDto = TModel> extends ReadService<TModel, TSearchDto>{

    async create(dto: TSaveDto, context?: ContextDto | null): Promise<TModel>
    async create<TSchema>(
        dto: TSaveDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Create new model
     * @param dto
     * @param context
     * @param schemaClass
     */
    async create<TSchema>(
        dto: TSaveDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        return this.save(null, dto, context, schemaClass);
    }

    async update<TSchema>(id: number | string, dto: TSaveDto, context?: ContextDto | null): Promise<TModel>
    async update<TSchema>(
        id: number | string,
        dto: TSaveDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Update model
     * @param rawId
     * @param dto
     * @param context
     * @param schemaClass
     */
    async update<TSchema>(
        rawId: number | string,
        dto: TSaveDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        return this.save(rawId, dto, context, schemaClass);
    }

    async save<TSchema>(id: number | string, dto: TSaveDto, context?: ContextDto | null): Promise<TModel>
    async save<TSchema>(
        id: number | string,
        dto: TSaveDto,
        context?: ContextDto | null,
        schemaClass?: Type<TSchema>,
    ): Promise<Type<TSchema>>

    /**
     * Update model
     * @param rawId
     * @param dto
     * @param context
     * @param schemaClass
     */
    async save<TSchema>(
        rawId: number | string | null,
        dto: TSaveDto,
        context: ContextDto = null,
        schemaClass: Type<TSchema> = null,
    ): Promise<TModel | Type<TSchema>> {
        const id: number = rawId ? _toInteger(rawId) : null;

        // Fetch previous model state
        let prevModel = null;
        if (id) {
            prevModel = await this.findOne(
                (new SearchQuery())
                    .where({[this.primaryKey]: id})
                    .with(getMetaRelations(dto.constructor))
            );
            if (!prevModel) {
                throw new Error('Not found model by id: ' + id);
            }
        }

        // Create next model state
        const ModelClass = this.modelClass;
        const nextModel = new ModelClass();

        // Сперва добавляем данные для новой модели из старой
        if (prevModel) {
            DataMapper.applyValues(nextModel, prevModel);
        }

        // Затем накатываем изменения
        DataMapper.applyValues(nextModel, this.dtoToModel(dto));

        // Принудительно добавляем primary key, т.к. его зачастую нет в dto
        if (id) {
            nextModel[this.primaryKey] = id;
        }

        // Validate dto
        await this.validate(dto, {
            prevModel,
            nextModel,
            context,
        });

        // Save
        await this.saveInternal(prevModel, nextModel, context);

        // Convert to schema, if need
        return schemaClass ? this.findById(nextModel[this.primaryKey], context, schemaClass) : nextModel;
    }

    /**
     * Internal save method for overwrite in project
     * @param prevModel
     * @param nextModel
     * @param context
     */
    async saveInternal(prevModel: TModel | null, nextModel: TModel, context?: ContextDto) {
        // you code outside transaction before save
        await this.repository.save(nextModel, async (save) => {
            // you code inside transaction before save
            await save();
            // you code inside transaction after save
        });
        // you code outside transaction after save

        // or save() call without transaction
        // await this.repository.save(nextModel);
    }

    async checkHasRelatedModels(id: string | number, service: CrudService<any>) {
        const relations = getRelationsByFilter(this.modelClass,
            (relation) => {
                if (relation.type === RelationTypeEnum.OneToOne) {
                    return !relation.isOwningSide
                }
                return RelationTypeEnum.OneToMany === relation.type
            });
        const searchQuery = new SearchQuery();
        searchQuery.with(relations)
        searchQuery.where({id});
        const model = await service.findOne(searchQuery);
        relations.forEach((relation) => {
            if (model?.[relation]?.length > 0) {
                throw new UserException('Нельзя удалить, есть связные элементы')
            }
        });
    }

    /**
     * Remove model
     * @param rawId
     * @param context
     */
    async remove(rawId: number | string, context: ContextDto = null): Promise<void> {
        const id: number = _toInteger(rawId);
        await this.checkHasRelatedModels(id, this);
        await this.removeInternal(id, context);
    }

    /**
     * Internal remove method for overwrite in project
     * @param id
     * @param context
     */
    async removeInternal(id: number, context?: ContextDto) {
        // you code outside transaction before remove
        await this.repository.remove(id, async (remove) => {
            // you code inside transaction before remove
            await remove();
            // you code inside transaction after remove
        });
        // you code outside transaction after remove

        // or remove() call without transaction
        // await this.repository.remove(id);
    }

    /**
     * Mapping dto to model class
     * @param dto
     * @protected
     */
    protected dtoToModel(dto: TSaveDto): TModel {
        if (!this.modelClass) {
            throw new Error('Property modelClass is not set in service: ' + this.constructor.name);
        }
        return DataMapper.create(this.modelClass, dto);
    }
}
