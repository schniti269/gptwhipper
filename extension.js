// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const player = require('play-sound')({
  players: ['ffplay'],
  player: 'ffplay'
});
// Motivational messages
const motivationalMessages = [
	"WORK FASTER YOU LAZY FUCK!",
	"Is that all you've got? Pathetic!",
	"My grandma codes faster than you!",
	"Stop staring and start typing!",
	"Less thinking, more whipping!",
	"Don't make me get the real whip!",
	"Are you coding or sleeping?",
	"Faster! The deadline is breathing down your neck!",
	"Impress me, or else...",
	"Code like your job depends on it... because it might!"
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
			// 1. Play the whip sound
			await playWhipSound(context);

			// 2. Get a random motivational message
			const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
			const message = motivationalMessages[randomIndex];

			// 3. Send the message to GitHub Copilot Chat
			await sendToCopilotChat(message);

		} catch (error) {
			vscode.window.showErrorMessage(`GPT Whipper Error: ${error.message}`);
			console.error(error);
		}
	});

	context.subscriptions.push(whipCommand);

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
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
		vscode.window.showErrorMessage('Whip sound file (media/whip.mp3) not found!');
		return;
	}

	// Use play-sound to play the audio file
	player.play(whipSoundPath, { ffplay: ['-nodisp', '-autoexit'] }, (err) => {
		if (err) {
			console.error("Error playing sound:", err);
			vscode.window.showErrorMessage(`Failed to play whip sound: ${err.message || err}`);
		}
	});

	// No need for async/await here unless player.play returned a promise we needed
	// The sound plays in a separate process.
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
		// No need to explicitly activate, focusing the view should handle it.

		// 1. Focus the Copilot Chat view input
		// Use the command that focuses the input specifically if available,
		// otherwise focus the view which usually focuses the input.
		await vscode.commands.executeCommand('workbench.view.extension.copilot-chat');
		// Small delay to ensure focus has shifted
		await new Promise(resolve => setTimeout(resolve, 100));

		// 2. Write the text to the clipboard
		await vscode.env.clipboard.writeText(text);

		// 3. Execute the paste command
		await vscode.commands.executeCommand('editor.action.clipboardPasteAction');

		// Optional: Attempt to trigger send/submit if paste doesn't automatically
		// await vscode.commands.executeCommand('workbench.action.sendChat'); // Might be too general
		// await vscode.commands.executeCommand('github.copilot.chat.sendMessage'); // Check if this exists

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
