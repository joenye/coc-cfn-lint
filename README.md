# coc-cfn-lint

Coc ([coc.nvim](https://github.com/neoclide/coc.nvim)) extension for [cfn-python-lint](https://github.com/aws-cloudformation/cfn-python-lint).

[![version](https://img.shields.io/npm/v/coc-cfn-lint)](https://npmjs.org/package/coc-cfn-lint "View this project on npm")
[![license](https://img.shields.io/npm/l/coc-cfn-lint)](./LICENSE "View this project's LICENSE")

## Requirements

- [coc.nvim](https://github.com/neoclide/coc.nvim)
- [cfn-python-lint](https://github.com/aws-cloudformation/cfn-python-lint)

## Install

Inside Vim/Neovim, run:

```vim
:CocInstall coc-cfn-lint
```

## Features

- Lints JSON/YAML [CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html) or [SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html) templates upon open/save
  - Will attempt to run `cfn-lint` from your [project root directory](https://github.com/neoclide/coc.nvim/wiki/Using-workspaceFolders#resolve-workspace-folder), in order to detect any project-specific configuration (`.cfnlintrc`, `.cfnlintrc.yaml`, or `.cfnlintrc.yml`)

## Configuration

This extension can be configured via these top-level configuration items. Live reload of settings is also supported, which means you can change these settings without needing to reload the file/editor.


| Setting | Default | Description
| ------- | ------- | ----------- |
| `cfnlint.path` | `"cfn-lint"` | Path to cfn-lint
| `cfnlint.lintOnOpen` | `true` | Enable linting upon opening a valid CloudFormation JSON/YAML file
| `cfnlint.lintOnSave` | `true` | Enable linting upon saving a valid CloudFormation JSON/YAML file
| `cfnlint.detectCfnRegExps` | `[]` | Array of RegExp strings. If any of these match in a JSON/YAML file, that file will be linted. This can be useful to detect non-standard CloudFormation/SAM templates, as the built-in checks look for a standard CloudFormation/SAM template
| `cfnlint.ignoreRulesRegExps` | `[]` | Array of RegExp strings. If any of these match a cfn-lint result message, that result is ignored. This can be useful alongside `cfnlint.ignoreRules`
| `cfnlint.awsRegions` | `[]` | Array of AWS regions to test against. Defaults to all regions. This is useful because certain rules (such as "E3001") check whether resources are supported in the given regions
| `cfnlint.ignoreBadTemplate` | `false` | Ignore bad template errors
| `cfnlint.ignoreRules` | `[]` | Array of rule ID prefixes to ignore (e.g. ["E3", "E1029"])
| `cfnlint.includeRules` | `[]` | Array of rule ID prefixes to include. Some checks, such as Informational checks (beginning with "I") are disabled by default, and can be enabled by setting this to ["I"]
`cfnlint.customRules` | `[]` | Array of paths containing additional rules. These can be either directories containing Python file(s), or an import path to a Python module
| `cfnlint.includeExperimentalRules` | `false` | Whether to include experimental rules
| `cfnlint.ruleConfigurations` | `[]` | Array of rule configurations (e.g. ["E3012:strict=false"]
| `cfnlint.overrideSpecPath` | `null` | Path to a CloudFormation resource specification override file

## License

MIT
