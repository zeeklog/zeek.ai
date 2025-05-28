import { platform } from 'os';
import * as nativeBindings from './build/Release/selectedText.node' with { type: 'napi' };

export async function getSelectedText() {
  try {
    const osPlatform = platform();
    console.log(`Fetching selected text on platform: ${osPlatform}`);

    let selectedText;
    switch (osPlatform) {
      case 'win32':
        selectedText = await nativeBindings.getWindowsSelectedText();
        break;
      case 'darwin':
        selectedText = await nativeBindings.getMacOSSelectedText();
        break;
      case 'linux':
        selectedText = await nativeBindings.getLinuxSelectedText();
        break;
      default:
        throw new Error(`Unsupported platform: ${osPlatform}`);
    }

    if (!selectedText) {
      throw new Error('No text selected or unable to access selection');
    }

    return selectedText;
  } catch (error) {
    console.error('Native module error:', error);
    throw new Error(`Failed to get selected text: ${error.message}`);
  }
}
