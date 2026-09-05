import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClackAdapter } from './adapter.ts';

const CANCEL = Symbol('cancel');

const clack = vi.hoisted(() => {
	return {
		autocomplete: vi.fn(),
		autocompleteMultiselect: vi.fn(),
		confirm: vi.fn(),
		date: vi.fn(),
		groupMultiselect: vi.fn(),
		multiline: vi.fn(),
		multiselect: vi.fn(),
		password: vi.fn(),
		path: vi.fn(),
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

describe('prompt types', () => {
	it.each([
		['text', 'text', { placeholder: 'p' }],
		['password', 'password', {}],
		['confirm', 'confirm', {}],
		['select', 'select', { options: [] }],
		['multiselect', 'multiselect', { options: [] }],
		['multiline', 'multiline', { showSubmit: true }],
		['date', 'date', { locale: 'en-GB' }],
		['path', 'path', { root: '/tmp' }],
		['groupMultiselect', 'groupMultiselect', { options: {} }],
		['selectKey', 'selectKey', { options: [] }],
		['autocomplete', 'autocomplete', { options: [] }],
		['autocompleteMultiselect', 'autocompleteMultiselect', { options: [] }],
	])('maps type %s to clack.%s()', async (type, fn, extra) => {
		const mock = clack[fn as keyof typeof clack] as ReturnType<typeof vi.fn>;
		mock.mockResolvedValue('answer');

		const answers = await new ClackAdapter().prompt([{ type, name: 'foo', message: 'Message', ...extra } as never]);

		expect(mock).toHaveBeenCalledOnce();
		expect(argOf(mock)).toMatchObject({ message: 'Message', ...extra });
		expect(answers).toEqual({ foo: 'answer' });
	});

	it('renders expand choices as keyed autocomplete options', async () => {
		clack.autocomplete.mockResolvedValue('y');

		await new ClackAdapter().prompt([
			{
				type: 'expand',
				name: 'foo',
				message: 'Overwrite?',
				choices: [
					{ key: 'y', name: 'Yes', value: 'yes' },
					{ type: 'separator' },
					{ key: 'n', name: 'No', value: 'no' },
				],
			} as never,
		]);

		expect(argOf(clack.autocomplete, 0)).toMatchObject({
			message: 'Overwrite? (yn)',
			options: [
				{ value: 'yes', label: 'y) Yes' },
				{ value: 'no', label: 'n) No' },
			],
			initialValue: 'yes',
		});
	});

	it('throws on an unknown type', async () => {
		await expect(new ClackAdapter().prompt([{ type: 'nope', name: 'foo', message: 'M' } as never])).rejects.toThrow(
			'Unknown prompt type: nope',
		);
	});
});

describe('defaults', () => {
	it('falls back to a static default', async () => {
		clack.text.mockResolvedValue('answer');

		await new ClackAdapter().prompt([{ type: 'text', name: 'foo', message: 'M', default: 'fallback' } as never]);

		expect(argOf(clack.text, 0)).toMatchObject({ initialValue: 'fallback' });
	});

	it('resolves a function default against previous answers', async () => {
		clack.text.mockResolvedValueOnce('bar').mockResolvedValueOnce('answer');

		await new ClackAdapter().prompt([
			{ type: 'text', name: 'foo', message: 'M' } as never,
			{ type: 'text', name: 'baz', message: 'M', default: (answers: any) => `${answers.foo}!` } as never,
		]);

		expect(argOf(clack.text, 1)).toMatchObject({ initialValue: 'bar!' });
	});

	it('prefers an explicit initialValue over the default', async () => {
		clack.select.mockResolvedValue('answer');

		await new ClackAdapter().prompt([
			{ type: 'select', name: 'foo', message: 'M', options: [], initialValue: 'a', default: 'b' } as never,
		]);

		expect(argOf(clack.select, 0)).toMatchObject({ initialValue: 'a' });
	});
});

describe('when', () => {
	it('skips a question when `when` is false', async () => {
		const answers = await new ClackAdapter().prompt([
			{ type: 'text', name: 'foo', message: 'M', when: false } as never,
		]);

		expect(clack.text).not.toHaveBeenCalled();
		expect(answers).toEqual({});
	});

	it('passes previous answers to a `when` function', async () => {
		clack.confirm.mockResolvedValue(false);
		clack.text.mockResolvedValue('answer');

		const answers = await new ClackAdapter().prompt([
			{ type: 'confirm', name: 'go', message: 'M' } as never,
			{ type: 'text', name: 'foo', message: 'M', when: (a: any) => a.go } as never,
		]);

		expect(clack.text).not.toHaveBeenCalled();
		expect(answers).toEqual({ go: false });
	});
});

describe('cancellation', () => {
	it('exits when a prompt is cancelled', async () => {
		clack.text.mockResolvedValue(CANCEL);

		const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
			throw new Error('process.exit');
		});

		await expect(new ClackAdapter().prompt([{ type: 'text', name: 'foo', message: 'M' } as never])).rejects.toThrow(
			'process.exit',
		);

		expect(clack.log.error).toHaveBeenCalledWith('Operation cancelled');
		expect(exit).toHaveBeenCalledWith(0);

		exit.mockRestore();
	});
});

describe('queueing', () => {
	it('runs concurrent prompt() calls one after another', async () => {
		let resolveFirst!: (value: string) => void;

		clack.text
			.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce('second');

		const adapter = new ClackAdapter();
		const first = adapter.prompt([{ type: 'text', name: 'a', message: 'A' } as never]);
		const second = adapter.prompt([{ type: 'text', name: 'b', message: 'B' } as never]);

		await vi.waitFor(() => expect(clack.text).toHaveBeenCalledOnce());
		expect(clack.text).toHaveBeenCalledOnce();

		resolveFirst('first');

		expect(await first).toEqual({ a: 'first' });
		expect(await second).toEqual({ b: 'second' });
		expect(clack.text).toHaveBeenCalledTimes(2);
	});

	it('runs the next prompt even after one rejects', async () => {
		clack.text.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');

		const adapter = new ClackAdapter();
		const first = adapter.prompt([{ type: 'text', name: 'a', message: 'A' } as never]);
		const second = adapter.prompt([{ type: 'text', name: 'b', message: 'B' } as never]);

		await expect(first).rejects.toThrow('boom');
		expect(await second).toEqual({ b: 'ok' });
	});
});
