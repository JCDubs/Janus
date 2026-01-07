import * as njsLambda from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

/**
 * Configuration properties for the AuthLambda construct.
 *
 * @extends NodejsFunctionProps
 *
 * @example
 * ```typescript
 * const lambdaProps: AuthLambdaProps = {
 *   entry: './src/my-handler.ts',
 *   handler: 'handler',
 *   authorisation: {
 *     policyFilePath: './policies/policies.cedar',
 *     schemaFilePath: './policies/schema.cedarschema'
 *   }
 * };
 * ```
 */
export interface AuthLambdaProps extends njsLambda.NodejsFunctionProps {
	/**
	 * Authorization configuration containing Cedar policy and schema file paths.
	 */
	authorisation: {
		/**
		 * Path to the Cedar policy file (.cedar) containing authorization rules.
		 * This file will be bundled with the Lambda deployment package.
		 */
		policyFilePath: string;

		/**
		 * Path to the Cedar schema file (.cedarschema) defining the authorization schema.
		 * This file will be bundled with the Lambda deployment package.
		 */
		schemaFilePath: string;
	};
}

/**
 * AWS CDK construct for creating a Lambda function with Cedar authorization support.
 *
 * This construct extends the standard NodejsFunction to automatically bundle the Cedar WASM module
 * and authorization policy/schema files into the Lambda deployment package. It configures the
 * Lambda function with appropriate bundling hooks to ensure all required dependencies are included.
 *
 * @extends NodejsFunction
 *
 * @remarks
 * The construct performs the following during bundling:
 * - Copies the `@cedar-policy/cedar-wasm` module to the Lambda package
 * - Bundles the specified Cedar policy file as `policies.cedar`
 * - Bundles the specified Cedar schema file as `schema.cedarschema`
 * - Excludes `@aws-sdk*` and `@cedar-policy/cedar-wasm` from the bundle as external modules
 *
 * @example
 * ```typescript
 * import { AuthLambda } from './auth-lambda';
 * import * as cdk from 'aws-cdk-lib';
 *
 * const app = new cdk.App();
 * const stack = new cdk.Stack(app, 'MyStack');
 *
 * const authLambda = new AuthLambda(stack, 'MyAuthLambda', {
 *   entry: './src/handlers/authorizer.ts',
 *   handler: 'handler',
 *   runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
 *   authorisation: {
 *     policyFilePath: './policies/policies.cedar',
 *     schemaFilePath: './policies/schema.cedarschema'
 *   }
 * });
 * ```
 */
export class AuthLambda extends njsLambda.NodejsFunction {
	/**
	 * Creates a new AuthLambda construct.
	 *
	 * @param scope - The scope in which to define this construct (usually `this` or a Stack)
	 * @param id - The scoped construct ID. Must be unique within the scope
	 * @param props - Configuration properties including authorization file paths
	 *
	 * @throws {Error} If the policy or schema files cannot be found at the specified paths
	 */
	constructor(scope: Construct, id: string, props: AuthLambdaProps) {
		super(scope, id, {
			...props,
			bundling: {
				...props.bundling,
				commandHooks: {
					beforeBundling(_inputDir: string, _outputDir: string): string[] {
						return [`echo "Preparing to bundle Lambda with dist directory..."`];
					},
					beforeInstall(_inputDir: string, _outputDir: string): string[] {
						return [];
					},
					afterBundling(inputDir: string, outputDir: string): string[] {
						return [
							`echo "Copying node_modules/@cedar-policy/cedar-wasm directory to Lambda package..."`,
							`mkdir -p ${outputDir}/node_modules/@cedar-policy/cedar-wasm/`,
							`cp -r ${inputDir}/node_modules/janus/vendor/@cedar-policy/cedar-wasm ${outputDir}/node_modules/@cedar-policy/`,
							`echo "node_modules/@cedar-policy/cedar-wasm directory copied successfully to ${outputDir}/node_modules/@cedar-policy"`,
							`echo "Copying policy and schema files to Lambda package..."`,
							`cp ${props.authorisation.policyFilePath} ${outputDir}/policies.cedar`,
							`cp ${props.authorisation.schemaFilePath} ${outputDir}/schema.cedarschema`,
							`echo "Policy and schema files copied successfully to ${outputDir}"`,
						];
					},
				},
				externalModules: [
					...(props.bundling?.externalModules || []),
					"@aws-sdk*",
					"@cedar-policy/cedar-wasm",
				],
			},
		});
	}
}
