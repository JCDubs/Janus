import type { APIGatewayProxyEvent } from 'aws-lambda';
import {
	getRoles,
	getUserName,
	resetDetails,
	setUserDetails,
} from './user-details-service';

describe('UserDetailService', () => {
	beforeEach(() => {
		resetDetails();
	});

	describe('setUserDetails', () => {
		it('should set user details when event has valid authorizer with single role', () => {
			const mockEvent = {
				requestContext: {
					authorizer: {
						claims: {
							'cognito:username': 'testUser',
							'cognito:groups': 'admin',
						},
					},
				},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);

			expect(getUserName()).toBe('testUser');
			expect(getRoles()).toEqual(['admin']);
		});

		it('should set user details when event has valid authorizer with multiple roles', () => {
			const mockEvent = {
				requestContext: {
					authorizer: {
						claims: {
							'cognito:username': 'testUser',
							'cognito:groups': ['admin', 'user'],
						},
					},
				},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);

			expect(getUserName()).toBe('testUser');
			expect(getRoles()).toEqual(['admin', 'user']);
		});

		it('should handle event without authorizer', () => {
			const mockEvent = {
				requestContext: {},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);

			expect(getUserName()).toBeUndefined();
			expect(getRoles()).toBeUndefined();
		});

		it('should handle event with empty claims', () => {
			const mockEvent = {
				requestContext: {
					authorizer: {
						claims: {},
					},
				},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);

			expect(getUserName()).toBeUndefined();
			expect(getRoles()).toBeUndefined();
		});
	});

	describe('getUserName', () => {
		it('should return undefined when username is not set', () => {
			expect(getUserName()).toBeUndefined();
		});

		it('should return username when set', () => {
			const mockEvent = {
				requestContext: {
					authorizer: {
						claims: {
							'cognito:username': 'testUser',
							'cognito:groups': ['admin'],
						},
					},
				},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);
			expect(getUserName()).toBe('testUser');
		});
	});

	describe('getRoles', () => {
		it('should return undefined when roles are not set', () => {
			expect(getRoles()).toBeUndefined();
		});

		it('should return roles when set', () => {
			const mockEvent = {
				requestContext: {
					authorizer: {
						claims: {
							'cognito:username': 'testUser',
							'cognito:groups': ['admin', 'user'],
						},
					},
				},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);
			expect(getRoles()).toEqual(['admin', 'user']);
		});
	});

	describe('resetDetails', () => {
		it('should reset all user details', () => {
			const mockEvent = {
				requestContext: {
					authorizer: {
						claims: {
							'cognito:username': 'testUser',
							'cognito:groups': ['admin'],
						},
					},
				},
			} as unknown as APIGatewayProxyEvent;

			setUserDetails(mockEvent);
			expect(getUserName()).toBe('testUser');
			expect(getRoles()).toEqual(['admin']);

			resetDetails();
			expect(getUserName()).toBeUndefined();
			expect(getRoles()).toBeUndefined();
		});
	});
});
