import {toInteger as _toInteger} from 'lodash';
import {DeepPartial} from '@steroidsjs/typeorm';
import {DataMapper} from '../helpers/DataMapper';
import {ISearchInputDto} from '../dtos/SearchInputDto';
import SearchQuery from '../base/SearchQuery';
import {ContextDto} from '../dtos/ContextDto';
import {getMetaRelations, getRelationsByFilter} from '../../infrastructure/decorators/fields/BaseField';
import {RelationTypeEnum} from '../../domain/enums/RelationTypeEnum';
import {UserException} from '../exceptions';
import {ReadService} from './ReadService';
import {IType} from '../interfaces/IType';

/**
 * Generic CRUD service
 */
export class CrudService<
    TModel,
    TSearchDto = ISearchInputDto,
    /** @deprecated */
    TSaveDto = TModel
> extends ReadService<TModel, TSearchDto> {

    async create(dto: DeepPartial<TModel>, context?: ContextDto | null): Promise<TModel>
    async create<TSchema>(
        dto: DeepPartial<TModel>,
        context?: ContextDto | null,
        schemaClass?: IType<TSchema>,
    ): Promise<TSchema>

    /**
     * Create new model
     * @param dto
     * @param context
     * @param schemaClass
     */
    async create<TSchema>(
        dto: DeepPartial<TModel>,
        context: ContextDto = null,
        schemaClass: IType<TSchema> = null,
    ): Promise<TModel | TSchema> {
        return this.save(null, dto, context, schemaClass);
    }

    async update<TSchema>(id: number | string, dto: DeepPartial<TModel>, context?: ContextDto | null): Promise<TModel>
    async update<TSchema>(
        id: number | string,
        dto: DeepPartial<TModel>,
        context?: ContextDto | null,
        schemaClass?: IType<TSchema>,
    ): Promise<TSchema>

    /**
     * Update model
     * @param rawId
     * @param dto
     * @param context
     * @param schemaClass
     */
    async update<TSchema>(
        rawId: number | string,
        dto: DeepPartial<TModel>,
        context: ContextDto = null,
        schemaClass: IType<TSchema> = null,
    ): Promise<TModel | TSchema> {
        return this.save(rawId, dto, context, schemaClass);
    }

    async save<TSchema>(id: number | string, dto: DeepPartial<TModel>, context?: ContextDto | null): Promise<TModel>
    async save<TSchema>(
        id: number | string,
        dto: DeepPartial<TModel>,
        context?: ContextDto | null,
        schemaClass?: IType<TSchema>,
    ): Promise<TSchema>

    /**
     * Update model
     * @param rawId
     * @param dto
     * @param context
     * @param schemaClass
     * @throws Error if dto is instance of model class
     * @throws Error if rawId passed and prevModel not found
     */
    async save<TSchema>(
        rawId: number | string | null,
        dto: DeepPartial<TModel>,
        context: ContextDto = null,
        schemaClass: IType<TSchema> = null,
    ): Promise<TModel | TSchema> {
        if (this.isModel(dto)) {
            throw new Error('The model itself shouldn\'t be used as a DTO');
        }

        const id: number = rawId ? _toInteger(rawId) : null;

        // Fetch previous model state
        let prevModel = null;
        if (id) {
            prevModel = await this.createQuery()
                .with(getMetaRelations(dto.constructor))
                .where({[this.primaryKey]: id})
                .one();
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

        // Модель с измененными полями
        const diffModel = this.dtoToModel(dto);

        // Принудительно добавляем primary key, т.к. его зачастую нет в dto
        if (id) {
            diffModel[this.primaryKey] = id;
        }

        // Затем накатываем изменения
        DataMapper.applyValues(nextModel, diffModel);

        // Validate dto
        await this.validate(dto, {
            prevModel,
            nextModel,
            context,
        });

        // Validate by ModelClass
        await this.validate(nextModel, {
            prevModel,
            nextModel,
            context,
        });

        // Save
        await this.saveInternal(prevModel, nextModel, diffModel, context);

        // Convert to schema, if need
        return schemaClass
            ? this.findById(nextModel[this.primaryKey], context, schemaClass)
            : nextModel;
    }

    /**
     * Internal save method for overwrite in project
     * @param prevModel
     * @param nextModel
     * @param diffModel
     * @param context
     */
    async saveInternal(prevModel: TModel | null, nextModel: TModel, diffModel: TModel, context?: ContextDto) {
        // you code outside transaction before save
        // await this.repository.save(diffModel, async (save) => {
            // you code inside transaction before save
            // await save();
            // you code inside transaction after save
        // });
        // you code outside transaction after save

        // or save() call without transaction
        await this.repository.save(diffModel);
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
                throw new UserException('Нельзя удалить, есть связные элементы (' + relation + ')')
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
     * Soft remove model
     * @param rawId
     * @param context
     */
    async softRemove(rawId: number | string, context: ContextDto = null): Promise<void> {
        const id: number = _toInteger(rawId);
        await this.softRemoveInternal(id, context);
    }

    /**
     * Internal soft remove method for overwrite in project
     * @param id
     * @param context
     */
    async softRemoveInternal(id: number, context?: ContextDto) {
        // you code outside transaction before soft remove
        await this.repository.softRemove(id, async (softRemove: () => Promise<void>) => {
            // you code inside transaction before soft remove
            await softRemove();
            // you code inside transaction after soft remove
        });
        // you code outside transaction after soft remove

        // or softRemove() call without transaction
        // await this.repository.softRemove(id);
    }

    /**
     * Mapping dto to model class
     * @param dto
     * @protected
     * @throws Error if modelClass is not set
     */
    protected dtoToModel(dto: DeepPartial<TModel>): TModel {
        if (!this.modelClass) {
            throw new Error('Property modelClass is not set in service: ' + this.constructor.name);
        }
        return DataMapper.create(this.modelClass, dto);
    }
}
