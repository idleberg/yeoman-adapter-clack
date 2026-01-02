import type { BaseOptions, PromptAnswers, PromptQuestions, Storage } from 'yeoman-generator';
import { ClackCompatAdapter } from '../adapter-compat.ts';
import type { Question } from '../compat.d.ts';
import { ClackBaseGenerator } from './base.ts';

/**
 * Generator for using Clack prompts with Inquirer-compatible API.
 *
 * This generator accepts standard Inquirer question properties and maps them
 * to Clack prompts internally. It provides compatibility with existing Yeoman
 * generators that use Inquirer.
 *
 * For pure Clack API with Clack-specific options, use ClackGenerator instead.
 */
export class ClackCompatGenerator extends ClackBaseGenerator {
	constructor(args?: string | string[], opts?: BaseOptions) {
		super(ClackCompatAdapter, args, opts);
	}

	override async prompt<A extends PromptAnswers = PromptAnswers>(
		questions: PromptQuestions<A> | Question | Question[],
		storage?: Storage | string,
	): Promise<A> {
		const questionsArray = Array.isArray(questions) ? questions : [questions];
		const questionsWithDefaults = this.loadStoredDefaults(questionsArray, storage);
		const answers = (await this.env.adapter.prompt(questionsWithDefaults as any)) as A;

		this.saveAnswers(questionsArray, answers, storage);

		return answers;
	}
}
