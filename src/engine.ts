import {
  languages,
  Uri,
  window,
  workspace,
  WorkspaceConfiguration,
} from "coc.nvim";
import { spawn } from "cross-spawn";
import isEqual from "lodash.isequal";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver-protocol";
import { TextDocument } from "vscode-languageserver-textdocument";

// Results format when "--format json" is supplied
interface CfnLintDiagnostic {
  Filename: string;
  Level: string;
  Location: {
    Start: {
      ColumnNumber: number;
      LineNumber: number;
    };
    End: {
      ColumnNumber: number;
      LineNumber: number;
    };
    Path: string[];
  };
  Message: string;
  Rule: {
    Description: string;
    Id: string;
    ShortDescription: string;
    Source: string;
  };
}

export class CfnLintEngine {
  private readonly source = "cfn-lint";
  private outputChannel = window.createOutputChannel(this.source);
  private diagnosticCollection = languages.createDiagnosticCollection(
    this.source
  );
  private projectRootDir = "";
  private latestDiagnostics: object[] = [];

  public async init() {
    // Load project root directory
    this.projectRootDir = workspace.root;
    this.outputLine(
      `Using ${this.projectRootDir} as the working directory to execute cfn-lint`
    );
  }

  public lint(document: TextDocument) {
    const pathToLint = Uri.parse(document.uri).fsPath;
    if (!this.isValidCloudFormation(document.getText(), pathToLint)) {
      return;
    }
    this.outputLine(`Linting ${pathToLint}...`);

    // Execute cfn-lint in child process
    const cmd: string = this.getConfig().path;
    const args = this.buildCmdArgs(pathToLint);
    this.outputLine(`Executing '${cmd} ${args.join(" ")}'`);
    const child = spawn(cmd, args, {
      shell: true,
      // Execute from project root to ensure any .cfnlintrc, .cflintrc.yaml,
      // or .cfnlintrc.yml configuration files are detected by cfn-lint
      cwd: this.projectRootDir,
    });

    const diagnostics: Diagnostic[] = [];

    child.on("error", (err: Error) => {
      const msg =
        "Error: unable to start cfn-lint. Is cfn-lint installed corectly?";
      this.outputLine(`${msg}\n${err.stack}`);
      diagnostics.push({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: Number.MAX_VALUE },
        },
        severity: DiagnosticSeverity.Error,
        message: "[cfn-lint] " + msg,
        source: this.source,
      });
    });

    let didError = false;
    child.stderr.on("data", (data: Buffer) => {
      didError = true;
      this.outputLine(data.toString());
      diagnostics.push({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: Number.MAX_VALUE },
        },
        severity: DiagnosticSeverity.Error,
        message: "[cfn-lint] Error occurred. See :CocInfo for details",
        source: this.source,
      });
    });

    let stdout = "";
    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.on("exit", (code: number) => {
      this.outputLine(`cfn-lint exited with code ${code}`);
      if (didError) return;
      let results: CfnLintDiagnostic[] = JSON.parse(stdout);
      const numResults = results.length;
      this.outputLine(`cfn-lint returned ${numResults} results`);

      results = this.filterResults(results);
      const numFilteredResults = results.length;
      if (numResults !== numFilteredResults) {
        this.outputLine(
          `Filtered to ${numFilteredResults} results after applying \"cfnlint.ignoreRulesRegExps\"`
        );
      }

      results.forEach((result) => {
        const startLineNum = result.Location.Start.LineNumber - 1;
        const startColNum = result.Location.Start.ColumnNumber - 1;
        const endLineNum = result.Location.End.LineNumber - 1;
        const endColNum = result.Location.End.ColumnNumber - 1;
        const lintErr = {
          range: {
            start: { line: startLineNum, character: startColNum },
            end: { line: endLineNum, character: endColNum },
          },
          severity: this.convertSeverity(result.Level),
          message: `[cfn-lint] ${result.Rule.Id}: ${result.Message}`,
          source: this.source,
        };
        diagnostics.push(lintErr);
      });
    });

    child.on("close", () => {
      if (!isEqual(this.latestDiagnostics, diagnostics)) {
        this.outputLine(`Lint results have changed. Refreshing collection`);
        this.latestDiagnostics = diagnostics;
        this.diagnosticCollection.set([[document.uri, diagnostics]]);
      }
    });
  }

  private buildCmdArgs(pathToLint: string): string[] {
    const args = ["--format", "json"];
    const config: WorkspaceConfiguration = this.getConfig();

    // Maps between user settings and CLI args
    const settingsMap = [
      {
        type: "string[]",
        from: "regions",
        to: "--regions",
      },
      {
        type: "boolean",
        from: "ignoreBadTemplate",
        to: "--ignore-bad-template",
      },
      {
        type: "string[]",
        from: "includeRules",
        to: "--include-checks",
      },
      {
        type: "string[]",
        from: "ignoreRules",
        to: "--ignore-checks",
      },
      {
        type: "string[]",
        from: "customRules",
        to: "--append-rules",
      },
      {
        type: "boolean",
        from: "includeExperimentalRules",
        to: "--include-experimental",
      },
      {
        type: "string[]",
        from: "ruleConfigurations",
        to: "--configure-rule",
      },
      {
        type: "string",
        from: "overrideSpecPath",
        to: "--override-spec",
      },
    ];

    settingsMap.forEach((setting) => {
      const { from, to, type } = setting;
      const input = config[from];
      switch (type) {
        case "string[]":
          if (input && input.length && !input.includes("")) {
            args.push(...[to, ...input]);
          }
          break;
        case "string":
          if (input) {
            args.push(...[to, input]);
          }
          break;
        case "boolean":
          if (input) {
            args.push(to);
          }
          break;
        default:
          throw new Error(`Unsupported type "${type}"`);
      }
    });

    args.push(...["--", `"${pathToLint}"`]);
    return args;
  }

  private getConfig(): WorkspaceConfiguration {
    return workspace.getConfiguration("cfnlint");
  }

  private outputLine(message: string) {
    if (this.outputChannel) {
      this.outputChannel.appendLine(
        `[${new Date().toLocaleTimeString()}] ${message}`
      );
    }
  }

  private convertSeverity(level: string): DiagnosticSeverity {
    switch (level) {
      case "Informational":
        return DiagnosticSeverity.Information;
      case "Warning":
        return DiagnosticSeverity.Warning;
      case "Error":
        return DiagnosticSeverity.Error;
      default:
        throw new Error(
          `Unsupported severity returned by cfn-lint: "${level}"`
        );
    }
  }

  private isValidCloudFormation(text: string, path: string): boolean {
    if (this.isStandardCloudFormation(text, path)) return true;
    if (this.isCustomCloudFormation(text, path)) return true;

    this.outputLine(
      `Skipped linting ${path} because (1) it doesn't look like a standard CloudFormation or SAM template; (2) none of the RegExps defined in the setting "cfnlint.detectCfnRegExps" matched`
    );
    return false;
  }

  private isStandardCloudFormation(text: string, path: string): boolean {
    const containsVersion = /"?AWSTemplateFormatVersion"?\s*/.exec(text);
    const containsResources = /\n?"?Resources"?\s*:/.exec(text);
    if (containsVersion && containsResources) {
      this.outputLine(
        `Detected CloudFormation file ${path} because it contains "AWSTemplateFormatVersion:" and "Resources:"`
      );
      return true;
    }
    return false;
  }

  private isCustomCloudFormation(text: string, path: string): boolean {
    const cfnRegExps: string[] = this.getConfig().detectCfnRegExps;
    if (cfnRegExps && cfnRegExps.length) {
      for (const regExpStr of cfnRegExps) {
        const regExp = new RegExp(regExpStr, "i");
        if (regExp.test(text)) {
          this.outputLine(
            `Detected CloudFormation file ${path} because RegExp /${regExpStr}/ in setting "cfnlint.detectCfnRegExps" matched`
          );
          return true;
        }
      }
    }
    return false;
  }

  private filterResults(results: CfnLintDiagnostic[]): CfnLintDiagnostic[] {
    const ignoreRulesRegExps: string[] = this.getConfig().ignoreRulesRegExps;
    if (!ignoreRulesRegExps || !ignoreRulesRegExps.length) {
      // Skip filtering
      return results;
    }

    const regExps: RegExp[] = ignoreRulesRegExps.map(
      (regExpStr) => new RegExp(regExpStr, "i")
    );
    results = results.filter((result) => {
      for (const regExp of regExps) {
        if (regExp.test(result.Message)) {
          return false;
        }
      }
      return true;
    });
    return results;
  }
}
