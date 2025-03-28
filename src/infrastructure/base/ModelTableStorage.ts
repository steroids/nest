const modelToTableMap = {};
const modelBuildersMap = {};

export const setModelBuilder = (ModelClass: any, builderHandler: any) => {
    if (builderHandler && modelBuildersMap[ModelClass.name]) {
        throw new Error('Model "' + ModelClass.name + '" already has builder');
    }
    modelBuildersMap[ModelClass.name] = builderHandler;
};

export const getModelBuilder = (ModelClass: any) => modelBuildersMap[ModelClass.name] || null;

export const setTableFromModel = (ModelClass: any, TableClass: any) => {
    modelToTableMap[ModelClass.name] = TableClass;
};

export const getTableFromModel = (ModelClass: any) => modelToTableMap[ModelClass.name] || null;
