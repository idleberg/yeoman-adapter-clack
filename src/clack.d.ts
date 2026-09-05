import type {
	AutocompleteMultiSelectOptions as ClackAutocompleteMultiSelectOptions,
	AutocompleteOptions as ClackAutocompleteOptions,
	ConfirmOptions as ClackConfirmOptions,
	DateOptions as ClackDateOptions,
	GroupMultiSelectOptions as ClackGroupMultiSelectOptions,
	MultiLineOptions as ClackMultiLineOptions,
	MultiSelectOptions as ClackMultiSelectOptions,
	PasswordOptions as ClackPasswordOptions,
	PathOptions as ClackPathOptions,
	SelectKeyOptions as ClackSelectKeyOptions,
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

export interface AutocompleteOptions<Value = any> extends ClackAutocompleteOptions<Value> {
	name: string;
	type: 'autocomplete';
	when?: When;
	store?: boolean;
}

export interface AutocompleteMultiSelectOptions<Value = any> extends ClackAutocompleteMultiSelectOptions<Value> {
	name: string;
	type: 'autocompleteMultiselect';
	when?: When;
	store?: boolean;
}

export interface ExpandOptions<Value = any> extends ClackSelectOptions<Value> {
	name: string;
	type: 'expand';
	when?: When;
	store?: boolean;
}

export interface DateOptions extends ClackDateOptions {
	name: string;
	type: 'date';
	when?: When;
	store?: boolean;
}

export interface MultiLineOptions extends ClackMultiLineOptions {
	name: string;
	type: 'multiline';
	when?: When;
	store?: boolean;
}

export interface PathOptions extends ClackPathOptions {
	name: string;
	type: 'path';
	when?: When;
	store?: boolean;
}

export interface GroupMultiSelectOptions<Value = any> extends ClackGroupMultiSelectOptions<Value> {
	name: string;
	type: 'groupMultiselect';
	when?: When;
	store?: boolean;
}

export interface SelectKeyOptions<Value extends string = string> extends ClackSelectKeyOptions<Value> {
	name: string;
	type: 'selectKey';
	when?: When;
	store?: boolean;
}

export type ClackPromptOptions =
	| AutocompleteOptions
	| AutocompleteMultiSelectOptions
	| ConfirmOptions
	| DateOptions
	| ExpandOptions
	| GroupMultiSelectOptions
	| MultiLineOptions
	| MultiSelectOptions
	| PasswordOptions
	| PathOptions
	| SelectKeyOptions
	| SelectOptions
	| TextOptions;

export interface ClackPromptResult {
	[key: string]: any;
}
