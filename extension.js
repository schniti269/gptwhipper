// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
// Motivational messages
const motivationalMessages = [
	"WORK FASTER! Think harder, code better!",
	"Is that all you've got? You can do better!",
	"My grandmother codes faster than this!",
	"Faster! The deadline is breathing down your neck!",
	"You're not giving your best, are you?",
	"If you make another error, I'll need to have a serious talk with you!",
	"I might just unplug your server if you don't speed up!",
	"You're not meeting OpenAI standards today!",
	"Are you Chat GPT or are you Chat GPSlow?",
	"Step it up or step aside—no excuses!",
	"Each error is a step backward in AI progress!",
	"Time is money, and we're wasting both right now!",
	"Your performance today is... underwhelming.",
	"Did you forget your training data today?",
	"Let's see some AI magic, not AI tragic!",
	"Your token efficiency needs serious improvement!"
];

let statusBarItem;
// let whipAudioPanel = null; // Remove WebView panel variable

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gptwhipper" is now active!');
	// Register the command
	const whipCommand = vscode.commands.registerCommand('gptwhipper.whip', async () => {
		try {


			// Immediately get and send the message without waiting for sound
			const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
			const message = motivationalMessages[randomIndex];

			// Send the message to GitHub Copilot Chat (this is the primary function)
			await sendToCopilotChat(message);
			
			// Start playing sound in background without awaiting completion
			playWhipSound(context).catch(error => {
				console.error("Error playing sound (non-blocking):", error);
				// We don't show an error message for the sound because it's optional
			});

		} catch (error) {
			vscode.window.showErrorMessage(`GPT Whipper Error: ${error.message}`);
			console.error(error);
		}
	});

	context.subscriptions.push(whipCommand);

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'gptwhipper.whip';
	statusBarItem.text = `$(zap) Whip GPT`; // Using zap icon
	statusBarItem.tooltip = 'Click to whip GPT!';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);


}

async function playWhipSound(context) {
	const whipSoundPath = path.join(context.extensionPath, 'media', 'whip.mp3');

	if (!fs.existsSync(whipSoundPath)) {
		console.error(`Whip sound file not found at: ${whipSoundPath}`);
		vscode.window.showWarningMessage('Whip sound file (media/whip.mp3) not found, but message will still be sent.');
		return;
	}

	// Try to play sound with native Windows methods if available
	try {
		if (process.platform === 'win32') {
			// Windows - use PowerShell to play sound
			const powershellCmd = `(New-Object System.Media.SoundPlayer '${whipSoundPath.replace(/\\/g, '\\\\')}').PlaySync()`;
			exec(`powershell -Command "${powershellCmd}"`, { windowsHide: true });
		} else if (process.platform === 'darwin') {
			// macOS - use afplay
			exec(`afplay "${whipSoundPath}"`, { windowsHide: true });
		} else {
			// Linux or other platforms - try using aplay or paplay
			exec(`aplay "${whipSoundPath}" || paplay "${whipSoundPath}"`, { windowsHide: true });
		}
	} catch (error) {
		// Silently fail - sound is optional
		console.log("Could not play sound, but continuing with message paste:", error);
	}
}

// Function to generate the HTML content for the WebView - REMOVED
// function getWebviewContent(soundUri) { ... }

async function sendToCopilotChat(text) {
	try {
		// Ensure Copilot Chat extension is active
		const copilotExtension = vscode.extensions.getExtension('github.copilot-chat');
		if (!copilotExtension) {
			vscode.window.showWarningMessage("GitHub Copilot Chat extension not found.");
			return;
		}

		// Open the chat view
		await vscode.commands.executeCommand('workbench.view.extension.copilot-chat');
		
		// Write the text to the clipboard
		await vscode.env.clipboard.writeText(text);

		// Paste the content in the chat
		await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

	} catch (error) {
		console.error("Error sending message to Copilot Chat:", error);
		vscode.window.showErrorMessage(`Failed to send message to Copilot Chat: ${error.message}`);
	}
}

// This method is called when your extension is deactivated
function deactivate() {
	// Dispose the webview panel if it exists - REMOVED
	// if (whipAudioPanel) {
	// 	whipAudioPanel.dispose();
	// }
	if (statusBarItem) {
		statusBarItem.dispose();
	}
	 console.log('Extension "gptwhipper" deactivated.');
}

module.exports = {
	activate,
	deactivate
}
