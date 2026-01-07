import { UnauthorizedError } from './unauthorized-error';

describe('UnauthorizedError', () => {
	it('should create an UnauthorizedError with correct message and name', () => {
		const errorMessage = 'User is not authorized to perform this action';
		const error = new UnauthorizedError(errorMessage);

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe(errorMessage);
		expect(error.name).toBe('UnauthorizedError');
	});

	it('should be throwable', () => {
		expect(() => {
			throw new UnauthorizedError('Access denied');
		}).toThrow(UnauthorizedError);
	});

	it('should be catchable as Error', () => {
		try {
			throw new UnauthorizedError('Test error');
		} catch (err) {
			expect(err).toBeInstanceOf(Error);
			expect(err).toBeInstanceOf(UnauthorizedError);
			expect((err as Error).message).toBe('Test error');
		}
	});
});
