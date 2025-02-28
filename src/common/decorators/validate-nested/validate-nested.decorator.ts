import { plainToClass } from 'class-transformer';
import {
    registerDecorator,
    validateSync,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

/**
 * @decorator
 * @description A custom decorator to validate a validation-schema within a validation schema upload N levels
 * @param schema The validation Class
 */
export function ValidateNested(
    schema: new () => any,
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'ValidateNested',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    args.value;
                    console.log(validateSync(plainToClass(schema, value)));
                    if (Array.isArray(value)) {
                        for (let i = 0; i < (<Array<any>>value).length; i++) {
                            if (validateSync(plainToClass(schema, value[i])).length) {
                                return false;
                            }
                        }
                        return true;
                    } else
                        return validateSync(plainToClass(schema, value), { whitelist: true }).length
                            ? false
                            : true;
                },
                defaultMessage(args: ValidationArguments): string {
                    if (!args) {
                        return 'Validation failed';
                    }

                    if (Array.isArray(args.value)) {
                        const errors: string[] = [];
                        for (let i = 0; i < (<Array<any>>args.value).length; i++) {
                            const validationErrors = validateSync(plainToClass(schema, args.value[i]))
                                .map(e => e.constraints || {})
                                .reduce((acc: string[], next) => acc.concat(Object.values(next)), []);

                            if (validationErrors.length) {
                                errors.push(`${args.property}::index${i} -> ${validationErrors.join(', ')}`);
                            }
                        }
                        return errors.join('\n');
                    } else {
                        const validationErrors = validateSync(plainToClass(schema, args.value))
                            .map(e => e.constraints || {})
                            .reduce((acc: string[], next) => acc.concat(Object.values(next)), []);

                        return `${args.property}: ${validationErrors.join(', ')}`;
                    }
                },
            },
        });
    };
}