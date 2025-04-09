# online-tools-box
- This is an REBUILD version which fork from IT-TOOLS, Respect!!!
- Fork from [it-tools](https://it-tools.tech/) and add some features.

## There are some update:
- Support SSR hosting.
- Add Base64 Tools.
- Add Crypto tools.

Useful tools for developer and people working in IT. [Have a look !](https://tool.zeeklog.com).

## Functionalities and roadmap

Please check the [issues](https://github.com/zeeklog/online-tools-box/issues) to see if some feature listed to be implemented.

You have an idea of a tool? Submit a [feature request](https://github.com/zeeklog/online-tools-box/issues/new/choose)!


### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

### Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

### Create a new tool

To create a new tool, there is a script that generate the boilerplate of the new tool, simply run:

```sh
pnpm run script:create:tool my-tool-name
```

It will create a directory in `src/tools` with the correct files, and a the import in `src/tools/index.ts`. You will just need to add the imported tool in the proper category and develop the tool.

## Contributors

Big thanks to all the people who have already contributed!

[![contributors](https://contrib.rocks/image?repo=corentinth/it-tools)](https://github.com/zeeklog/it-tools/graphs/contributors)

## Credits

Coded with ❤️ by [Ne0inHK](https://x.com/Ne0inHK). Fork from [it-tools](https://it-tools.tech/) and add some features.

This project is continuously deployed using [vercel.com](https://vercel.com).

Contributor graph is generated using [contrib.rocks](https://contrib.rocks/preview?repo=zeeklog/online-tools-box).

## License

This project is under the [GNU GPLv3](LICENSE).
