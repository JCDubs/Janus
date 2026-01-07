import type { AuthorizationConfigType } from "../types";

export const authorizationConfig: AuthorizationConfigType = {
	namespace: "OrderService::",
	principleType: "User",
	resourceType: "Order",
	roleType: "Role",
};
