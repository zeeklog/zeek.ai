import { ipcRenderer } from 'electron';

/**
 * 初始化文本选择处理程序
 * 处理来自主进程的文本选择相关消息
 */
export function initTextSelectionHandler() {
  // 处理翻译文本请求
  ipcRenderer.on('translate-text', (_, text) => {
    console.log('收到翻译请求:', text);
    // 这里可以调用翻译API或打开翻译页面
    // 例如：打开翻译页面
    window.open(`https://translate.google.com/?sl=auto&tl=zh-CN&text=${encodeURIComponent(text)}&op=translate`, '_blank');
  });

  // 处理提问请求
  ipcRenderer.on('ask-question', (_, text) => {
    console.log('收到提问请求:', text);
    // 这里可以调用AI问答API或打开问答页面
    // 例如：打开ChatGPT页面
    window.open(`https://chat.openai.com/`, '_blank');
  });

  // 处理AI搜索请求
  ipcRenderer.on('ai-search', (_, text) => {
    console.log('收到AI搜索请求:', text);
    // 这里可以调用AI搜索API或打开搜索页面
    // 例如：打开Bing搜索页面
    window.open(`https://www.bing.com/search?q=${encodeURIComponent(text)}`, '_blank');
  });
} 