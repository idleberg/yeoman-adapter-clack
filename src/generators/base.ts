import { intro, outro } from '@clack/prompts';
import type { TerminalAdapter } from '@yeoman/adapter';
import { createEnv } from 'yeoman-environment';
import type { BaseOptions, Storage } from 'yeoman-generator';
import Generator from 'yeoman-generator';

/**
 * Base generator class that provides shared functionality for Clack-based generators.
 *
 * This abstract class handles:
 * - Adapter setup and initialization
 * - Intro/outro message setters
 * - Storage utilities for persisting answers
 */
export abstract class ClackBaseGenerator extends Generator {
	constructor(AdapterClass: typeof TerminalAdapter, args?: string | string[], opts?: BaseOptions) {
		const options: BaseOptions = opts || ({} as BaseOptions);

		if (options.env) {
			const adapter = options.env.adapter;
			const isTestAdapter = adapter.constructor.name === 'TestAdapter';

			if (!isTestAdapter && !(adapter instanceof AdapterClass)) {
				options.env.adapter = new AdapterClass();
			}
		} else {
			options.env = createEnv({ adapter: new AdapterClass() });
		}

		super(args || [], options);
	}

	/**
	 * Set the intro message for the generator session.
	 */
	setIntroText(message: string) {
		intro(message);
	}

	/**
	 * Set the outro message for the generator session.
	 */
	setOutroText(message: string) {
		outro(message);
	}

	/**
	 * Load stored defaults for questions that have the `store` flag set.
	 *
	 * @param questions Array of questions
	 * @param storage Optional storage object or property name
	 * @returns Questions array with stored defaults applied
	 */
	protected loadStoredDefaults<Q extends { name: string; store?: boolean }>(
		questions: Q[],
		storage?: Storage | string,
	): Q[] {
		const storageObj = this.getStorageObject(storage);

		return questions.map((q) => {
			if (q.store && storageObj) {
				const storedValue = storageObj.get(q.name);

				if (storedValue !== undefined) {
					return { ...q, default: storedValue };
				}
			}
			return q;
		});
	}

	/**
	 * Save answers for questions that have the `store` flag set.
	 *
	 * @param questions Array of questions
	 * @param answers The answers object
	 * @param storage Optional storage object or property name
	 */
	protected saveAnswers<Q extends { name: string; store?: boolean }>(
		questions: Q[],
		answers: Record<string, any>,
		storage?: Storage | string,
	): void {
		const storageObj = this.getStorageObject(storage);

		questions.forEach((q) => {
			if (q.store && storageObj && answers[q.name] !== undefined) {
				storageObj.set(q.name, answers[q.name]);
			}
		});
	}

	/**
	 * Get the storage object to use for persisting answers.
	 *
	 * @param storage Optional storage object or property name
	 * @returns The storage object to use
	 */
	private getStorageObject(storage?: Storage | string): Storage | undefined {
		if (storage === undefined) {
			return this.config;
		}

		if (typeof storage === 'string') {
			return (this as any)[storage];
		}

		return storage;
	}
}
