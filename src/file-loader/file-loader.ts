import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads a file from the current directory and returns its contents as a string.
 *
 * This utility function reads files bundled with the Lambda deployment package,
 * specifically used for loading Cedar policy and schema files. The file is read
 * synchronously relative to the directory containing this module.
 *
 * @param fileName - The name of the file to load (e.g., 'policies.cedar', 'schema.cedarschema').
 *   The file should be located in the same directory as the compiled JavaScript module.
 *
 * @returns The complete file contents as a UTF-8 encoded string
 *
 * @throws {Error} If the file cannot be found or read. The error message includes
 *   the filename and the underlying error details.
 *
 * @remarks
 * **File Location:**
 * - Files are resolved relative to `__dirname` (the directory of the compiled JS file)
 * - In a Lambda deployment, this typically resolves to the Lambda package root
 * - Files must be bundled with the Lambda using the {@link AuthLambda} CDK construct
 *
 * **Synchronous Reading:**
 * This function uses `fs.readFileSync()` for simplicity since:
 * - Files are read once during Lambda initialization
 * - File sizes are small (Cedar policies and schemas)
 * - Synchronous reading during cold start is acceptable
 *
 * **Error Handling:**
 * Common error scenarios:
 * - File not found (ENOENT): File wasn't bundled with Lambda package
 * - Permission denied (EACCES): Incorrect file permissions
 * - Invalid encoding: File contains non-UTF-8 content
 *
 * @example
 * Load a Cedar policy file:
 * ```typescript
 * import { loadFileAsString } from './file-loader';
 *
 * try {
 *   const policyContent = loadFileAsString('policies.cedar');
 *   console.log('Policy loaded:', policyContent);
 * } catch (error) {
 *   console.error('Failed to load policy file:', error.message);
 * }
 * ```
 *
 * @example
 * Load a Cedar schema file:
 * ```typescript
 * const schemaContent = loadFileAsString('schema.cedarschema');
 * ```
 *
 * @see {@link AuthLambda} for bundling files with Lambda deployments
 * @see {@link AuthorizationService.getService} for the primary consumer of this function
 */
export const loadFileAsString = (fileName: string): string => {
	try {
		const filePath = path.join(__dirname, fileName);
		const data = fs.readFileSync(filePath, 'utf-8');
		return data;
	} catch (error) {
		throw new Error(
			`Error reading file ${fileName}: ${(error as Error).message}`,
		);
	}
};
