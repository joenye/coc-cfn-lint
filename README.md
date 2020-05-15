# coc-cfn-lint

[coc.nvim][] extension for [cfn-python-lint[].

## Requirements

- [coc.nvim][]
- [cfn-python-lint][]

## Install

Inside Vim/Neovim, run:

```vim
:CocInstall coc-cfn-lint
```

## Features

- Linting for JSON/YAML CloudFormation files

## Configuration

This extension supports these top-level settings keys:

| Setting | Default | Description
| ------- | ------- | ----------- |
| `cfnlint.path` | `"cfn-lint"` | Path to cfn-lint
| `cfnlint.lintOnOpen` | `true` | Whether to enable linting upon opening a valid CloudFormation JSON/YAML file
| `cfnlint.lintOnSave` | `true` | Whether to enable linting upon saving a valid CloudFormation JSON/YAML file
| `cfnlint.lintOnChange` | `true` | Whether to enable linting upon changing a valid CloudFormation JSON/YAML file
| `cfnlint.detectCfnRegExps` | `[]` | Array of RegExp strings. If any of these match against JSON/YAML file contents, then linting will proceed as the file will be determined a CloudFormation file. If provided, these RegExps are tested before any built-in checks, which look for a standard CloudFormation/SAM template
| `cfnlint.ignoreRulesRegExps` | `[]` | Array of RegExp strings. Used to filter cfn-lint results (in addition to "cfnlint.config.ignoreRules") based on message contents. If a lint message matches one of these rules, that result is ignored

It also supports a nested 

| `cfnlint.awsRegions` | `[]` | Array of AWS regions to test against. Defaults to all regions. This is useful because some rules (such as "E3001") check whether resources are supported in the given regions
| `cfnlint.ignoreBadTemplate` | `false` | Whether to ignore bad template errors
| `cfnlint.ignoreRules` | `[]` | Array of rule ID prefixes to ignore (e.g. ["E3", "E1029"])
| `cfnlint.includeRules` | `[]` | Array of rule ID prefixes to include. Some checks, such as Informational checks (beginning with "I") are disabled by default, and can be enabled by setting this to ["I"]
| `cfnlint.customRules` | `[]` | Array of paths containing additional rules. These can be either directories containing Python file(s), or an import path to a Python module 
| `cfnlint.includeExperimentalRules` | `false` | Whether to include experimental rules
| `cfnlint.ruleConfigurations` | `[]` | Array of rule configurations (e.g. ["E3012:strict=false"]
| `cfnlint.overrideSpecPath` | `null` | Path to a CloudFormation resource specification override file

## FAQ

TODO

## License

MIT
