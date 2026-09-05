import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClackCompatAdapter } from './adapter-compat.ts';

const CANCEL = Symbol('cancel');

const clack = vi.hoisted(() => {
	return {
		confirm: vi.fn(),
		multiselect: vi.fn(),
		password: vi.fn(),
		select: vi.fn(),
		selectKey: vi.fn(),
		text: vi.fn(),
		isCancel: vi.fn(),
		log: { error: vi.fn() },
	};
});

vi.mock('@clack/prompts', () => clack);

const argOf = (mock: { mock: { calls: unknown[][] } }, call = 0): any => mock.mock.calls[call]?.[0];

beforeEach(() => {
	vi.resetAllMocks();
	clack.isCancel.mockImplementation((value: unknown) => value === CANCEL);
});

const prompt = (question: unknown) => new ClackCompatAdapter().prompt([question as never]);

describe('inquirer type mapping', () => {
	it('maps input to clack.text()', async () => {
		clack.text.mockResolvedValue('answer');

		expect(await prompt({ type: 'input', name: 'foo', message: 'M', default: 'bar' })).toEqual({ foo: 'answer' });
		expect(argOf(clack.text, 0)).toMatchObject({ message: 'M', initialValue: 'bar' });
	});

	it('maps password to clack.password()', async () => {
		clack.password.mockResolvedValue('hunter2');

		expect(await prompt({ type: 'password', name: 'foo', message: 'M' })).toEqual({ foo: 'hunter2' });
	});

	it('maps confirm to clack.confirm(), defaulting to false', async () => {
		clack.confirm.mockResolvedValue(true);

		await prompt({ type: 'confirm', name: 'foo', message: 'M' });

		expect(argOf(clack.confirm, 0)).toMatchObject({ initialValue: false });
	});

	it.each(['list', 'rawlist', 'select'])('maps %s to clack.select()', async (type) => {
		clack.select.mockResolvedValue('a');

		await prompt({ type, name: 'foo', message: 'M', choices: ['a', { value: 'b', name: 'B' }], pageSize: 5 });

		expect(argOf(clack.select, 0)).toMatchObject({
			options: [
				{ value: 'a', label: 'a' },
				{ value: 'b', label: 'B' },
			],
			maxItems: 5,
		});
	});

	it('maps checkbox to clack.multiselect(), seeding checked choices', async () => {
		clack.multiselect.mockResolvedValue(['b']);

		await prompt({
			type: 'checkbox',
			name: 'foo',
			message: 'M',
			choices: [
				{ value: 'a', name: 'A' },
				{ value: 'b', name: 'B', checked: true },
			],
		});

		expect(argOf(clack.multiselect, 0)).toMatchObject({ initialValues: ['b'] });
	});

	it('maps number to clack.text() and casts the result', async () => {
		clack.text.mockResolvedValue('42');

		expect(await prompt({ type: 'number', name: 'foo', message: 'M', default: 7 })).toEqual({ foo: 42 });
		expect(argOf(clack.text, 0)).toMatchObject({ initialValue: '7' });
		expect(argOf(clack.text, 0).validate('abc')).toBe('Please enter a valid number');
	});

	it('maps expand to clack.selectKey() and returns the choice value', async () => {
		clack.selectKey.mockResolvedValue('y');

		const answers = await prompt({
			type: 'expand',
			name: 'foo',
			message: 'M',
			choices: [
				{ key: 'y', name: 'Yes', value: 'yes' },
				{ key: 'n', name: 'No', value: 'no' },
			],
		});

		expect(argOf(clack.selectKey, 0)).toMatchObject({ initialValue: 'y' });
		expect(answers).toEqual({ foo: 'yes' });
	});

	it('falls back to clack.text() for unknown types', async () => {
		clack.text.mockResolvedValue('answer');

		expect(await prompt({ type: 'editor', name: 'foo', message: 'M' })).toEqual({ foo: 'answer' });
	});
});

describe('validate', () => {
	const validateOf = async (question: Record<string, unknown>) => {
		clack.text.mockResolvedValue('answer');
		await prompt({ type: 'input', name: 'foo', message: 'M', ...question });

		return argOf(clack.text, 0).validate;
	};

	it('rejects empty input when required', async () => {
		const validate = await validateOf({ required: true });

		expect(validate('   ')).toBe('This field is required');
		expect(validate('ok')).toBeUndefined();
	});

	it('translates an inquirer validator to clack semantics', async () => {
		const validate = await validateOf({ validate: (value: string) => value === 'ok' || 'nope' });

		expect(validate('ok')).toBeUndefined();
		expect(validate('bad')).toBe('nope');
	});
});

describe('filter, message and when', () => {
	it('applies filter to the answer', async () => {
		clack.text.mockResolvedValue('answer');

		const answers = await prompt({
			type: 'input',
			name: 'foo',
			message: 'M',
			filter: (value: string) => value.toUpperCase(),
		});

		expect(answers).toEqual({ foo: 'ANSWER' });
	});

	it('resolves a function message against previous answers', async () => {
		clack.text.mockResolvedValueOnce('World').mockResolvedValueOnce('answer');

		await new ClackCompatAdapter().prompt([
			{ type: 'input', name: 'who', message: 'M' } as never,
			{ type: 'input', name: 'foo', message: (a: any) => `Hello ${a.who}` } as never,
		]);

		expect(argOf(clack.text, 1)).toMatchObject({ message: 'Hello World' });
	});

	it('skips a question when `when` is false', async () => {
		expect(await prompt({ type: 'input', name: 'foo', message: 'M', when: false })).toEqual({});
		expect(clack.text).not.toHaveBeenCalled();
	});
});

describe('cancellation', () => {
	it('exits when a prompt is cancelled', async () => {
		clack.text.mockResolvedValue(CANCEL);

		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('process.exit');
		});

		await expect(prompt({ type: 'input', name: 'foo', message: 'M' })).rejects.toThrow('process.exit');
		expect(exit).toHaveBeenCalledWith(0);

		exit.mockRestore();
	});
});
