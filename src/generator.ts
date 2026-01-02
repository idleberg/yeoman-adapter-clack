import { intro, outro } from '@clack/prompts';
import { createEnv } from 'yeoman-environment';
import type { BaseOptions, Storage } from 'yeoman-generator';
import Generator from 'yeoman-generator';
import { ClackAdapter } from './adapter.ts';
import type { ClackPromptOptions, ClackPromptResult } from './clack.js';

export class ClackGenerator extends Generator {
	constructor(args?: string | string[], opts?: BaseOptions) {
		const options: BaseOptions = opts || ({} as BaseOptions);

		if (options.env) {
			const adapter = options.env.adapter;
			const isTestAdapter = adapter.constructor.name === 'TestAdapter';

			if (!isTestAdapter && !(adapter instanceof ClackAdapter)) {
				options.env.adapter = new ClackAdapter();
			}
		} else {
			options.env = createEnv({ adapter: new ClackAdapter() });
		}

		super(args || [], options);
	}

	set intro(message: string) {
		intro(message);
	}

	set outro(message: string) {
		outro(message);
	}

	override async prompt<A extends ClackPromptResult = ClackPromptResult>(
		questions: ClackPromptOptions | ClackPromptOptions[] | any,
		storage?: Storage | string,
	): Promise<A> {
		const questionsArray = Array.isArray(questions) ? questions : [questions];

		const storageObj =
			storage === undefined ? this.config : typeof storage === 'string' ? (this as any)[storage] : storage;

		const questionsWithDefaults = questionsArray.map((q) => {
			if (q.store && storageObj) {
				const storedValue = storageObj.get(q.name);
				if (storedValue !== undefined) {
					return { ...q, default: storedValue };
				}
			}
			return q;
		});

		const answers = (await this.env.adapter.prompt(questionsWithDefaults)) as A;

		questionsArray.forEach((q: any) => {
			if (q.store && storageObj && answers[q.name] !== undefined) {
				storageObj.set(q.name, answers[q.name]);
			}
		});

		return answers;
	}
}
