const vscode = require('vscode');

function activate(context) {
    console.log('Exam Chat Blocker is active');
    
    // Intercept chat commands
    const blockedCommands = [
        'workbench.action.chat.open',
        'workbench.action.chat.openInNewWindow',
        'inlineChat.start',
        'github.copilot.chat.open'
    ];
    
    blockedCommands.forEach(cmd => {
        const disposable = vscode.commands.registerCommand(cmd, () => {
            vscode.window.showErrorMessage(
                'Chat is disabled during exam mode'
            );
            return; // Block execution
        });
        context.subscriptions.push(disposable);
    });
    
    // Monitor for chat view opening
    vscode.window.onDidChangeActiveTextEditor(() => {
        // Close any chat panels that might have opened
        vscode.commands.executeCommand('workbench.action.closePanel');
    });
}

function deactivate() {}

module.exports = { activate, deactivate };
