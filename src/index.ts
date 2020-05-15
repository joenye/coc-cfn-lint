import {
  ConfigurationChangeEvent,
  Document,
  events,
  ExtensionContext,
  workspace,
} from "coc.nvim";
import {
  DidChangeTextDocumentParams,
  TextDocument,
} from "vscode-languageserver-protocol";
import { CfnLintEngine } from "./engine";

let documentVersion = 0;
const engine = new CfnLintEngine();
const config = workspace.getConfiguration("cfnlint");

function didOpenTextDocument(document: TextDocument) {
  if (config.get<boolean>("lintOnOpen")) {
    engine.lint(document);
  }
}

async function didChangeTextDocument(params: DidChangeTextDocumentParams) {
  if (!config.get<boolean>("lintOnChange")) {
    return;
  }

  if (
    params.textDocument.version &&
    documentVersion !== params.textDocument.version
  ) {
    documentVersion = params.textDocument.version;
    const { document } = await workspace.getCurrentState();
    engine.lint(document);
  }
}

function didSaveTextDocument(document: TextDocument) {
  if (config.get<boolean>("lintOnSave")) {
    engine.lint(document);
  }
}

async function didChangeConfiguration(event: ConfigurationChangeEvent) {
  if (!event.affectsConfiguration('cfnlint')) return
  for (const document of workspace.textDocuments) {
    engine.lint(document);
  }
}

export async function activate(context: ExtensionContext): Promise<void> {
  await engine.init();

  context.subscriptions.push(
    workspace.onDidOpenTextDocument(didOpenTextDocument),
    workspace.onDidChangeTextDocument(didChangeTextDocument),
    workspace.onDidSaveTextDocument(didSaveTextDocument),
    workspace.onDidChangeConfiguration(didChangeConfiguration),

    events.on("BufEnter", (bufnr) => {
      if (!bufnr) {
        return;
      }
      const doc = workspace.getDocument(bufnr);
      if (!doc) {
        return;
      }

      didOpenTextDocument(doc.textDocument);
    })
  );

  workspace.documents.map((doc: Document) => {
    didOpenTextDocument(doc.textDocument);
  });
}
