/**
 * Type definitions for ClackAdapter prompt questions
 * Combines Inquirer question format with Clack prompt capabilities
 *
 * This adapter supports all standard Inquirer options plus Clack-specific extensions.
 * Clack-specific options are marked with "Clack-specific" in comments.
 */

export interface BaseQuestion<T = any> {
	/** The name/key for storing the answer */
	name: string;

	/** The question message to display */
	message: string | ((answers: any) => string);

	/** The type of prompt */
	type?: PromptType;

	/** Default value for the question - maps to initialValue for text inputs (pre-filled, editable) (Inquirer standard) */
	default?: T | ((answers: any) => T);

	/** Validation function - return true if valid, or error message if invalid (Inquirer standard) */
	validate?: (value: T, answers?: any) => boolean | string | Promise<boolean | string>;

	/** Transform the answer value after input (Inquirer standard) */
	filter?: (value: T, answers?: any) => any;

	/** Conditional display - if false or function returns false, skip this question (Inquirer standard) */
	when?: boolean | ((answers: any) => boolean);

	/** Whether to persist the answer to generator config storage (Inquirer standard) */
	store?: boolean;
}

export interface InputQuestion extends BaseQuestion<string> {
	type: 'input' | 'text';

	/** Placeholder text to display when empty (Clack-specific) */
	placeholder?: string;

	/** Initial value - pre-filled but editable (Clack-specific, overrides default) */
	initialValue?: string;

	/** Whether the field is required (cannot be empty) (Inquirer standard) */
	required?: boolean;
}

export interface PasswordQuestion extends BaseQuestion<string> {
	type: 'password';

	/** Whether the field is required (cannot be empty) (Inquirer standard) */
	required?: boolean;
}

export interface NumberQuestion extends BaseQuestion<number> {
	type: 'number';

	/** Placeholder text to display when empty (Clack-specific) */
	placeholder?: string;

	/** Whether the field is required (cannot be empty) (Inquirer standard) */
	required?: boolean;
}

export interface ConfirmQuestion extends BaseQuestion<boolean> {
	type: 'confirm';

	/** Text for the "true" option - default: "Yes" (Clack-specific) */
	active?: string;

	/** Text for the "false" option - default: "No" (Clack-specific) */
	inactive?: string;
}

export interface Choice<T = any> {
	/** The value to return when selected */
	value: T;

	/** The label to display (name is Inquirer, label is Clack) */
	name?: string;
	label?: string;

	/** Additional hint text shown next to the option (Clack-specific) */
	hint?: string;

	/** Whether this option is initially selected - for checkbox/multiselect (Inquirer standard) */
	checked?: boolean;
}

export interface SelectQuestion<T = any> extends BaseQuestion<T> {
	type: 'list' | 'select' | 'rawlist';

	/** Available choices (Inquirer standard) */
	choices: (string | Choice<T>)[];

	/** Maximum number of items to display at once (Inquirer: pageSize, Clack: maxItems) */
	pageSize?: number;

	/** Alias for pageSize (Clack-specific) */
	maxItems?: number;
}

export interface CheckboxQuestion<T = any> extends BaseQuestion<T[]> {
	type: 'checkbox' | 'multiselect';

	/** Available choices (Inquirer standard) */
	choices: (string | Choice<T>)[];

	/** Whether at least one selection is required (Clack-specific) */
	required?: boolean;

	/** Maximum number of items to display at once (Inquirer: pageSize, Clack: maxItems) */
	pageSize?: number;

	/** Alias for pageSize (Clack-specific) */
	maxItems?: number;

	/** Initial cursor position index (Clack-specific) */
	cursorAt?: number;
}

export type PromptType =
	| 'input'
	| 'text'
	| 'password'
	| 'number'
	| 'confirm'
	| 'list'
	| 'select'
	| 'rawlist'
	| 'checkbox'
	| 'multiselect';

export type Question =
	| InputQuestion
	| PasswordQuestion
	| NumberQuestion
	| ConfirmQuestion
	| SelectQuestion
	| CheckboxQuestion
	| BaseQuestion;

export type QuestionCollection = Question | Question[];

/**
 * Summary of Clack-specific Extensions:
 * These options extend standard Inquirer functionality with Clack features:
 *
 * How Inquirer's 'default' is mapped:
 * - For text/input/number: Maps to initialValue (pre-filled in input, editable)
 * - For confirm: Maps to initialValue (pre-selected yes/no)
 * - For select: Maps to initialValue (pre-selected option)
 * - For checkbox: Maps to initialValues (pre-selected options)
 *
 * Input/Text/Password/Number prompts:
 * - placeholder: Placeholder text when input is empty (Clack-specific)
 * - initialValue: Pre-filled editable value (Clack-specific, overrides default)
 * - required: Field cannot be empty (Inquirer standard)
 *
 * Confirm prompts:
 * - active: Custom label for "yes" option (Clack-specific)
 * - inactive: Custom label for "no" option (Clack-specific)
 *
 * Select/List prompts:
 * - hint: Additional hint text on choices (Clack-specific)
 * - maxItems: Alias for pageSize (Clack naming)
 *
 * Checkbox/Multiselect prompts:
 * - hint: Additional hint text on choices (Clack-specific)
 * - required: Require at least one selection (Clack-specific)
 * - cursorAt: Initial cursor position (Clack-specific)
 * - maxItems: Alias for pageSize (Clack naming)
 *
 * Storage Support:
 * - store: Set to true to persist answers to generator config (.yo-rc.json)
 *   Automatically loads previous value as default and saves new answers
 *
 * Unsupported Inquirer options (for reference):
 * - transformer: Display transformation - clack handles this differently
 * - prefix/suffix: Custom prefixes - clack has its own styling
 * - askAnswered: Re-ask answered questions - not supported
 */
