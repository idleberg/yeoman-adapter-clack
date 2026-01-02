# yeoman-adapter-clack

> Just my personal package template.

[![License](https://img.shields.io/github/license/idleberg/yeoman-adapter-clack?color=blue&style=for-the-badge)](https://github.com/idleberg/yeoman-adapter-clack/blob/main/LICENSE)
[![Version: npm](https://img.shields.io/npm/v/@idleberg/yeoman-adapter-clack?style=for-the-badge)](https://www.npmjs.org/package/@idleberg/yeoman-adapter-clack)
![GitHub branch check runs](https://img.shields.io/github/check-runs/idleberg/yeoman-adapter-clack/main?style=for-the-badge)

A Yeoman adapter that replaces `inquirer` as dialog library with
`@clack/prompts`.

## Installation 💿

```shell
npm install yeoman-adapter-clack
```

## Usage 🚀

To make use of this adapter, you need to overwrite the default one.

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

> [!NOTICE]
> For easy migration, you can import `ClackCompatAdapter` instead, it works as
> drop-in replacement.

## License ©️

This work is licensed under [The MIT License](LICENSE).
