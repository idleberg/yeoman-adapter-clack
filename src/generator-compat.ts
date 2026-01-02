import { intro, outro } from '@clack/prompts';
import { createEnv } from 'yeoman-environment';
import type { BaseOptions, PromptAnswers, PromptQuestions, Storage } from 'yeoman-generator';
import Generator from 'yeoman-generator';
import { ClackCompatAdapter } from './adapter-compat.ts';
import type { Question } from './compat.js';

export class ClackCompatGenerator extends Generator {
	constructor(args?: string | string[], opts?: BaseOptions) {
		const options: BaseOptions = opts || ({} as BaseOptions);

		if (options.env) {
			const adapter = options.env.adapter;
			const isTestAdapter = adapter.constructor.name === 'TestAdapter';

			if (!isTestAdapter && !(adapter instanceof ClackCompatAdapter)) {
				options.env.adapter = new ClackCompatAdapter();
			}
		} else {
			options.env = createEnv({ adapter: new ClackCompatAdapter() });
		}

		super(args || [], options);
	}

	set intro(message: string) {
		intro(message);
	}

	set outro(message: string) {
		outro(message);
	}

	override async prompt<A extends PromptAnswers = PromptAnswers>(
		questions: PromptQuestions<A> | Question | Question[],
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

		const answers = (await this.env.adapter.prompt(questionsWithDefaults as any)) as A;

		questionsArray.forEach((q) => {
			if (q.store && storageObj && answers[q.name] !== undefined) {
				storageObj.set(q.name, answers[q.name]);
			}
		});

		return answers;
	}
}
