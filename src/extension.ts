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

  async function getJsonFile<T>(path: string) {
    const fileBuffer = await readFile(path);
    const data = JSON.parse(fileBuffer.toString()) as T;
    return data;
  }

  async function getPackageJson() {
    const packageJson = await getJsonFile<PackageJson>(`${cwd}/package.json`);
    return packageJson;
  }

  async function getConfigJson() {
    const config = await getJsonFile<Scripts>(`${cwd}/script-buttons.json`);
    return config;
  }

  function createErrorMessage() {
    createStatusBarItem(`$(circle-slash) Script Buttons`, `No scripts found!`, undefined);
  }

  function createRefreshButton() {
    createStatusBarItem(
      '$(refresh)',
      'Script Buttons: Refetches the scripts from your package.json file',
      'script-buttons.refreshScripts',
    );
  }

  function createScriptButtonsAndCommands(scripts: Scripts, isNpm = false) {
    for (const name in scripts) {
      const vscCommand = `script-buttons.${isNpm && 'npm-'}${name.replace(' ', '')}`;
      const command = isNpm ? `npm run ${name}` : scripts[name];

      const commandDisposable = vscode.commands.registerCommand(vscCommand, async () => {
        let terminal = terminals[vscCommand];

        if (terminal) {
          delete terminals[vscCommand];
          terminal.dispose();
        }

        terminal = vscode.window.createTerminal({
          name,
          cwd,
        });

        terminals[vscCommand] = terminal;

        terminal.show(true);
        terminal.sendText(command);
      });

      addDisposable(commandDisposable);

      const color = isNpm ? 'white' : undefined;
      createStatusBarItem(name, command, vscCommand, color);
    }
  }

  async function init() {
    cleanup();
    registerCommands();
    createRefreshButton();

    let scripts: Scripts = {};

    try {
      const packageJson = await getPackageJson();
      console.log('Loaded package.json!');

      createScriptButtonsAndCommands(packageJson.scripts, true);
      scripts = { ...scripts, ...packageJson.scripts };
    } catch {
      console.log('No package.json found!');
    }

    try {
      const configScripts = await getConfigJson();
      console.log('Loaded script-buttons.json!');

      createScriptButtonsAndCommands(configScripts);
      scripts = { ...scripts, ...configScripts };
    } catch {
      console.log('No script-buttons.json found!');
    }

    if (!Object.keys(scripts).length) {
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
