# yeoman-adapter-clack

> A Yeoman adapter that replaces `inquirer` with `@clack/prompts` as the default
> prompt library.

[![License](https://img.shields.io/github/license/idleberg/yeoman-adapter-clack?color=blue&style=for-the-badge)](https://github.com/idleberg/yeoman-adapter-clack/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/@idleberg/yeoman-adapter-clack?style=for-the-badge)](https://www.npmjs.org/package/@idleberg/yeoman-adapter-clack)
![GitHub branch check runs](https://img.shields.io/github/check-runs/idleberg/yeoman-adapter-clack/main?style=for-the-badge)

## Installation 💿

```shell
npm install yeoman-adapter-clack
```

## Usage 🚀

To make use of this adapter, you need to overwrite the default one.

> [!TIP]
>
> For easy migration, you can import `ClackCompatAdapter` instead. Unlike the
> default adapter, it's API-compatible with Inquirer.

```typescript
import { ClackAdapter } from "yeoman-adapter-clack";
import { createEnv } from "yeoman-environment";
import Generator from "yeoman-generator";

export default class extends Generator {
	constructor(args, options) {
		if (options.env) {
			const adapter = options.env.adapter;
			const isTestAdapter = adapter.constructor.name === "TestAdapter";

			if (!isTestAdapter && !(adapter instanceof ClackAdapter)) {
				options.env.adapter = new ClackAdapter();
			}
		} else {
			options.env = createEnv({ adapter: new ClackAdapter() });
		}

		super(args, options);
	}
}
```

### API ⚙️

#### `ClackAdapter`

Usage: `new ClackAdapter()`

The default adapter implements its own API for prompts. It's basically follows
[Clack prompt API](https://bomb.sh/docs/clack/packages/prompts/) with additional
properties based on the default
[Yeoman prompt API](https://yeoman.io/authoring/user-interactions).

**Example**

```typescript
const answers = await this.prompt([
	{
		// Required adapter-specific properties
		type: "text",
		name: "userName",

		// Standard Clack API
		message: "What is your name?",
		placeholder: "John Appleseed",
		validate: (value) => {
			if (value.length < 2) return "Name must be at least 2 characters";
			return undefined;
		},

		// Optional adapter-specific properties
		store: true,
		when: () => true,
	},
]);
```

Supported types are `autocomplete`, `autocompleteMultiselect`, `confirm`,
`multiselect`, `password`, `select` and `text`. For backwards-compatibility,
there is also an `expand` type matching the behavior of
[Inquirer](https://www.npmjs.com/package/@inquirer/expand).

For details, please check the
[type signatures](https://github.com/idleberg/yeoman-adapter-clack/blob/main/src/clack.d.ts).

#### `ClackCompatAdapter`

Usage: `new ClackCompatAdapter()`

This adapter provides an Inquirer-compatible prompt API, see the official
[Yeoman documentation](https://yeoman.io/authoring/user-interactions).

## License ©️

This work is licensed under [The MIT License](LICENSE).
