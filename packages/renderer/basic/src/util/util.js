
export function validateAndFormatUrl(input) {
  // 默认搜索地址模板
  const defaultUrl = `${import.meta.env.VUE_APP_DEFAULT_AI_AGENT}?search=${encodeURIComponent(input)}`;

  // 如果输入为空或仅包含空白字符，返回默认地址
  if (!input || !input.trim()) {
    return defaultUrl;
  }

  // 规范化输入，去除首尾空白
  const trimmedInput = input.trim();

  // 定义 URL 的正则表达式，支持任意域名
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/;

  // 检查是否已包含协议（http:// 或 https://）
  if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
    // 使用 URL 构造函数验证完整性
    try {
      new URL(trimmedInput);
      return trimmedInput; // 如果是有效 URL，直接返回
    } catch (e) {
      return defaultUrl; // 无效格式，返回默认地址
    }
  }

  // 检查是否符合域名特征（如 example.com、sub.domain.co.uk）
  if (urlPattern.test(trimmedInput)) {
    // 如果没有协议，添加 https:// 前缀
    return `https://${trimmedInput}`;
  }

  // 不符合 URL 特征，返回默认搜索地址
  return `${import.meta.env.VITE_APP_SEARCH_API}?q=${input}`;
}

export function urlParam(key) {
  const urlParams = new URLSearchParams(location.search);
  const paramValue = urlParams.get(key);
  return paramValue
}
