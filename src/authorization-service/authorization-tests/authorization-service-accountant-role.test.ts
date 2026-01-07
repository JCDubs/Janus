import * as fileLoader from '../../file-loader/file-loader';

const uuid = () => 'test-uuid-123';

import * as userDetails from '../../user-details';
import { AuthorizationService } from '../authorization-service';
import { authorizationConfig } from './config';
import { createOrderEntity } from './create-order-entity';
import { getPolicy, getSchema } from './get-policy';
import { OrderAction, Role, Status } from './types';

jest.mock('../../user-details');
jest.mock('../../file-loader/file-loader');

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

describe('Accountant role tests', () => {
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

	it('Accountants can get orders for any customer account', async () => {
		const orderId = uuid();
		const userName = 'accountant-one';
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.ACCOUNTANTS, Role.USER]);
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
					createdBy: 'test-1',
					customer: 'customer-1',
					accountManager: 'accountant-manager-one',
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeTruthy();
	});

	it('Accountants can list orders for customer accounts they manage', async () => {
		const orderId = uuid();
		const userName = 'accountant-one';
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.ACCOUNTANTS, Role.USER]);
		authService = await AuthorizationService.getService(
			authorizationConfig,
			true,
		);
		const authResult = authService
			.setAction(OrderAction.LIST_ORDERS)
			.setResource(orderId)
			.addEntity(
				createOrderEntity({
					id: orderId,
					createdBy: 'test-1',
					customer: 'customer-1',
					accountManager: 'account-manager-one',
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeTruthy();
	});

	it('Accountants cant create orders', async () => {
		const orderId = uuid();
		const userName = 'accountant-one';
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.ACCOUNTANTS, Role.USER]);
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
					createdBy: 'test-1',
					customer: 'customer-2',
					accountManager: 'account-manager-one',
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});

	it('Accountants cant update orders', async () => {
		const orderId = uuid();
		const userName = 'accountant-one';
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.ACCOUNTANTS, Role.USER]);
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
					createdBy: 'test-1',
					customer: 'customer-2',
					accountManager: 'account-manager-one',
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});

	it('Accountants cant delete orders', async () => {
		const orderId = uuid();
		const userName = 'accountant-one';
		mockGetUserName.mockReturnValue(userName);
		mockGetRoles.mockReturnValue([Role.ACCOUNTANTS, Role.USER]);
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
					createdBy: 'test-1',
					customer: 'customer-2',
					accountManager: 'account-manager-one',
					status: Status.PENDING,
				}),
			)
			.isAuthorized();

		expect(authResult).toBeFalsy();
	});
});
