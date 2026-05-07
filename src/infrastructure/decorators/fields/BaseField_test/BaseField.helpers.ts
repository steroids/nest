import {validate} from 'class-validator';

export const buildDto = (decorator: PropertyDecorator) => {
    class Dto {
        value: any;
    }

    decorator(Dto.prototype, 'value');
    return Dto;
};

export const validateValue = async (Dto: any, value: any) => {
    const dto = new Dto();
    dto.value = value;
    return validate(dto);
};
