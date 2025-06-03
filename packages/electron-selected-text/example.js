import { getSelectedText } from './getSelectedText.js';

async function main() {
  try {
    console.log('Please select some text in any application...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for user to select text
    const text = await getSelectedText();
    console.log('Selected text:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
