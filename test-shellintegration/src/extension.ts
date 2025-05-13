import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "test-shellintegration.runCommands",
    async () => {
      try {
        await runCommand("echo 'Hello, World!'");
        await runCommand("ls -la");
        await runCommand("pwd");
      } catch (error) {
        console.error("Error running commands:", error);
        vscode.window.showErrorMessage("Failed to run commands.");
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

async function runCommand(command: string): Promise<void> {
  const terminal = await getTerminal();
  const shellIntegration = terminal.shellIntegration;
  if (!shellIntegration) {
    throw new Error("Shell integration is not available.");
  }

  return new Promise((resolve, reject) => {
    console.log(`${command} - Running command...`);
    const execution = shellIntegration.executeCommand(command);

    if (!execution) {
      reject(new Error("Failed to execute command."));
      return;
    }

    const listener = vscode.window.onDidEndTerminalShellExecution((e) => {
      if (e.execution === execution) {
        if (e.exitCode === 0) {
          console.log(`${command} - Command executed successfully.`);
          resolve();
        } else {
          console.error(
            `${command} - Command failed with exit code ${e.exitCode}.`
          );
          reject(new Error(`Command failed with exit code ${e.exitCode}`));
        }
        listener.dispose();
      }
    });

    setTimeout(() => {
      console.error(
        `${command} - Command execution timed out after 5 seconds.`
      );
      reject(new Error("Command execution timed out after 5 seconds."));
      listener.dispose();
    }, 5000);
  });
}

let terminal: vscode.Terminal | undefined;
async function getTerminal(): Promise<vscode.Terminal> {
  if (terminal) {
    return Promise.resolve(terminal);
  }

  terminal = vscode.window.createTerminal({
    name: "Shell Integration",
  });
  terminal.show();

  return new Promise((resolve, reject) => {
    const listener = vscode.window.onDidChangeTerminalShellIntegration((e) => {
      if (e.terminal === terminal) {
        // Shell integration is now available for this terminal
        resolve(e.terminal);
        listener.dispose();
      }
    });

    setTimeout(() => {
      reject(
        new Error("Failed to get terminal shell integration after 5 seconds.")
      );
      listener.dispose();
    }, 5000);
  });
}
