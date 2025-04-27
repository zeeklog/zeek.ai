import React, { useEffect } from 'react';

// 声明全局window对象上的textSelection属性
declare global {
  interface Window {
    textSelection: {
      onTranslate: (callback: (text: string) => void) => void;
      onAsk: (callback: (text: string) => void) => void;
      onSearch: (callback: (text: string) => void) => void;
    };
  }
}

/**
 * 文本选择处理器组件
 * 监听文本选择事件，并处理相应的动作
 */
const TextSelectionHandler: React.FC = () => {
  useEffect(() => {
    // 处理翻译事件
    window.textSelection?.onTranslate((text) => {
      console.log('翻译文本:', text);
      // 在这里实现翻译功能
      // 例如：打开翻译窗口、调用翻译API等
    });

    // 处理提问事件
    window.textSelection?.onAsk((text) => {
      console.log('提问文本:', text);
      // 在这里实现提问功能
      // 例如：打开提问窗口、调用AI API等
    });

    // 处理搜索事件
    window.textSelection?.onSearch((text) => {
      console.log('搜索文本:', text);
      // 在这里实现搜索功能
      // 例如：打开搜索窗口、调用搜索API等
    });

    // 组件卸载时清理事件监听器
    return () => {
      // 由于我们使用的是全局事件，这里不需要清理
      // 但如果需要，可以在这里清理
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
};

export default TextSelectionHandler; 