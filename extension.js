// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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

let webviewPanel = null;
let statusBarItem;

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

	// Pre-create the webview on activation for faster sound playback
	ensureWebviewPanel(context);
}

function ensureWebviewPanel(context) {
	if (webviewPanel) {
		return;
	}

	webviewPanel = vscode.window.createWebviewPanel(
		'gptWhipSoundPlayer',
		'GPT Whip Sound Player',
		vscode.ViewColumn.Beside, // Open in a side column, can be hidden
		{
			enableScripts: true,
			retainContextWhenHidden: true // Keep alive when not visible
		}
	);

	// Set HTML content for the WebView
	const whipSoundPath = path.join(context.extensionPath, 'media', 'whip.mp3');
	if (!fs.existsSync(whipSoundPath)) {
		console.error(`Whip sound file not found at: ${whipSoundPath}`);
		vscode.window.showErrorMessage('Whip sound file (media/whip.mp3) not found!');
		webviewPanel = null; // Invalidate panel if sound is missing
		return;
	}
	const whipSoundUri = webviewPanel.webview.asWebviewUri(vscode.Uri.file(whipSoundPath));

	webviewPanel.webview.html = getWebviewContent(whipSoundUri.toString());

	// Handle messages from the webview (optional, if needed later)
	// webviewPanel.webview.onDidReceiveMessage(
	//  message => { console.log('Message from webview:', message); },
	//  undefined,
	//  context.subscriptions
	// );

	// Reset panel when closed
	webviewPanel.onDidDispose(
		() => {
			webviewPanel = null;
		},
		null,
		context.subscriptions
	);

	 // Initially hide the panel, we just need it to exist
	 // A slight delay might be needed for the webview to fully load before hiding
	setTimeout(() => {
		if(webviewPanel) {
			 // Check if it wasn't disposed in the meantime
			 webviewPanel.reveal(vscode.ViewColumn.Beside, true); // Reveal but preserve focus
			 vscode.commands.executeCommand('workbench.action.closeActiveEditor'); // Attempt to close it
		}
	}, 500); // Adjust delay if needed
}

async function playWhipSound(context) {
	ensureWebviewPanel(context); // Make sure the panel exists

	if (!webviewPanel) {
	   throw new Error("Could not create WebView to play sound.");
	}

	// Send a message to the WebView to play the sound
	const success = await webviewPanel.webview.postMessage({ command: 'play' });
	if (!success) {
		console.error("Failed to post message to webview for sound playback.");
		// Optionally try to recreate webview or show error
		// For simplicity, we just log the error here
	}
}

async function sendToCopilotChat(text) {
	try {
		// Ensure Copilot Chat extension is active (optional but good practice)
		const copilotExtension = vscode.extensions.getExtension('github.copilot-chat');
		if (!copilotExtension) {
			vscode.window.showWarningMessage("GitHub Copilot Chat extension not found.");
			return;
		}
		if (!copilotExtension.isActive) {
			 // Only activate if necessary, might take a moment
			await copilotExtension.activate();
		}

		// Use the official command to send text to Copilot Chat input
		// This requires Copilot Chat v0.12.0 or later
		await vscode.commands.executeCommand('github.copilot.chat.submit', { prompt: text });

		// Optional: Focus the chat window after sending (might be disruptive)
		// await vscode.commands.executeCommand('workbench.view.extension.copilot-chat');

	} catch (error) {
		console.error("Error sending message to Copilot Chat:", error);
		vscode.window.showErrorMessage(`Failed to send message to Copilot Chat: ${error.message}`);
	}
}

function getWebviewContent(soundUri) {
	// Simple HTML with an audio element and script to play it on message
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Whip Sound Player</title>
</head>
<body>
    <audio id="whipSound" src="${soundUri}" preload="auto"></audio>
    <script>
        const audio = document.getElementById('whipSound');
        const vscode = acquireVsCodeApi(); // VS Code API for communication

        window.addEventListener('message', event => {
            const message = event.data; // The json data that the extension sent
            switch (message.command) {
                case 'play':
                    audio.currentTime = 0; // Rewind to start
                    audio.play().catch(e => console.error("Audio playback failed:", e));
                    break;
            }
        });

        // Optional: Inform the extension when the webview is ready
        // vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
}

// This method is called when your extension is deactivated
function deactivate() {
	if (webviewPanel) {
		webviewPanel.dispose();
	}
	if (statusBarItem) {
		statusBarItem.dispose();
	}
	 console.log('Extension "gptwhipper" deactivated.');
}

module.exports = {
	activate,
	deactivate
}
