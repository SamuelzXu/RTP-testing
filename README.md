# Replicant RTP Challenge

Hello. If you're reading this, it means you've made it part way through Replicant's hiring process. Congratulations and welcome! This next bit should be fun. 🙂

This repository contains a bare-bones RTP audio recorder, and a tool for testing that recorder. The rest of this document describes how to work with the tooling in this repository. For your challenge, we are asking you to make certain changes to this code; the precise nature of the changes depends on the role that you're applying for. You should have received those details in a separate email; if not, reach out to your hiring manager for help.

## Quick Start

Note: This guide assumes that you are on OS X or another unixlike. It _should_ work much the same on a Windows machine, but this has not been tested.

You will need a node.js version of 12.9.0 or higher. We recommend using a tool, such as [nodenv](https://github.com/nodenv/nodenv) or [nvm](https://github.com/nvm-sh/nvm), to manage your installed node versions.

To install dependencies, run

```
npm install
```

The easiest way to explain what this repository does is with a demo. Look inside the `data` directory; you should see a single file, `input.ulaw`. In one terminal tab, run

```
npm run receive
```

and in another one, run

```
npm run transmit
```

The transmitter will read the data from `input.ulaw` and send it as a stream of RTP packets to the receiver, in real time. When all of the data is transmitter (this will take a few seconds), both processes will shut themselves down, and the receiver will write an `output.ulaw` file to the `data` directory. The two files should be identical.

(If you're on OS X or another unixlike, you can verify this by running `cmp data/input.ulaw data/output.ulaw`. If the files are identical, `cmp` will output nothing. If they differ — you can force this by e.g. commenting out line 33 in the receiver — `cmp` will print a message indicating the location of the first difference.)

## Code structure

In the `src` directory, you will find three source files:

- `receiver.ts` contains the code that powers `npm run receive`. You will need to modify (or replace) this code to solve the challenge.

- `transmitter.ts` contains the code that powers `npm run transmit`. You will most likely want to modify (or replace) this code to sole the challenge.

- `rtp-packet.ts` contains a utility class that implements encoding and decoding RTP packets. **You should not have to modify this code,** although you may do so if you have a good reason for it.

## Linting and formatting

To automatically fix all code formatting issues and some code quality issues (while warning on ones that can't be automatically fixed), run

```
npm run fix
```

This repo uses [prettier](https://prettier.io) to check the format of the code, and [eslint](https://eslint.org) to check the semantics of the code, following the advice laid out in [Prettier vs. Linters](https://prettier.io/docs/en/comparison.html). (With one exception: we use eslint to enforce a consistent import order, for reasons outlined [in this issue thread](https://github.com/prettier/prettier/issues/949).)

You can run `npm run fix` to run both prettier and eslint, or `npm run fix:prettier` / `npm run fix:eslint` to run just one of them. You can also run `npm run lint` to check issues without fixing them.

## Unit testing

This repo uses [jest](https://jestjs.io/) as a test runner. A simple example unit test is provided. You can run tests using `npm run test`. You can add additional tests simply by adding files ending with `.test.ts` in the `src` directory.
