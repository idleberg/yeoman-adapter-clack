import * as clack from '@clack/prompts';
import { TerminalAdapter } from '@yeoman/adapter';
import type { PromptAnswers, PromptQuestions } from 'yeoman-generator';

/**
 * ClackCompatAdapter provides Clack prompts using pure Inquirer API
 *
 * This adapter accepts ONLY standard Inquirer properties and maps them
 * to Clack prompts internally. It does NOT accept Clack-specific properties.
 *
 * For pure Clack API with Clack-specific options, use ClackAdapter instead.
 *
 * Supported Inquirer properties:
 * - name, message, type, default, when, validate, filter, store
 * - choices (for list/checkbox)
 * - pageSize (for list/checkbox)
 * - checked (on choice items for checkbox)
 * - required (for inputs)
 *
 * Supported types:
 * - input: Maps to clack.text()
 * - password: Maps to clack.password()
 * - confirm: Maps to clack.confirm()
 * - list/rawlist: Maps to clack.select()
 * - checkbox: Maps to clack.multiselect()
 * - number: Maps to clack.text() with number validation
 */
export class ClackCompatAdapter extends TerminalAdapter {
	override async prompt<A extends PromptAnswers = PromptAnswers>(
		questions: PromptQuestions<A>,
		initialAnswers?: Partial<A>,
	): Promise<A> {
		const questionsArray = Array.isArray(questions) ? questions : [questions];

		const answers = { ...initialAnswers };

		for (const question of questionsArray) {
			// Handle `when` conditional
			if (typeof question.when === 'function') {
				const whenFn = question.when as (answers: any) => boolean | Promise<boolean>;

				const shouldAsk = await Promise.resolve(whenFn(answers));

				if (!shouldAsk) continue;
			}

			if (question.when === false) {
				continue;
			}

			answers[question.name] = await this.askQuestion(question, answers);

			if (clack.isCancel(answers[question.name])) {
				clack.log.error('Operation cancelled');
				process.exit(0);
			}
		}

		return answers as A;
	}

	/**
	 * Ask a single question using Clack prompts
	 * Maps pure Inquirer properties to Clack prompts
	 * Does NOT support Clack-specific properties
	 */
	private async askQuestion(question: any, answers: any): Promise<any> {
		// Resolve message (can be function or string)
		const message = typeof question.message === 'function' ? question.message(answers) : question.message;

		// Resolve default value from Inquirer's 'default' option
		const defaultValue = typeof question.default === 'function' ? question.default(answers) : question.default;

		// Handle validate function - adapt Inquirer's validate to clack's format
		const validate = (value: any) => {
			// Check required first (for text inputs) - Inquirer standard
			if (question.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
				return 'This field is required';
			}

			// Then run custom validation if provided
			if (question.validate && typeof question.validate === 'function') {
				const result = question.validate(value, answers);
				// Inquirer validate returns true for valid, or error message for invalid
				// Clack validate returns undefined for valid, or error message for invalid
				if (result === true) return undefined;
				if (typeof result === 'string') return result;
				return 'Invalid input';
			}

			return undefined;
		};

		// Handle filter function
		const applyFilter = (value: any) => {
			if (question.filter && typeof question.filter === 'function') {
				return question.filter(value, answers);
			}
			return value;
		};

		switch (question.type) {
			case 'password': {
				const passwordResult = await clack.password({
					message,
					validate,
				});

				return applyFilter(passwordResult);
			}

			case 'confirm': {
				const confirmResult = await clack.confirm({
					message,
					initialValue: defaultValue ?? false,
				});

				return applyFilter(confirmResult);
			}

			case 'list':
			case 'rawlist': {
				const selectOptions = question.choices.map((c: any) =>
					typeof c === 'string' ? { value: c, label: c } : { value: c.value, label: c.name || c.label },
				);

				const selectResult = await clack.select({
					message,
					options: selectOptions,
					initialValue: defaultValue,
					maxItems: question.pageSize,
				});

				return applyFilter(selectResult);
			}

			case 'checkbox': {
				const multiselectOptions = question.choices.map((c: any) => {
					const option: any =
						typeof c === 'string' ? { value: c, label: c } : { value: c.value, label: c.name || c.label };

					// Handle checked property from Inquirer
					if (typeof c === 'object' && c.checked) {
						option.checked = true;
					}
					return option;
				});

				// Get initial values from checked options
				const initialCheckedValues = multiselectOptions.filter((opt: any) => opt.checked).map((opt: any) => opt.value);

				const multiselectResult = await clack.multiselect({
					message,
					options: multiselectOptions,
					required: question.required ?? false,
					initialValues: initialCheckedValues.length > 0 ? initialCheckedValues : defaultValue || [],
				});

				return applyFilter(multiselectResult);
			}

			case 'number': {
				const numberResult = await clack.text({
					message,
					initialValue: defaultValue?.toString(),
					validate: (value) => {
						if (value && isNaN(Number(value))) {
							return 'Please enter a valid number';
						}
						return validate ? validate(value) : undefined;
					},
				});

				return applyFilter(numberResult ? Number(numberResult) : numberResult);
			}

			case 'input':
			default: {
				// Fallback to text for unknown types
				const fallbackResult = await clack.text({
					message,
					initialValue: defaultValue,
					validate,
				});

				return applyFilter(fallbackResult);
			}
		}
	}
}
