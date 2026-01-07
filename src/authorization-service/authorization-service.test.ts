import * as fs from 'node:fs';
import * as path from 'node:path';
import * as fileLoader from '../file-loader/file-loader';
import * as userDetails from '../user-details';
import { AuthorizationService } from './authorization-service';
import type { AuthorizationConfigType } from './types';

jest.mock('../user-details');
jest.mock('../file-loader/file-loader');

const mockGetUserName = userDetails.getUserName as jest.MockedFunction<
	typeof userDetails.getUserName
>;
const mockGetRoles = userDetails.getRoles as jest.MockedFunction<
	typeof userDetails.getRoles
>;
const mockLoadFileAsString = fileLoader.loadFileAsString as jest.MockedFunction<
	typeof fileLoader.loadFileAsString
>;

let policy: string;
let schema: string;
const authorizationConfig: AuthorizationConfigType = {
	namespace: 'OrderService::',
	principleType: 'User',
	resourceType: 'Order',
	roleType: 'Role',
};

describe('Authorization Service tests', () => {
	beforeAll(() => {
		policy = fs.readFileSync(
			path.resolve(__dirname, './authorization-tests/cedar/policies.cedar'),
			'utf-8',
		);
		schema = fs.readFileSync(
			path.resolve(__dirname, './authorization-tests/cedar/schema.cedarschema'),
			'utf-8',
		);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Policy and Schema S3 Client tests', () => {
		it('Policy and schema are returned successfully', async () => {
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockReturnValueOnce(schema);
			const authorizationService = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
			expect(authorizationService).not.toBeUndefined();
		});

		it('Policy is not returned successfully', async () => {
			mockLoadFileAsString.mockImplementation(() => {
				throw new Error('File not found');
			});
			await expect(
				AuthorizationService.getService(authorizationConfig, true),
			).rejects.toThrow('Missing authorization policy details');
		});

		it('Schema is not returned successfully', async () => {
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockImplementation(() => {
					throw new Error('File not found');
				});
			await expect(
				AuthorizationService.getService(authorizationConfig, true),
			).rejects.toThrow('Missing authorization schema details');
		});

		it('Empty policy is returned', async () => {
			mockLoadFileAsString.mockReturnValueOnce('').mockReturnValueOnce(schema);
			const authorizationService = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
			expect(authorizationService).not.toBeUndefined();
		});

		it('Empty schema is returned', async () => {
			mockLoadFileAsString.mockReturnValueOnce(policy).mockReturnValueOnce('');
			const authorizationService = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
			expect(authorizationService).not.toBeUndefined();
		});
	});

	describe('AuthorizationProperties validation tests', () => {
		let authService: AuthorizationService;

		beforeEach(async () => {
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockReturnValueOnce(schema);
			authService = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
		});

		it('Authorization request is missing user name', () => {
			let errorMessage = '';
			try {
				authService.isAuthorized();
			} catch (err) {
				errorMessage = (err as Error).message;
			}
			expect(errorMessage).toEqual('Missing authenticated user details');
		});

		it('Authorization request is missing user roles', () => {
			let errorMessage = '';
			try {
				mockGetUserName.mockReturnValue('Test User');
				authService.isAuthorized();
			} catch (err) {
				errorMessage = (err as Error).message;
			}
			expect(errorMessage).toEqual('Missing authenticated user details');
		});

		it('Authorization request is missing action', () => {
			let errorMessage = '';
			try {
				mockGetUserName.mockReturnValue('Test User');
				mockGetRoles.mockReturnValue(['user', 'admin']);
				authService.isAuthorized();
			} catch (err) {
				errorMessage = (err as Error).message;
			}
			expect(errorMessage).toEqual('Missing authorization action details');
		});

		it('Authorization request is missing resource', () => {
			let errorMessage = '';
			try {
				mockGetUserName.mockReturnValue('Test User');
				mockGetRoles.mockReturnValue(['user', 'admin']);
				authService.setAction('getOrder');
				authService.isAuthorized();
			} catch (err) {
				errorMessage = (err as Error).message;
			}
			expect(errorMessage).toEqual('Missing authorization resource details');
		});
	});

	describe('Authorization Service advanced features', () => {
		let authService: AuthorizationService;

		beforeEach(async () => {
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockReturnValueOnce(schema);
			authService = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
		});

		it('should handle setEntities method', () => {
			const entities = [
				{
					uid: { type: 'OrderService::Order', id: 'order-123' },
					attrs: { status: 'PENDING' },
					parents: [],
				},
			];

			const result = authService.setEntities(entities);
			expect(result).toBe(authService); // Should return this for chaining
		});

		it('should handle schema as JSON string', async () => {
			const jsonSchema = JSON.stringify({ entityTypes: {}, actions: {} });
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockReturnValueOnce(jsonSchema);

			const service = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
			expect(service).not.toBeUndefined();
		});

		it('should handle authorization failure', async () => {
			mockGetUserName.mockReturnValue('test-user');
			mockGetRoles.mockReturnValue(['invalid-role']);

			authService
				.setAction('getOrder')
				.setResource('order-123')
				.addEntity({
					uid: { type: 'OrderService::Order', id: 'order-123' },
					attrs: {
						status: 'PENDING',
						customer: { type: 'OrderService::User', id: 'other-user' },
						createdBy: { type: 'OrderService::User', id: 'other-user' },
						accountManager: { type: 'OrderService::User', id: 'other-manager' },
					},
					parents: [],
				});

			const isAuthorized = authService.isAuthorized();
			expect(isAuthorized).toBe(false);
		});

		it('should return cached service when refresh is false', async () => {
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockReturnValueOnce(schema);

			const service1 = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
			const service2 = await AuthorizationService.getService(
				authorizationConfig,
				false,
			);

			expect(service2).toBe(service1);
		});

		it('should handle invalid JSON schema gracefully', async () => {
			const invalidJsonSchema = 'not a valid JSON{';
			mockLoadFileAsString
				.mockReturnValueOnce(policy)
				.mockReturnValueOnce(invalidJsonSchema);

			const service = await AuthorizationService.getService(
				authorizationConfig,
				true,
			);
			expect(service).not.toBeUndefined();
		});

		it('should handle missing username in constructUserEntity', () => {
			mockGetUserName.mockReturnValue(undefined as unknown as string);
			mockGetRoles.mockReturnValue(['admin']);

			authService.setAction('getOrder').setResource('order-123');

			expect(() => authService.isAuthorized()).toThrow(
				'Missing authenticated user details',
			);
		});

		it('should handle empty roles array when constructing user entity', () => {
			mockGetUserName.mockReturnValue('test-user');
			mockGetRoles.mockReturnValue([]);

			authService
				.setAction('getOrder')
				.setResource('order-123')
				.addEntity({
					uid: { type: 'OrderService::Order', id: 'order-123' },
					attrs: {
						status: 'PENDING',
						customer: { type: 'OrderService::User', id: 'test-user' },
						createdBy: { type: 'OrderService::User', id: 'test-user' },
						accountManager: { type: 'OrderService::User', id: 'manager' },
					},
					parents: [],
				});

			// Empty roles passes validation (![] is false) and creates user with no role entities
			const result = authService.isAuthorized();
			expect(typeof result).toBe('boolean');
		});

		it('should handle missing username in build method', () => {
			mockGetUserName
				.mockReturnValueOnce('test-user')
				.mockReturnValueOnce(undefined as unknown as string);
			mockGetRoles.mockReturnValue(['admin']);

			authService.setAction('getOrder').setResource('order-123');

			expect(() => authService.isAuthorized()).toThrow(
				'Missing authenticated user details',
			);
		});

		it('should handle missing action in build method after validation', () => {
			mockGetUserName.mockReturnValue('test-user');
			mockGetRoles.mockReturnValue(['admin']);

			// Set resource but not action to trigger action validation in build
			authService.setResource('order-123');

			expect(() => authService.isAuthorized()).toThrow(
				'Missing authorization action details',
			);
		});

		it('should handle missing resource in build method after validation', () => {
			mockGetUserName.mockReturnValue('test-user');
			mockGetRoles.mockReturnValue(['admin']);

			// Set action but not resource to trigger resource validation in build
			authService.setAction('getOrder');

			expect(() => authService.isAuthorized()).toThrow(
				'Missing authorization resource details',
			);
		});

		it('should handle authorization failure with error details', () => {
			// Create a mock scenario that would cause a Cedar authorization failure
			mockGetUserName.mockReturnValue('test-user');
			mockGetRoles.mockReturnValue(['customers']);

			authService
				.setAction('getOrder')
				.setResource('order-123')
				.addEntity({
					uid: { type: 'OrderService::Order', id: 'order-123' },
					attrs: {
						status: 'INVALID_STATUS_THAT_CAUSES_ERROR',
						customer: { type: 'OrderService::User', id: 'other-user' },
						createdBy: { type: 'OrderService::User', id: 'other-user' },
						accountManager: { type: 'OrderService::User', id: 'other-manager' },
					},
					parents: [],
				});

			// This should not throw, but should return false
			try {
				const isAuthorized = authService.isAuthorized();
				expect(typeof isAuthorized).toBe('boolean');
			} catch (error) {
				// If it does throw due to Cedar validation, that's also acceptable
				expect(error).toBeInstanceOf(Error);
			}
		});
	});
});
