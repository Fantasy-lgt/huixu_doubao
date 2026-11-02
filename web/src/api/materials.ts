import { api } from './http';

// 对齐 server Material 模型响应；period/occasion 可空；tags 为字符串数组
export interface Material {
  id: string;
  title: string;
  materialType: string;
  tags: string[];
  period: string | null;
  occasion: string | null;
  body: string;
  sourceName: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialUpsertPayload {
  title: string;
  materialType: string;
  tags: string[];
  period: string | null;
  occasion: string | null;
  body: string;
  sourceName?: string;
}

export interface MaterialQuery {
  materialType?: string;
  period?: string;
  tag?: string;
  keyword?: string;
}

function toQueryString(query: MaterialQuery): string {
  const params = new URLSearchParams();
  if (query.materialType) params.set('materialType', query.materialType);
  if (query.period) params.set('period', query.period);
  if (query.tag) params.set('tag', query.tag);
  if (query.keyword) params.set('keyword', query.keyword);
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const materialApi = {
  list: (query: MaterialQuery = {}) => api.get<Material[]>(`/materials${toQueryString(query)}`),
  create: (payload: MaterialUpsertPayload) => api.post<Material>('/materials', payload),
  getById: (id: string) => api.get<Material>(`/materials/${id}`),
  update: (id: string, payload: MaterialUpsertPayload) =>
    api.put<Material>(`/materials/${id}`, payload),
  remove: (id: string) => api.del<{ id: string }>(`/materials/${id}`),
};
