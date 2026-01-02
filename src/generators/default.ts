import type { BaseOptions, Storage } from 'yeoman-generator';
import { ClackAdapter } from '../adapter.ts';
import type { ClackPromptOptions, ClackPromptResult } from '../clack.ts';
import { ClackBaseGenerator } from './base.ts';

/**
 * Generator for using Clack prompts with the pure Clack API.
 *
 * This generator provides access to all Clack-specific prompt options like
 * `initialValue`, `options`, `hint`, etc.
 *
 * For Inquirer-compatible API, use ClackCompatGenerator instead.
 */
export class ClackGenerator extends ClackBaseGenerator {
	constructor(args?: string | string[], opts?: BaseOptions) {
		super(ClackAdapter, args, opts);
	}

	override async prompt<A extends ClackPromptResult = ClackPromptResult>(
		questions: ClackPromptOptions | ClackPromptOptions[] | any,
		storage?: Storage | string,
	): Promise<A> {
		const questionsArray = Array.isArray(questions) ? questions : [questions];
		const questionsWithDefaults = this.loadStoredDefaults(questionsArray, storage);
		const answers = (await this.env.adapter.prompt(questionsWithDefaults)) as A;

		this.saveAnswers(questionsArray, answers, storage);

		return answers;
	}
}
