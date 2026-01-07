/**
 * Error thrown when the Cedar schema file cannot be loaded.
 *
 * This error is thrown by AuthorizationService.getService() when the Cedar schema
 * file (`schema.cedarschema`) cannot be found or read from the Lambda deployment package.
 *
 * @remarks
 * **Common Causes:**
 * - Schema file not bundled with the Lambda deployment
 * - Incorrect file path or naming
 * - File permissions issue
 * - Missing AuthLambda CDK construct configuration
 *
 * **Prevention:**
 * - Use the {@link AuthLambda} CDK construct to automatically bundle schema files
 * - Ensure `schemaFilePath` in AuthLambda props points to a valid Cedar schema file
 * - Verify the schema file is included in the Lambda package
 *
 * @example
 * ```typescript
 * // In CDK stack:
 * const authLambda = new AuthLambda(stack, 'MyAuthLambda', {
 *   entry: './src/handler.ts',
 *   authorisation: {
 *     policyFilePath: './policies/policies.cedar',
 *     schemaFilePath: './policies/schema.cedarschema'  // Ensure this file exists
 *   }
 * });
 * ```
 *
 * @see {@link AuthorizationService.getService} for where this error is thrown
 * @see {@link AuthLambda} for proper schema file bundling
 */
export class MissingAuthorizationSchemaError extends Error {
	/**
	 * Creates a new MissingAuthorizationSchemaError.
	 *
	 * @remarks
	 * Sets the error name to 'MissingAuthorizationSchemaError' for easy identification
	 * in error handling and logging.
	 */
	constructor() {
		super("Missing authorization schema details");
		this.name = "MissingAuthorizationSchemaError";
	}
}
