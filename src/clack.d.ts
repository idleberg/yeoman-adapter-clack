import type {
	ConfirmOptions as ClackConfirmOptions,
	MultiSelectOptions as ClackMultiSelectOptions,
	PasswordOptions as ClackPasswordOptions,
	SelectOptions as ClackSelectOptions,
	TextOptions as ClackTextOptions,
} from '@clack/prompts';

type When = boolean | ((answers: any) => boolean | Promise<boolean>);

export interface ConfirmOptions extends ClackConfirmOptions {
	name: string;
	type: 'confirm';
	when?: When;
	store?: boolean;
}

export interface MultiSelectOptions<Value = any> extends ClackMultiSelectOptions<Value> {
	name: string;
	type: 'multiselect';
	when?: When;
	store?: boolean;
}

export interface SelectOptions<Value = any> extends ClackSelectOptions<Value> {
	name: string;
	type: 'select';
	when?: When;
	store?: boolean;
}

export interface TextOptions extends ClackTextOptions {
	name: string;
	type: 'text';
	when?: When;
	store?: boolean;
}

export interface PasswordOptions extends ClackPasswordOptions {
	name: string;
	type: 'password';
	when?: When;
	store?: boolean;
}

export interface AutocompleteOptions extends ClackSelectOptions {
	name: string;
	type: 'autocomplete';
	when?: When;
	store?: boolean;
}

export interface AutocompleteMultiSelectOptions extends ClackMultiSelectOptions {
	name: string;
	type: 'autocompleteMultiselect';
	when?: When;
	store?: boolean;
}

export type ClackPromptOptions = ConfirmOptions | MultiSelectOptions | PasswordOptions | SelectOptions | TextOptions;

export interface ClackPromptResult {
	[key: string]: any;
}
