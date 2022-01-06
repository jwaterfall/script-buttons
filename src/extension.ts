import { promises as fsPromises } from 'fs';
import vscode from 'vscode';
import { workspace } from 'vscode';
import { Disposable, PackageJson, Scripts } from './types';

const { readFile } = fsPromises;

export function activate(context: vscode.ExtensionContext) {
  const disposables: Disposable[] = [];
  const terminals: { [name: string]: vscode.Terminal } = {};
  const cwd = getWorkspaceFolderPath();

  function addDisposable(disposable: Disposable) {
    context.subscriptions.push(disposable);
    disposables.push(disposable);
  }

  function cleanup() {
    disposables.forEach((disposable) => disposable.dispose());
  }

  function createStatusBarItem(text: string, tooltip?: string, command?: string, color?: string) {
    const item = vscode.window.createStatusBarItem(1, 0);
    item.text = text;
    item.command = command;
    item.tooltip = tooltip;
    item.color = color;

    addDisposable(item);
    item.show();

    return item;
  }

  function getWorkspaceFolderPath() {
    const workspaceFolder = workspace.workspaceFolders?.[0];
    const path = workspaceFolder?.uri.fsPath;
    return path;
  }

  async function getPackageJson() {
    const fileBuffer = await readFile(`${cwd}/package.json`);
    const packageJson = JSON.parse(fileBuffer.toString()) as PackageJson;
    return packageJson;
  }

  function createErrorMessage() {
    createStatusBarItem(`$(circle-slash) Script Buttons`, `No package.json found!`, undefined);
  }

  function createRefreshButton() {
    createStatusBarItem(
      '$(refresh)',
      'Script Buttons: Refetches the scripts from your package.json file',
      'script-buttons.refreshScripts',
    );
  }

  function createScriptButtonsAndCommands(scripts: Scripts) {
    for (const name in scripts) {
      const command = `script-buttons.${name.replace(' ', '')}`;

      const commandDisposable = vscode.commands.registerCommand(command, async () => {
        let terminal = terminals[command];

        if (terminal) {
          delete terminals[command];
          terminal.dispose();
        }

        terminal = vscode.window.createTerminal({
          name,
          cwd,
        });

        terminals[command] = terminal;

        terminal.show(true);
        terminal.sendText(`npm run ${name}`);
      });

      addDisposable(commandDisposable);
      createStatusBarItem(name, name, command);
    }
  }

  async function init() {
    cleanup();
    registerCommands();
    createRefreshButton();

    try {
      const packageJson = await getPackageJson();
      console.log('Loaded package.json!');

      const { scripts } = packageJson;

      createScriptButtonsAndCommands(scripts);
    } catch {
      console.log('No package.json found!');
      createErrorMessage();
    }
  }

  function registerCommands() {
    const refreshScriptsDisposable = vscode.commands.registerCommand(
      'script-buttons.refreshScripts',
      () => {
        init();
      },
    );

    addDisposable(refreshScriptsDisposable);
  }

  init();
}

export function deactivate() {}
