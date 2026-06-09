import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Validation middleware factory.
 * Returns structured field-level errors so the frontend can map
 * each message to its input field.
 *
 * Response shape on failure (HTTP 422):
 * {
 *   success: false,
 *   message: "Validation failed",
 *   errors: [
 *     { field: "email",    message: "Please provide a valid email address" },
 *     { field: "password", message: "Password must be at least 8 characters" }
 *   ]
 * }
 */
export const validate = (
  schema: Joi.ObjectSchema,
  target: 'body' | 'query' | 'params' = 'body'
) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly:   false,  // collect ALL errors, not just the first
      stripUnknown: true,   // drop unexpected fields
      convert:      true,    // apply trim/lowercase transforms
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));

      return res.status(422).json({
        success:   false,
        message:   'Validation failed',
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Replace request data with the sanitised/transformed value
    req[target] = value;
    next();
  };
