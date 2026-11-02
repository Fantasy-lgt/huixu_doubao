<template>
  <div class="mat-view">
    <!-- 筛选条 -->
    <div class="toolbar">
      <select v-model="store.filters.materialType" class="ctrl">
        <option value="">全部类型</option>
        <option v-for="(meta, code) in TYPE_META" :key="code" :value="code">{{ meta.label }}</option>
      </select>
      <input v-model="store.filters.period" class="ctrl" type="month" placeholder="期间（可清空）" />
      <input
        v-model="store.filters.keyword"
        class="ctrl grow"
        type="search"
        placeholder="关键词：标题 / 正文 / 来源名"
        @keyup.enter="applyFilters"
      />
      <button class="ghost-btn" type="button" @click="applyFilters">查询</button>
      <button class="ghost-btn" type="button" @click="resetFilters">重置筛选</button>
      <button class="primary-btn" type="button" @click="openCreate">新建材料</button>
    </div>

    <!-- 四态：loading / error / empty / list -->
    <div v-if="store.loading" class="state-box">加载中…</div>

    <div v-else-if="store.error" class="state-box error">
      <p>{{ store.error }}</p>
      <button class="ghost-btn" type="button" @click="reload">重试</button>
    </div>

    <div v-else-if="store.list.length === 0" class="state-box empty">
      <p class="empty-title">还没有匹配的材料</p>
      <p class="empty-sub">粘贴工作原文沉淀下来，后续汇报初稿都从这里取事实来源。</p>
      <button class="primary-btn" type="button" @click="openCreate">新建第一份材料</button>
    </div>

    <div v-else class="card-grid">
      <article
        v-for="item in store.list"
        :key="item.id"
        class="card"
        @click="openDetail(item.id)"
      >
        <div class="card-head">
          <span class="type-badge" :style="{ color: metaOf(item.materialType).color, background: metaOf(item.materialType).bg }">
            {{ metaOf(item.materialType).label }}
          </span>
          <span class="period">{{ item.period ?? '未标期间' }}</span>
        </div>
        <h3 class="card-title">{{ item.title }}</h3>
        <p class="preview">{{ previewOf(item.body) }}</p>
        <div class="tags">
          <span v-for="t in item.tags" :key="t" class="tag">#{{ t }}</span>
        </div>
        <div class="card-meta">
          <span v-if="item.occasion" class="occasion">{{ item.occasion }}</span>
          <span class="muted">{{ item.sourceName || '手工录入' }}</span>
        </div>
        <div class="card-foot">
          <span class="muted">{{ formatTime(item.updatedAt) }} 更新</span>
          <span class="muted">{{ item.body.length }} 字</span>
        </div>
      </article>
    </div>

    <!-- 新建材料对话框 -->
    <div v-if="createVisible" class="mask" @click.self="closeCreate">
      <div class="modal">
        <h3>新建材料</h3>
        <p v-if="createError" class="summary">{{ createError }}</p>
        <div class="form-grid">
          <label class="field span2">
            <span class="label">标题（必填，≤100 字）</span>
            <input v-model="form.title" maxlength="120" />
          </label>
          <label class="field">
            <span class="label">类型（必选）</span>
            <select v-model="form.materialType">
              <option value="">请选择类型</option>
              <option v-for="(meta, code) in TYPE_META" :key="code" :value="code">{{ meta.label }}</option>
            </select>
          </label>
          <label class="field">
            <span class="label">期间（留空 = 未标期间）</span>
            <input v-model="form.period" type="month" />
          </label>
          <label class="field">
            <span class="label">场合（可空）</span>
            <select v-model="form.occasion">
              <option value="">不指定</option>
              <option v-for="o in OCCASIONS" :key="o" :value="o">{{ o }}</option>
            </select>
          </label>
          <label class="field">
            <span class="label">来源名（留空由后端补“手工录入”）</span>
            <input v-model="form.sourceName" maxlength="180" />
          </label>
          <div class="field span2">
            <span class="label">标签（≤8 个，单个 ≤12 字）</span>
            <div class="tag-row">
              <input v-model="form.tagInput" placeholder="输入后点添加" @keyup.enter.prevent="addTag" />
              <button class="ghost-btn small" type="button" @click="addTag">添加</button>
            </div>
            <div class="tags">
              <span v-for="(t, i) in form.tags" :key="t" class="tag removable" @click="removeTag(i)">
                #{{ t }} ×
              </span>
            </div>
          </div>
          <label class="field span2">
            <span class="label">正文（原文只读保留，{{ form.body.length }}/20000）</span>
            <textarea v-model="form.body" rows="9" placeholder="粘贴工作原文，保留原有换行与分段"></textarea>
          </label>
        </div>
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="closeCreate">取消</button>
          <button class="primary-btn" type="button" :disabled="submitting" @click="submitCreate">
            {{ submitting ? '提交中…' : '保存材料' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 详情只读对话框 -->
    <div v-if="detailVisible" class="mask" @click.self="detailVisible = false">
      <div class="modal detail">
        <template v-if="store.selected">
          <div class="card-head">
            <span class="type-badge" :style="badgeStyle(store.selected.materialType)">
              {{ metaOf(store.selected.materialType).label }}
            </span>
            <span class="period">{{ store.selected.period ?? '未标期间' }}</span>
          </div>
          <h3>{{ store.selected.title }}</h3>
          <dl class="detail-meta">
            <div><dt>场合</dt><dd>{{ store.selected.occasion ?? '—' }}</dd></div>
            <div><dt>来源</dt><dd>{{ store.selected.sourceName || '手工录入' }}</dd></div>
            <div><dt>版本</dt><dd>v{{ store.selected.version }}</dd></div>
            <div><dt>创建</dt><dd>{{ formatTime(store.selected.createdAt) }}</dd></div>
            <div><dt>更新</dt><dd>{{ formatTime(store.selected.updatedAt) }}</dd></div>
          </dl>
          <div class="tags">
            <span v-for="t in store.selected.tags" :key="t" class="tag">#{{ t }}</span>
          </div>
          <pre class="body-pre">{{ store.selected.body }}</pre>
        </template>
        <div class="modal-actions">
          <button
            v-if="store.selected"
            class="danger-btn"
            type="button"
            @click="askDelete(store.selected)"
          >
            删除
          </button>
          <button class="ghost-btn" type="button" @click="detailVisible = false">关闭</button>
        </div>
      </div>
    </div>

    <!-- 删除二次确认 -->
    <div v-if="deleteTarget" class="mask" @click.self="deleteTarget = null">
      <div class="modal">
        <h3>确认删除这份材料？</h3>
        <p class="warn-text">原文删除不可恢复；引用该材料的草稿将失效；已导出的文件不会被删除。</p>
        <p v-if="deleteError" class="summary">{{ deleteError }}</p>
        <p class="muted">材料：{{ deleteTarget.title }}</p>
        <div class="modal-actions">
          <button class="ghost-btn" type="button" @click="deleteTarget = null">取消</button>
          <button class="danger-btn" type="button" :disabled="deleting" @click="doDelete">
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useMaterialsStore, type MaterialItem } from '@/stores/materials';
import { RequestError } from '@/api/http';

const store = useMaterialsStore();

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  work_report: { label: '工作汇报', color: '#6c5ce7', bg: 'rgba(108,92,231,0.10)' },
  project_progress: { label: '项目进展', color: '#2e9e77', bg: 'rgba(46,158,119,0.12)' },
  meeting_minutes: { label: '会议纪要', color: '#b7791f', bg: 'rgba(183,121,31,0.14)' },
  hr_admin: { label: '人事行政', color: '#7a5cff', bg: 'rgba(122,92,255,0.10)' },
  customer_business: { label: '客户往来', color: '#e17055', bg: 'rgba(225,112,85,0.12)' },
  contract_deal: { label: '合同商务', color: '#4a6fa5', bg: 'rgba(74,111,165,0.12)' },
  regulation: { label: '制度通知', color: '#009e8c', bg: 'rgba(0,158,140,0.12)' },
  other: { label: '其他', color: '#6e6b8c', bg: 'rgba(110,107,140,0.12)' },
};

const OCCASIONS = ['月度管理会', '部门例会', '项目复盘', '年度总结', '述职竞聘', '专项汇报', '其他'];

function metaOf(code: string) {
  return TYPE_META[code] ?? TYPE_META.other;
}
function badgeStyle(code: string) {
  const meta = metaOf(code);
  return { color: meta.color, background: meta.bg };
}

function previewOf(body: string): string {
  return body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' / ');
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  try {
    await store.fetchList();
  } catch {
    /* 错误已写入 store.error，视图负责展示 */
  }
}

function applyFilters() {
  void reload();
}
function resetFilters() {
  store.resetFilters();
  void reload();
}

onMounted(() => {
  void reload();
});

// ---------- 新建对话框 ----------
const createVisible = ref(false);
const submitting = ref(false);
const createError = ref('');
const form = reactive({
  title: '',
  materialType: '',
  tags: [] as string[],
  tagInput: '',
  period: '',
  occasion: '',
  sourceName: '',
  body: '',
});

function openCreate() {
  form.title = '';
  form.materialType = '';
  form.tags = [];
  form.tagInput = '';
  form.period = '';
  form.occasion = '';
  form.sourceName = '';
  form.body = '';
  createError.value = '';
  createVisible.value = true;
}
function closeCreate() {
  createVisible.value = false;
}

function addTag() {
  const t = form.tagInput.trim();
  if (!t) return;
  if (form.tags.includes(t)) {
    form.tagInput = '';
    return;
  }
  if (form.tags.length >= 8) {
    createError.value = '标签最多 8 个';
    return;
  }
  if (t.length > 12) {
    createError.value = '单个标签不超过 12 字';
    return;
  }
  form.tags.push(t);
  form.tagInput = '';
  createError.value = '';
}
function removeTag(index: number) {
  form.tags.splice(index, 1);
}

async function submitCreate() {
  createError.value = '';
  if (!form.title.trim()) {
    createError.value = '标题必填';
    return;
  }
  if (form.title.trim().length > 100) {
    createError.value = '标题不超过 100 字';
    return;
  }
  if (!form.materialType) {
    createError.value = '请选择材料类型';
    return;
  }
  if (form.period && !/^\d{4}-(0[1-9]|1[0-2])$/.test(form.period)) {
    createError.value = '期间须为合法 YYYY-MM';
    return;
  }
  if (!form.body.trim()) {
    createError.value = '正文必填';
    return;
  }
  if (form.body.length > 20000) {
    createError.value = '正文不超过 20000 字';
    return;
  }
  submitting.value = true;
  try {
    await store.create({
      title: form.title.trim(),
      materialType: form.materialType,
      tags: form.tags,
      period: form.period || null,
      occasion: form.occasion || null,
      body: form.body,
      sourceName: form.sourceName.trim() || undefined,
    });
    closeCreate();
  } catch (err) {
    if (err instanceof RequestError && err.code === 'MATERIAL_DUPLICATE') {
      createError.value = '内容与已有材料重复（同期间正文一致）';
    } else {
      createError.value = err instanceof Error ? err.message : '保存失败，请稍后重试';
    }
  } finally {
    submitting.value = false;
  }
}

// ---------- 详情 ----------
const detailVisible = ref(false);
async function openDetail(id: string) {
  try {
    await store.getById(id);
    detailVisible.value = true;
  } catch {
    store.error = '详情加载失败，请重试';
  }
}

// ---------- 删除 ----------
const deleteTarget = ref<MaterialItem | null>(null);
const deleteError = ref('');
const deleting = ref(false);
function askDelete(item: MaterialItem) {
  deleteError.value = '';
  deleteTarget.value = item;
}
async function doDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  deleteError.value = '';
  try {
    await store.remove(deleteTarget.value.id);
    detailVisible.value = false;
    deleteTarget.value = null;
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : '删除失败，请稍后重试';
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.mat-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.ctrl {
  border: 1px solid var(--border-strong);
  border-radius: var(--r-ctrl);
  padding: 7px 10px;
  background: var(--bg);
  color: var(--ink-1);
}
.ctrl.grow {
  flex: 1;
  min-width: 180px;
}
.ghost-btn {
  border: 1px solid var(--border-strong);
  background: var(--bg);
  color: var(--ink-2);
  border-radius: var(--r-pill);
  padding: 7px 14px;
  cursor: pointer;
}
.ghost-btn.small {
  padding: 5px 10px;
  font-size: 12px;
}
.primary-btn {
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  border-radius: var(--r-pill);
  padding: 8px 16px;
  cursor: pointer;
}
.primary-btn:disabled {
  opacity: 0.6;
}
.danger-btn {
  border: none;
  background: var(--down);
  color: #fff;
  border-radius: var(--r-pill);
  padding: 8px 16px;
  cursor: pointer;
}
.state-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 32px 20px;
  text-align: center;
  color: var(--ink-2);
}
.state-box.error {
  color: var(--down);
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.empty-sub {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-bottom: 14px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 14px 16px;
  cursor: pointer;
}
.card:hover {
  border-color: var(--border-strong);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.type-badge {
  font-size: 11.5px;
  padding: 2px 9px;
  border-radius: var(--r-pill);
}
.period {
  font-size: 12px;
  color: var(--ink-3);
}
.card-title {
  font-size: 14.5px;
  margin-bottom: 6px;
}
.preview {
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.tag {
  font-size: 11.5px;
  color: var(--ink-2);
  background: var(--panel-2);
  padding: 2px 8px;
  border-radius: var(--r-pill);
}
.tag.removable {
  cursor: pointer;
}
.card-meta,
.card-foot {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ink-3);
}
.occasion {
  color: var(--accent);
}
.muted {
  color: var(--ink-3);
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(31, 27, 61, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.modal {
  width: 560px;
  max-width: 92vw;
  max-height: 86vh;
  overflow: auto;
  background: var(--bg);
  border-radius: var(--r-card);
  padding: 22px 24px;
}
.modal h3 {
  font-size: 16px;
  margin-bottom: 12px;
}
.summary {
  background: var(--down-bg);
  color: var(--down);
  font-size: 12.5px;
  border-radius: var(--r-ctrl);
  padding: 8px 12px;
  margin-bottom: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field.span2 {
  grid-column: span 2;
}
.label {
  font-size: 12.5px;
  color: var(--ink-2);
}
.field input,
.field select,
.field textarea {
  border: 1px solid var(--border-strong);
  border-radius: var(--r-ctrl);
  padding: 8px 10px;
  background: var(--bg);
  color: var(--ink-1);
  font-family: inherit;
}
.field textarea {
  resize: vertical;
}
.tag-row {
  display: flex;
  gap: 8px;
}
.tag-row input {
  flex: 1;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}
.warn-text {
  font-size: 13px;
  color: var(--warn-ink);
  background: var(--warn-bg);
  border-radius: var(--r-ctrl);
  padding: 10px 12px;
  margin-bottom: 10px;
}
.detail-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 10px 0;
}
.detail-meta dt {
  font-size: 12px;
  color: var(--ink-3);
}
.detail-meta dd {
  margin: 2px 0 0;
  font-size: 13px;
}
.body-pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--panel-2);
  border-radius: var(--r-ctrl);
  padding: 12px;
  font-size: 13px;
  line-height: 1.7;
  font-family: inherit;
  margin-top: 10px;
}
</style>
