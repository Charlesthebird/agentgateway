import {
  customizeValidator,
  type CustomValidatorOptionsType,
} from "@rjsf/validator-ajv8";
import Ajv2020 from "ajv/dist/2020";

/**
 * Custom validator with support for JSON Schema draft 2020-12.
 *
 * The default @rjsf/validator-ajv8 uses Ajv with draft-07 support.
 * Since our schemas use draft 2020-12, we need to use Ajv2020.
 */
const customValidatorOptions: CustomValidatorOptionsType = {
  AjvClass: Ajv2020,
  ajvOptionsOverrides: {
    strict: false, // allows some additional flexibility
    allErrors: true, // show all errors
    validateFormats: true, // validate format keywords
    $data: true, // support $data references
  },
};

export const validator = customizeValidator(customValidatorOptions);
