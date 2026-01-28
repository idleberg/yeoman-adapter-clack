import * as clack from '@clack/prompts';
import { TerminalAdapter } from '@yeoman/adapter';
import type { ClackPromptOptions, ClackPromptResult } from './clack.d.ts';

export class ClackAdapter extends TerminalAdapter {
	private promptQueue: Promise<unknown> = Promise.resolve();

	override async prompt<A extends ClackPromptResult = ClackPromptResult>(
		questions: ClackPromptOptions[] | any,
		initialAnswers?: Partial<A>,
	): Promise<A> {
		const nextPrompt = this.promptQueue.then(
			async () => await this.executePrompt(questions, initialAnswers),
			async () => await this.executePrompt(questions, initialAnswers),
		);

		this.promptQueue = nextPrompt;

		return nextPrompt as Promise<A>;
	}

	private async executePrompt<A extends ClackPromptResult = ClackPromptResult>(
		questions: ClackPromptOptions[] | any,
		initialAnswers?: Partial<A>,
	): Promise<A> {
		const questionsArray = Array.isArray(questions) ? questions : [questions];
		const answers = { ...initialAnswers } as any;

		for (const question of questionsArray) {
			const shouldAsk = await this.evaluateWhen(question.when, answers);
			if (!shouldAsk) continue;

			const result = await this.askQuestion(question, answers);

			if (clack.isCancel(result)) {
				clack.log.error('Operation cancelled');
				process.exit(0);
			}

			answers[question.name] = result;
		}

		return answers as A;
	}

	private async evaluateWhen(
		when: boolean | ((answers: any) => boolean | Promise<boolean>) | undefined,
		answers: any,
	): Promise<boolean> {
		if (when === undefined) return true;

		if (typeof when === 'function') {
			return await Promise.resolve(when(answers));
		}

		return when;
	}

	private async askQuestion(question: ClackPromptOptions, answers: any): Promise<any> {
		// Resolve default value from Inquirer's 'default' option (can be function or value)
		// This supports standard Yeoman storage pattern where Generator sets question.default
		const defaultValue =
			typeof (question as any).default === 'function' ? (question as any).default(answers) : (question as any).default;

		switch (question.type) {
			case 'text':
				return await clack.text({
					message: question.message,
					placeholder: question.placeholder,
					defaultValue: question.defaultValue,
					// Prefer explicit initialValue, fallback to default (for storage support)
					initialValue: question.initialValue ?? defaultValue,
					validate: question.validate,
				});

			case 'password':
				return await clack.password({
					message: question.message,
					validate: question.validate,
				});

			case 'confirm':
				return await clack.confirm({
					message: question.message,
					// Prefer explicit initialValue, fallback to default (for storage support)
					initialValue: question.initialValue ?? defaultValue ?? false,
					active: question.active,
					inactive: question.inactive,
				});

			case 'select': {
				const initialValue = question.initialValue ?? defaultValue;

				return await clack.select({
					message: question.message,
					options: question.options,
					...(initialValue !== undefined && { initialValue }),
					maxItems: question.maxItems,
				});
			}

			case 'multiselect': {
				const initialValues = question.initialValues ?? defaultValue;

				return await clack.multiselect({
					message: question.message,
					options: question.options,
					...(initialValues !== undefined && { initialValues }),
					required: question.required,
					cursorAt: question.cursorAt,
				});
			}

			case 'autocomplete': {
				const acQuestion = question as any;
				const initialValue = acQuestion.initialValue ?? defaultValue;

				return await clack.autocomplete({
					message: acQuestion.message,
					options: acQuestion.options,
					...(initialValue !== undefined && { initialValue }),
					placeholder: acQuestion.placeholder,
				});
			}

			case 'autocompleteMultiselect': {
				const acmsQuestion = question as any;
				const initialValues = acmsQuestion.initialValues ?? defaultValue;

				return await clack.autocompleteMultiselect({
					message: acmsQuestion.message,
					options: acmsQuestion.options,
					...(initialValues !== undefined && { initialValues }),
					placeholder: acmsQuestion.placeholder,
					required: acmsQuestion.required,
				});
			}
			case 'expand': {
				const options = (question as any).choices || [];

				const validChoices = options.filter(
					(c: any) => c && c.type !== 'separator' && (c.value !== undefined || c.key !== undefined),
				);

				const expandOptions = validChoices.map((c: any) => ({
					value: c.value || c.key,
					label: c.key ? `${c.key}) ${c.name || c.label || c.value}` : c.name || c.label || c.value,
				}));

				const keys = validChoices
					.map((c: any) => c.key)
					.filter(Boolean)
					.join('');

				const hint = keys ? ` (${keys})` : '';

				const resolvedDefault = question.initialValue ?? defaultValue;
				const initialValue = resolvedDefault !== undefined ? resolvedDefault : expandOptions[0]?.value;

				return await clack.select({
					message: question.message + hint,
					options: expandOptions,
					...(initialValue !== undefined && { initialValue }),
				});
			}
			default:
				throw new Error(`Unknown prompt type: ${(question as any).type}`);
		}
	}
}
