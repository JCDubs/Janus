import * as fileLoader from "../../file-loader/file-loader";

const uuid = () => "test-uuid-123";

import * as userDetails from "../../user-details";
import { AuthorizationService } from "../authorization-service";
import { authorizationConfig } from "./config";
import { createOrderEntity } from "./create-order-entity";
import { getPolicy, getSchema } from "./get-policy";
import { OrderAction, Role, Status } from "./types";

jest.mock("../../user-details");
jest.mock("../../file-loader/file-loader");

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

describe("Sales Manager role tests", () => {
	let authService: AuthorizationService;

	beforeAll(() => {
		policy = getPolicy();
		schema = getSchema();
	});

	beforeEach(async () => {
		jest.clearAllMocks();
		mockLoadFileAsString
			.mockReturnValueOnce(policy)
			.mockReturnValueOnce(schema);
	});

	it("Sale Managers can get orders belonging to any customer", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.GET_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-1",
					accountManager: "account manager 1",
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeTruthy();
	});

	it("Sale Managers can create an order for any customer", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.CREATE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-1",
					accountManager: "account manager 1",
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeTruthy();
	});

	it("Sale Managers can update an order belonging to any customers with a status of pending", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.UPDATE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-2",
					accountManager: "account manager 1",
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeTruthy();
	});

	it("Sale Managers cant update an order for any customers with a status of shipped", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.UPDATE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-2",
					accountManager: "account manager 1",
					status: Status.SHIPPED,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});

	it("Sale Managers cant update an order for any customers with a status of delivered", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.UPDATE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-2",
					accountManager: "account manager 1",
					status: Status.DELIVERED,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});

	it("Sale Managers can delete an order belonging to any customers with a status of pending", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.DELETE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-2",
					accountManager: "account manager 1",
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeTruthy();
	});

	it("Sale Managers cant delete an order for any customers with a status of shipped", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.DELETE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-2",
					accountManager: "account manager 1",
					status: Status.SHIPPED,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});

	it("Sale Managers cant delete an order for any customers with a status of delivered", async () => {
		const orderId = uuid();
		const userName = "sales-manager-one";
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.SALE_MANAGERS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.DELETE_ORDER)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: "test-1",
					customer: "customer-2",
					accountManager: "account manager 1",
					status: Status.DELIVERED,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});
});
