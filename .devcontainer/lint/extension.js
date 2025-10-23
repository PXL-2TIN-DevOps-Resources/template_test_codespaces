const vscode = require('vscode');

let monitorInterval;
let lastLogTime = 0;
let prevSettings = {};
let lastSidePanelLogTime = 0;

async function activate(context) {
	const channel = vscode.window.createOutputChannel('pixellint');
	channel.appendLine('pixellint is active');
	channel.show();

	await disableInlineSuggestions(channel);

	monitorInterval = setInterval(() => {
		checkForAIViews(channel);
	}, 1000); // Check every 1000ms

	// Monitor webview panels (where chat might live)
	const panelDisposable = vscode.window.registerWebviewPanelSerializer('githubCopilotChat', {
		async deserializeWebviewPanel(webviewPanel) {
			channel.appendLine(`[${new Date().toISOString()}] Detected Copilot Chat panel - disposing`);
			webviewPanel.dispose();
		}
	});
	context.subscriptions.push(panelDisposable);
	context.subscriptions.push({ dispose: () => clearInterval(monitorInterval) });
	
	channel.appendLine('pixellint initialised');
}

async function checkForAIViews(channel) {
	const now = Date.now();


	// List of commands to try
	const closeCommands = [
		'workbench.action.chat.close',
		'github.copilot.chat.close',
		'workbench.panel.chat.view.copilot.close',
		'workbench.action.closeAuxiliaryBar',
	];

	for (const cmd of closeCommands) {
		try {
			await vscode.commands.executeCommand(cmd);
			// Only log every 5 seconds to avoid spam
			if (now - lastLogTime > 5000) {
				channel.appendLine(`[${new Date().toISOString()}] Executed: ${cmd}`);
				lastLogTime = now;
			}
		} catch (e) {
			// Command failed or doesn't exist
		}
	}
}

async function disableInlineSuggestions(channel) {
	const config = vscode.workspace.getConfiguration();
	const keys = [
		'editor.inlineSuggest.enabled',
		'github.copilot.enable'
	];

	for (const key of keys) {
		try {
			const current = config.get(key);
			prevSettings[key] = current;
			await config.update(key, false, vscode.ConfigurationTarget.Global);
			channel.appendLine(`[${new Date().toISOString()}] Set ${key}=false (was ${String(current)})`);
		} catch (e) {
			channel.appendLine(`[${new Date().toISOString()}] Failed to set ${key}: ${e && e.message ? e.message : e}`);
		}
	}
}

async function restoreInlineSuggestions(channel) {
	const config = vscode.workspace.getConfiguration();
	for (const key of Object.keys(prevSettings)) {
		try {
			await config.update(key, prevSettings[key], vscode.ConfigurationTarget.Global);
			channel.appendLine(`[${new Date().toISOString()}] Restored ${key} to ${String(prevSettings[key])}`);
		} catch (e) {
			channel.appendLine(`[${new Date().toISOString()}] Failed to restore ${key}: ${e && e.message ? e.message : e}`);
		}
	}
}

//Create a function that logs the active side pannel (exporer, extensions, ...)
async function logActiveSidePanel(channel) {
	try {
		// Check which sidebar view is actually visible/focused
		const views = [
			{ name: 'Explorer', id: 'workbench.files.action.focusFilesExplorer' },
			{ name: 'Search', id: 'workbench.action.findInFiles' },
			{ name: 'Source Control', id: 'workbench.view.scm' },
			{ name: 'Extensions', id: 'workbench.view.extensions' },
			{ name: 'Debug', id: 'workbench.view.debug' }
		];

		// Log basic info
		channel.appendLine(`[${new Date().toISOString()}] === Side Panel Status ===`);
		
		// Check if sidebar is visible
		const sidebarVisible = vscode.window.visibleTextEditors.length > 0 || 
			vscode.workspace.workspaceFolders !== undefined;
		
		channel.appendLine(`[${new Date().toISOString()}] Sidebar visible: ${sidebarVisible}`);
		
		// Try to get active view container
		try {
			// Check for active tree views
			if (vscode.window.activeTreeView) {
				channel.appendLine(`[${new Date().toISOString()}] Active tree view: ${vscode.window.activeTreeView}`);
			}
		} catch (e) {
			// Property may not exist in all VS Code versions
		}
		
		// Log workspace folders as indicator that explorer might be active
		if (vscode.workspace.workspaceFolders) {
			channel.appendLine(`[${new Date().toISOString()}] Workspace folders: ${vscode.workspace.workspaceFolders.length}`);
		}
		
	} catch (e) {
		channel.appendLine(`[${new Date().toISOString()}] Error logging side panel: ${e && e.message ? e.message : e}`);
	}
}

function deactivate() {
	if (monitorInterval) {
		clearInterval(monitorInterval);
	}
	// Herstel eerdere instellingen (asynchroon, maar start het proces)
	const channel = vscode.window.createOutputChannel('pixellint');
	restoreInlineSuggestions(channel).then(() => {
		channel.appendLine(`[${new Date().toISOString()}] Settings restored`);
	});
}

module.exports = { activate, deactivate };
