<template>
    <BaseModal :modelValue="visible" size="lg" class="staff-results-base-modal"
        @update:modelValue="(v: boolean) => { if (!v) closeModal(); }">
        <template #header>
            <div class="modal-title">
                <i class="pi pi-chart-bar"></i>
                <h2>Итоги работы за период</h2>
            </div>
        </template>

        <div class="modal-content">
            <div class="filters-section">
                <FiltersBar :filters="filterConfigs" :model-value="filterValues" :show-reset-button="false"
                    :show-mobile-button="false" @update:model-value="handleFiltersUpdate"
                    @filter-change="handleFilterChange">
                    <template #actions>
                        <div class="filter-item filter-item--actions">
                            <button class="apply-filters-btn" @click="loadResults" :disabled="isLoading" :class="{
                                'loading-btn': isLoading
                            }">
                                <div class="btn-content">
                                    <div class="btn-text">
                                        {{ isLoading ? 'Загрузка...' : 'Применить фильтры' }}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </template>
                </FiltersBar>
            </div>


            <div class="results-section">
                <div v-if="isLoading" class="loading-state">
                    <div class="loader"></div>
                    <p>Загрузка результатов...</p>
                </div>

                <div v-else-if="!results.length" class="empty-state">
                    <i class="pi pi-info-circle"></i>
                    <p>Нет данных за выбранный период</p>
                </div>

                <div v-else class="results-grid">
                    <div v-for="result in results" :key="result.id || result.name" class="result-card">
                        <div class="result-header">
                            <h3 class="result-title">{{ result.name }}</h3>
                            <div class="result-header-right"></div>

                        </div>

                        <div class="result-fields">
                            <template v-if="Array.isArray(result.shift_report_fields)">

                                <div v-for="field in result.shift_report_fields" :key="field.id || field.name"
                                    class="field-item">

                                    <span class="field-name">{{ field.name }}</span>
                                    <span class="field-value">{{ formatNumber(Number(field.sum ??
                                        field.value ?? 0)) }}</span>
                                </div>
                            </template>
                            <template v-else>
                                <div class="field-item">
                                    <span class="field-name">Данные</span>
                                    <span class="field-value">—</span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template v-if="!dateOnly" #footer>
            <button class="btn-export" @click="handleExport" :disabled="isExporting || !results.length"
                :class="{ 'btn-export-loading': isExporting }">

                <i v-if="!isExporting" class="pi pi-external-link"></i>
                <span v-if="isExporting" class="loader"></span>
                {{ isExporting ? 'Открытие...' : 'Открыть в Excel' }}
            </button>
            <button class="btn-close" @click="closeModal">
                Закрыть
            </button>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { FiltersBar, type FilterConfig, BaseModal } from '@/shared/ui';
import { useToast } from '../Toast';
import { useProjects, useAgents } from '@/shared/composables';
import type { Agent } from '@/stores/agents';

interface StaffResultTotal {
    id?: number;
    name: string;
    shift_report_fields?: Array<{ id?: number; name: string; sum?: number; value?: number }>;
}

interface StaffResultTotalResponse {
    data: StaffResultTotal[];
}

interface PlanReportResponse {
    data: any[];
}

interface Props {
    visible: boolean;
    dateOnly?: boolean;
    fetchStaffResultsTotal: (params: {
        date_from?: string;
        date_to?: string;
        project?: number;
        point?: number;
        user?: number;
    }) => Promise<StaffResultTotalResponse>;
    exportStaffResultsTotal: (params: {
        date_from?: string;
        date_to?: string;
        project?: number;
        point?: number;
        user?: number;
        export?: number;
    }) => Promise<Blob>;
    fetchPlanReports: (params: {
        date_from?: string;
        date_to?: string;
    }) => Promise<PlanReportResponse>;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const { projects, points, isLoading: isLoadingProjects, loadProjects, getPointsByProjectId } = useProjects();
const { agents, isLoading: isLoadingAgents, loadAgents, getAgentsByProject, getAgentsByProjectAndPoint } = useAgents();

const filters = ref({
    dateRange: { from: null as Date | null, to: null as Date | null },
    project: undefined as number | undefined,
    point: undefined as number | undefined,
    user: undefined as number | undefined,
});

const results = ref<any[]>([]);
const isLoading = ref(false);
const isExporting = ref(false);
const isLoadingData = ref(false);

const projectOptions = computed(() => [
    { id: undefined, name: 'Все проекты' },
    ...projects.value.map(p => ({ id: p.id, name: p.name }))
]);

const pointOptions = computed(() => {
    if (!filters.value.project || filters.value.project === undefined) {
        return [{ id: undefined, name: 'Все точки' }];
    }

    const filteredPoints = getPointsByProjectId(filters.value.project);

    return [
        { id: undefined, name: 'Все точки' },
        ...filteredPoints.map(point => ({ id: point.id, name: point.name }))
    ];
});

const userOptions = computed(() => {
    // Если выбран проект и точка, показываем агентов только для этой точки
    // Если выбран только проект, показываем агентов для этого проекта
    // Если ничего не выбрано, показываем всех агентов
    let agentsToShow: Agent[] = [];
    if (filters.value.project) {
        agentsToShow = getAgentsByProjectAndPoint(
            filters.value.project,
            filters.value.point
        );
    } else {
        // Если проект не выбран, показываем всех агентов (из кэша 'all' или объединенных)
        agentsToShow = agents.value;
    }

    return [
        { id: undefined, name: 'Все агенты' },
        ...agentsToShow.map(agent => ({
            id: agent.id,
            name: `${agent.surname} ${agent.name} ${agent.patronymic || ''}`.trim()
        }))
    ];
});

const filterValues = computed(() => ({
    dateRange: filters.value.dateRange || { from: null, to: null },
    project: filters.value.project,
    point: filters.value.point,
    user: filters.value.user,
}));

const filterConfigs = computed((): FilterConfig[] => {
    const configs: FilterConfig[] = [
        {
            key: 'dateRange',
            type: 'date-range' as const,
            label: 'Период',
            placeholder: 'Выберите период',
        },
    ];

    if (!props.dateOnly) {
        configs.push(
            {
                key: 'project',
                type: 'select' as const,
                label: 'Проект',
                placeholder: (isLoadingData.value || isLoadingProjects.value) ? 'Загрузка проектов...' : 'Выберите проект',
                options: projectOptions.value,
                optionLabel: 'name',
                optionValue: 'id',
                searchable: false,
                disabled: isLoadingData.value || isLoadingProjects.value,
                onChange: () => onProjectChange(),
            },
            {
                key: 'point',
                type: 'select' as const,
                label: 'Точка',
                placeholder: isLoadingData.value ? 'Загрузка точек...' : (filters.value.project && filters.value.project !== undefined) ? 'Выберите точку' : 'Сначала выберите проект',
                options: pointOptions.value,
                optionLabel: 'name',
                optionValue: 'id',
                searchable: false,
                disabled: isLoadingData.value || !filters.value.project || filters.value.project === undefined,
            },
            {
                key: 'user',
                type: 'select' as const,
                label: 'Агент',
                placeholder: (isLoadingData.value || isLoadingAgents.value) ? 'Загрузка агентов...' : 'Выберите агента',
                options: userOptions.value,
                optionLabel: 'name',
                optionValue: 'id',
                searchable: false,
                disabled: isLoadingData.value || isLoadingAgents.value,
            }
        );
    }

    return configs;
});

const handleFiltersUpdate = (values: Record<string, any>) => {
    const oldProject = filters.value.project;
    filters.value.dateRange = values.dateRange || { from: null, to: null };
    filters.value.project = values.project || undefined;
    filters.value.point = values.point || undefined;
    filters.value.user = values.user || undefined;

    // Сбрасываем point при изменении project
    if (oldProject !== filters.value.project) {
        filters.value.point = undefined;
    }
};

const handleFilterChange = (key: string, value: any) => {
    if (key === 'project') {
        onProjectChange();
    }
};

// Статус для "ручников":
// - если есть отчёт (report=true/не пусто) → "Подтверждено"
// - если report нет и date_match === true → "Ожидает"
// - если report нет и date_match === false → "Не подтверждено"
function getStatusText(result: any): string {
    const hasReport = Boolean(result?.report);
    if (hasReport) return 'Подтверждено';
    if (result?.date_match === true) return 'Ожидает';
    return 'Не подтверждено';
}

function getStatusClass(result: any): string {
    const hasReport = Boolean(result?.report);
    if (hasReport) return 'status-confirmed';
    if (result?.date_match === true) return 'status-pending';
    return 'status-rejected';
}

const formatDateForAPI = (date: Date | null): string | undefined => {
    if (!date) return undefined;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
};

const setYesterdayAsDefault = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    filters.value.dateRange = {
        from: startOfYesterday,
        to: endOfYesterday
    };
};

const onProjectChange = async () => {
    filters.value.point = undefined;
    filters.value.user = undefined; // Сбрасываем выбранного агента при смене проекта

    if (!filters.value.project || filters.value.project === undefined) {
        toast.add({
            severity: 'info',
            summary: 'Информация',
            detail: 'Сначала выберите конкретный проект, чтобы увидеть доступные точки',
            life: 3000,
        });
    } else {
        // Загружаем агентов для выбранного проекта
        try {
            await loadAgentsData(filters.value.project);
        } catch (error) {
            console.error('Ошибка загрузки агентов для проекта:', error);
        }
    }
};

const isValidId = (val: unknown): val is number => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') {
        const trimmed = val.trim().toLowerCase();
        if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return false;
        const num = Number(val);
        return Number.isFinite(num) && num > 0;
    }
    if (typeof val === 'number') {
        return Number.isFinite(val) && val > 0;
    }
    return false;
};

const loadResults = async () => {
    isLoading.value = true;

    try {
        const params: any = {};
        const dateRange = filters.value.dateRange || { from: null, to: null };

        if (dateRange.from) {
            params.date_from = formatDateForAPI(dateRange.from);
        }
        if (dateRange.to) {
            params.date_to = formatDateForAPI(dateRange.to);
        }
        if (!props.dateOnly && isValidId(filters.value.project)) {
            params.project = Number(filters.value.project);
            if (isValidId(filters.value.point)) {
                params.point = Number(filters.value.point);
            }
        }
        if (!props.dateOnly && isValidId(filters.value.user)) {
            params.user = Number(filters.value.user);
        }

        if (props.dateOnly) {
            const response = await props.fetchPlanReports(params);
            results.value = Array.isArray(response?.data) ? response.data : [];
        } else {
            const response = await props.fetchStaffResultsTotal(params);
            results.value = response.data;
        }

        if (results.value.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'Информация',
                detail: 'Нет данных за выбранный период',
                life: 3000,
            });
        }
    } catch (error: any) {
        console.error('Ошибка загрузки результатов:', error);

        let errorMessage = 'Не удалось загрузить результаты';
        if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }

        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: errorMessage,
            life: 4000,
        });
    } finally {
        isLoading.value = false;
    }
};

const handleExport = async () => {
    if (isExporting.value) return;

    isExporting.value = true;

    try {
        const params: any = {};
        const dateRange = filters.value.dateRange || { from: null, to: null };

        if (dateRange.from) {
            params.date_from = formatDateForAPI(dateRange.from);
        }
        if (dateRange.to) {
            params.date_to = formatDateForAPI(dateRange.to);
        }
        if (!props.dateOnly && isValidId(filters.value.project)) {
            params.project = Number(filters.value.project);
            if (isValidId(filters.value.point)) {
                params.point = Number(filters.value.point);
            }
        }
        if (!props.dateOnly && isValidId(filters.value.user)) {
            params.user = Number(filters.value.user);
        }

        params.export = 1;

        const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        if (!token) {
            throw new Error('Пользователь не авторизован');
        }

        const blob = await props.exportStaffResultsTotal(params);

        const url = window.URL.createObjectURL(blob);

        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
            throw new Error('Не удалось открыть новую вкладку. Проверьте настройки блокировщика всплывающих окон.');
        }

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);

        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Экспорт открыт в новой вкладке',
            life: 3000,
        });
    } catch (error: any) {
        console.error('Ошибка экспорта:', error);

        let errorMessage = 'Не удалось экспортировать данные';
        if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }

        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: errorMessage,
            life: 4000,
        });
    } finally {
        isExporting.value = false;
    }
};

const loadProjectsAndPoints = async () => {
    try {
        // Всегда вызываем loadProjects - он сам проверит кэш внутри
        const loadedProjects = await loadProjects(false);
        console.log('[StaffResultsModal] Проекты загружены/из кэша:', loadedProjects.length);
        await nextTick();
    } catch (error) {
        console.error('Ошибка загрузки проектов и точек:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка загрузки',
            detail: 'Не удалось загрузить список проектов и точек',
            life: 4000,
        });
    }
};

const loadAgentsData = async (projectId?: number) => {
    try {
        // Загружаем агентов для конкретного проекта, если он выбран
        // Store проверит кэш внутри
        const loadedAgents = await loadAgents(projectId, false);
        console.log('[StaffResultsModal] Агенты загружены/из кэша для проекта', projectId || 'all', ':', loadedAgents.length);
    } catch (error) {
        console.error('Ошибка загрузки агентов:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка загрузки',
            detail: 'Не удалось загрузить список агентов',
            life: 4000,
        });
    }
};

const closeModal = async () => {
    try {
        await nextTick();
        emit('close');
    } catch (error) {
        console.error('Error closing modal:', error);
        emit('close');
    }
};

watch(() => props.visible, async (newVal) => {
    if (newVal) {
        setYesterdayAsDefault();

        // Всегда вызываем загрузку - store сам проверит кэш и вернет данные из кэша или загрузит новые
        // Это гарантирует, что данные будут загружены при первом открытии после обновления страницы
        isLoadingData.value = true;

        const promises: Promise<any>[] = [];

        if (!props.dateOnly) {
            promises.push(
                loadProjectsAndPoints(), // Store проверит кэш внутри
                loadAgentsData(filters.value.project) // Загружаем агентов для выбранного проекта (если есть)
            );
        }

        loadResults();

        try {
            await Promise.all(promises);
        } finally {
            isLoadingData.value = false;
        }
    }
});

// При изменении проекта перезагружаем агентов для этого проекта
watch(() => filters.value.project, async (newProjectId, oldProjectId) => {
    if (newProjectId && newProjectId !== oldProjectId) {
        try {
            await loadAgentsData(newProjectId);
            // Сбрасываем выбранного агента, так как список изменился
            filters.value.user = undefined;
        } catch (error) {
            console.error('Ошибка загрузки агентов для проекта:', error);
        }
    } else if (!newProjectId) {
        filters.value.user = undefined;
    }
});

onMounted(() => {
    setYesterdayAsDefault();
});

onUnmounted(() => {
    isLoading.value = false;
});
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    z-index: 999;
    inset: 0;
    display: flex;
    align-items: center;
}

.modal-header {
    padding: 24px 24px 16px 24px;
    border-bottom: 1px solid var(--russ-border);
    background: var(--russ-bg-secondary);
}

.modal-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-title i {
    font-size: 24px;
    color: var(--russ-primary);
    background: var(--russ-bg-blue-lighter);
    padding: 8px;
    border-radius: 8px;
}

.modal-title h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--russ-primary);
}

.modal-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
}



.filters-section :deep(.base-select-wrapper) {
    width: 100%;
}

.filters-section :deep(.base-select-combo) {
    padding: 8px 16px 8px 12px;
    font-size: 13px;
    height: 36px;
    min-height: 36px;
    border: 1.5px solid var(--russ-border);
    border-radius: 10px;
    background: var(--russ-bg-quaternary);
    box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
    color: var(--russ-text-primary);
}

.filters-section :deep(.base-select-combo:focus) {
    border-color: var(--russ-secondary);
    box-shadow: 0 0 0 3px var(--russ-shadow-secondary);
    background: var(--russ-input-bg);
}

.filters-section :deep(.base-select-combo--readonly) {
    border: 1.5px solid var(--russ-border);
    border-radius: 10px;
    background: var(--russ-bg-quaternary);
    box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
    padding: 8px 16px 8px 12px;
    font-size: 13px;
    height: 36px;
    min-height: 36px;
    color: var(--russ-text-primary);
}

.filters-section :deep(.base-select-arrow) {
    right: 12px;
    width: 18px;
    height: 18px;
    background-size: 18px;
}

.apply-filters-btn {
    background: var(--russ-primary);
    color: var(--russ-text-inverse);
    border: 1px solid var(--russ-primary);
    border-radius: 10px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36px;
    min-height: 36px;
    width: 100%;
    white-space: nowrap;
}

.apply-filters-btn:hover:not([disabled]) {
    background: var(--russ-primary-dark);
    border-color: var(--russ-primary-dark);
}

.apply-filters-btn:active:not([disabled]) {
    transform: translateY(1px);
}

.btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
}

.btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.btn-icon i {
    font-size: 14px;
}

.btn-icon .loader {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.btn-text {
    font-weight: 600;
    font-size: 13px;
}

.apply-filters-btn[disabled] {
    background: var(--russ-border);
    color: var(--russ-text-quaternary);
    border-color: var(--russ-border-dark);
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
}

.disabled-btn {
    background: var(--russ-bg-disabled) !important;
    color: var(--russ-text-quaternary) !important;
    border: 2px solid var(--russ-border-dark) !important;
    cursor: not-allowed !important;
    opacity: 0.8 !important;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06) !important;
}

.disabled-btn:hover {
    background: linear-gradient(135deg, var(--russ-bg-disabled) 0%, var(--russ-border) 100%) !important;
    color: var(--russ-text-quaternary) !important;
    transform: none !important;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06) !important;
}

.loading-btn {
    background: var(--russ-primary) !important;
    color: white !important;
    cursor: wait !important;
    opacity: 0.8;
}

.loading-btn:hover {
    background: var(--russ-primary) !important;
    transform: none !important;
}

.results-section {
    flex: 1;
    min-height: 300px;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px;
    color: var(--russ-text-tertiary);
}

.loader {
    width: 32px;
    height: 32px;
    border: 3px solid var(--russ-border);
    border-top: 3px solid var(--russ-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px;
    color: var(--russ-text-tertiary);
}

.empty-state i {
    font-size: 48px;
    color: var(--russ-border-dark);
}

.results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.result-card {
    background: #fff;
    border: 1px solid var(--russ-border);
    border-radius: 12px;
    padding: 10px;
    transition: all 0.2s ease;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--russ-bg-tertiary);
}

.result-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.result-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--russ-primary);
}

.result-handler-id {
    font-size: 12px;
    color: var(--russ-text-tertiary);
    background: var(--russ-bg-tertiary);
    padding: 4px 8px;
    border-radius: 6px;
}

.status-badge {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 9999px;
    border: 1px solid transparent;
}

.status-confirmed {
    color: var(--russ-success-dark);
    background: var(--russ-success-light);
    border-color: var(--russ-success);
}

.status-pending {
    color: var(--russ-warning-dark);
    background: var(--russ-warning-light);
    border-color: var(--russ-warning);
}

.status-rejected {
    color: var(--russ-error-dark);
    background: var(--russ-error-light);
    border-color: var(--russ-error);
}

.result-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.field-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--russ-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--russ-border);
}

.field-name {
    font-size: 14px;
    color: var(--russ-text-secondary);
    font-weight: 500;
}

.field-value {
    font-size: 16px;
    font-weight: 700;
    color: var(--russ-primary);
    background: var(--russ-bg-blue-lighter);
    padding: 4px 8px;
    border-radius: 6px;
    min-width: 60px;
    text-align: center;
}

.modal-actions {
    padding: 16px 24px;
    border-top: 1px solid var(--russ-border);
    background: var(--russ-bg-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.btn-export {
    background: linear-gradient(135deg, var(--russ-success) 0%, var(--russ-success-dark) 100%);
    color: var(--russ-text-inverse);
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px var(--russ-shadow-success);
}

.btn-export:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--russ-success-dark) 0%, var(--russ-success-dark) 100%);
    box-shadow: 0 4px 12px var(--russ-shadow-success);
}

.btn-export:disabled {
    background: var(--russ-text-quaternary);
    color: var(--russ-text-tertiary);
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow: none;
}

.btn-export-loading {
    background: linear-gradient(135deg, var(--russ-success) 0%, var(--russ-success-dark) 100%) !important;
    color: var(--russ-text-inverse) !important;
    cursor: wait !important;
}

.btn-export-loading:hover {
    background: linear-gradient(135deg, var(--russ-success) 0%, var(--russ-success-dark) 100%) !important;
    transform: none !important;
}

.btn-export .loader {
    width: 16px;
    height: 16px;
    border: 2px solid var(--russ-text-inverse);
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.btn-close {
    background: var(--russ-bg-disabled);
    color: var(--russ-text-secondary);
    border: 1px solid var(--russ-border-dark);
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-close:hover {
    background: var(--russ-border);
    color: var(--russ-primary);
    border-color: var(--russ-primary);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Ensure proper cleanup during transitions */
.fade-leave-active {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

@media (max-width: 900px) {
    .modal-overlay {
        padding: max(8px, env(safe-area-inset-top, 0px)) max(8px, env(safe-area-inset-right, 0px)) max(60px, env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px));
        align-items: flex-start;
        padding-top: max(20px, env(safe-area-inset-top, 0px) + 8px);
    }

    .glassy-modal {
        min-width: 0;
        width: 98vw;
        border-radius: 10px;
        max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 80px);
        margin-top: 0;
        margin-bottom: 20px;
    }

    .modal-content {
        gap: 16px;
    }

    .results-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .modal-actions {
        flex-direction: column;
        gap: 8px;
    }

    .btn-export,
    .btn-close {
        width: 100%;
        justify-content: center;
    }

    .modal-header {
        padding: 16px;
    }

    .modal-actions {
        padding: 12px 16px;
    }
}

@media (max-width: 480px) {
    .modal-overlay {
        padding: max(8px, env(safe-area-inset-top, 0px)) max(8px, env(safe-area-inset-right, 0px)) max(80px, env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px));
        align-items: flex-start;
        padding-top: max(16px, env(safe-area-inset-top, 0px) + 8px);
    }

    .glassy-modal {
        width: 95vw;
        margin: 0;
        margin-bottom: 20px;
        max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 100px);
    }



    .result-card {
        padding: 16px;
    }

    .result-title {
        font-size: 16px;
    }

    .field-item {
        padding: 5;
    }

    .field-name {
        font-size: 13px;
    }

    .field-value {
        font-size: 14px;
    }
}



.select-hint {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--russ-warning-light) 0%, var(--russ-warning-light) 100%);
    border: 1px solid var(--russ-warning);
    border-radius: 12px;
    box-shadow: 0 2px 8px var(--russ-shadow-warning);
    position: relative;
    overflow: hidden;
}

.select-hint::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--russ-warning) 0%, var(--russ-warning-dark) 100%);
}

.hint-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, var(--russ-warning) 0%, var(--russ-warning-dark) 100%);
    border-radius: 50%;
    color: var(--russ-text-inverse);
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 2px;
}

.hint-content {
    flex: 1;
}

.hint-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--russ-warning-dark);
    margin-bottom: 2px;
}

.hint-text {
    font-size: 12px;
    color: var(--russ-warning-dark);
    line-height: 1.4;
}
</style>
