import type middy from "@middy/core";
import type {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from "aws-lambda";
import {
	type AuthorizationConfigType,
	AuthorizationService,
} from "../authorization-service";
import * as userDetails from "../user-details";
import { loadCedarAuthorization } from "./authorization-middleware";

jest.mock("../user-details");

const _mockSetUserDetails = userDetails.setUserDetails as jest.MockedFunction<
	typeof userDetails.setUserDetails
>;

describe("authorization Middleware tests", () => {
	let beforeFn: middy.MiddlewareFn<APIGatewayProxyEvent, APIGatewayProxyResult>;
	let _getServiceSpy: jest.SpyInstance;

	const authorizationConfig: AuthorizationConfigType = {
		principleType: "User",
		resourceType: "Order",
		roleType: "Role",
	};

	beforeAll(() => {
		_getServiceSpy = jest.spyOn(AuthorizationService, "getService");
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		const middleware = loadCedarAuthorization(authorizationConfig);
		if (!middleware.before) {
			throw new Error("before function not found in middleware");
		}
		beforeFn = middleware.before;
	});

	it("should successfully setup the user and authorization service without headers", async () => {
		const request = {
			event: {
				requestContext: {
					authorizer: {
						claims: {
							"cognito:username": "testUser",
							"cognito:groups": ["admin"],
						},
					},
				},
			},
		} as unknown as middy.Request<
			APIGatewayProxyEvent,
			APIGatewayProxyResult,
			Error,
			Context
		>;
		const mockSetUserDetails = jest
			.spyOn(userDetails, "setUserDetails")
			.mockImplementation(() => undefined);
		const getServiceSpy = jest
			.spyOn(AuthorizationService, "getService")
			.mockImplementation(() => Promise.resolve({} as AuthorizationService));

		await expect(beforeFn(request)).resolves.not.toThrow();
		expect(mockSetUserDetails).toHaveBeenCalledWith(request.event);
		expect(getServiceSpy).toHaveBeenCalledWith(authorizationConfig, false);
	});

	it("should successfully setup the user and authorization service with headers", async () => {
		const request = {
			event: {
				headers: {},
				requestContext: {
					authorizer: {
						claims: {
							"cognito:username": "testUser",
							"cognito:groups": ["admin"],
						},
					},
				},
			},
		} as unknown as middy.Request<
			APIGatewayProxyEvent,
			APIGatewayProxyResult,
			Error,
			Context
		>;
		const mockSetUserDetails = jest
			.spyOn(userDetails, "setUserDetails")
			.mockImplementation(() => undefined);
		const getServiceSpy = jest
			.spyOn(AuthorizationService, "getService")
			.mockImplementation(() => Promise.resolve({} as AuthorizationService));

		await expect(beforeFn(request)).resolves.not.toThrow();
		expect(mockSetUserDetails).toHaveBeenCalledWith(request.event);
		expect(getServiceSpy).toHaveBeenCalledWith(authorizationConfig, false);
	});

	it("should successfully setup the user and authorization service with false cedar-refresh headers", async () => {
		const request = {
			event: {
				headers: { "cedar-refresh": "false" },
				requestContext: {
					authorizer: {
						claims: {
							"cognito:username": "testUser",
							"cognito:groups": ["admin"],
						},
					},
				},
			},
		} as unknown as middy.Request<
			APIGatewayProxyEvent,
			APIGatewayProxyResult,
			Error,
			Context
		>;
		const mockSetUserDetails = jest
			.spyOn(userDetails, "setUserDetails")
			.mockImplementation(() => undefined);
		const getServiceSpy = jest
			.spyOn(AuthorizationService, "getService")
			.mockImplementation(() => Promise.resolve({} as AuthorizationService));

		await expect(beforeFn(request)).resolves.not.toThrow();
		expect(mockSetUserDetails).toHaveBeenCalledWith(request.event);
		expect(getServiceSpy).toHaveBeenCalledWith(authorizationConfig, false);
	});

	it("should successfully setup the user and authorization service with true cedar-refresh headers", async () => {
		const request = {
			event: {
				headers: { "cedar-refresh": "true" },
				requestContext: {
					authorizer: {
						claims: {
							"cognito:username": "testUser",
							"cognito:groups": ["admin"],
						},
					},
				},
			},
		} as unknown as middy.Request<
			APIGatewayProxyEvent,
			APIGatewayProxyResult,
			Error,
			Context
		>;
		const mockSetUserDetails = jest
			.spyOn(userDetails, "setUserDetails")
			.mockImplementation(() => undefined);
		const getServiceSpy = jest
			.spyOn(AuthorizationService, "getService")
			.mockImplementation(() => Promise.resolve({} as AuthorizationService));

		await expect(beforeFn(request)).resolves.not.toThrow();
		expect(mockSetUserDetails).toHaveBeenCalledWith(request.event);
		expect(getServiceSpy).toHaveBeenCalledWith(authorizationConfig, true);
	});

	it("should throw an error", async () => {
		const request = {
			event: {
				headers: {},
				requestContext: {
					authorizer: {
						claims: {
							"cognito:username": "testUser",
							"cognito:groups": ["admin"],
						},
					},
				},
			},
		} as unknown as middy.Request<
			APIGatewayProxyEvent,
			APIGatewayProxyResult,
			Error,
			Context
		>;
		const mockSetUserDetails = jest
			.spyOn(userDetails, "setUserDetails")
			.mockImplementation(() => undefined);
		const getServiceSpy = jest
			.spyOn(AuthorizationService, "getService")
			.mockImplementation(() => Promise.reject(new Error("Test Error")));

		await expect(beforeFn(request)).rejects.toThrow("Test Error");
		expect(mockSetUserDetails).toHaveBeenCalledWith(request.event);
		expect(getServiceSpy).toHaveBeenCalledWith(authorizationConfig, false);
	});
});
