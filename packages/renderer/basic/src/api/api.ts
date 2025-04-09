// src/api/api.ts
import axios from '../util/axios';

// 定义接口返回数据的通用类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function appList(query?: string): Promise<ApiResponse<string>> {
  const response = await axios.get('/basic-api/app/index/list', {
    params: { type: 'app' },
  });
  return response;
}

export async function appCategoryList(url: string): Promise<ApiResponse<{ tabId: string; tabs: any[] }>> {
  const response = await axios.get('/basic-api/app/index/list', {
    params: { type: 'category' },
  });
  return response;
}
