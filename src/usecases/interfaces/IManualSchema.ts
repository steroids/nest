export default interface IManualSchema<TModel> {
    /**
     * Manually set schema fields based on the passed model
     * @param model
     */
    updateFromModel(model: TModel): any;
}
