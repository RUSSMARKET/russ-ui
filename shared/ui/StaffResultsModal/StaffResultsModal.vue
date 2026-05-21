<template>
    <BaseModal :modelValue="visible" size="lg" class="staff-results-base-modal reporting-modal"
        @update:modelValue="(v: boolean) => { if (!v) closeModal(); }">
        <template #header>
            <div class="modal-title">
                <i class="pi pi-chart-bar"></i>
                <h2>Итоги работы за период</h2>
            </div>
        </template>

        <div class="modal-content">
            <div class="reporting-modal-filters">
                <div class="reporting-modal-filters-head">
                    <span class="reporting-modal-filters-title">Параметры отчёта</span>
                    <span v-if="!dateOnly && activeContextLabel" class="reporting-modal-context">
                        <i class="pi pi-map-marker" aria-hidden="true"></i>
                        {{ activeContextLabel }}
                    </span>
                </div>
                <FiltersBar :filters="filterConfigs" :model-value="filterValues" :show-reset-button="false"
                    :show-mobile-button="false" @update:model-value="handleFiltersUpdate"
                    @filter-change="handleFilterChange" @filter-close="handleFilterClose" />
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
            <div class="reporting-modal-footer">
                <button
                    type="button"
                    class="reporting-header-action"
                    :disabled="isExporting || !results.length"
                    @click="handleExport"
                >
                    <span class="reporting-header-action-icon" aria-hidden="true">
                        <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-external-link'"></i>
                    </span>
                    <span class="reporting-header-action-label reporting-header-action-label--single">
                        {{ isExporting ? 'Открытие...' : 'Открыть в Excel' }}
                    </span>
                </button>
                <button type="button" class="reporting-header-action reporting-header-action--text-only" @click="closeModal">
                    <span class="reporting-header-action-label reporting-header-action-label--single">Закрыть</span>
                </button>
            </div>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { FiltersBar, type FilterConfig, BaseModal } from '@/shared/ui';
import { useToast } from '../Toast';
import { useProjects, useAgents } from '@/shared/composables';
import { applySingleProjectPointDefaults } from '../../utils';
import type { Agent } from '@/stores/agents';
import '../../styles/reporting-modal.css';

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

interface UserFilterOption {
    id: number;
    name: string;
}

interface Props {
    visible: boolean;
    /** Проект из фильтров страницы отчётности (при открытии модалки). */
    initialProject?: number;
    /** Точка из фильтров страницы отчётности (при открытии модалки). */
    initialPoint?: number;
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

const showProjectFilter = computed(() => projects.value.length !== 1);

const showPointFilter = computed(() => {
    if (!filters.value.project) return false;
    return getPointsByProjectId(filters.value.project).length !== 1;
});

const activeContextLabel = computed(() => {
    const parts: string[] = [];

    if (!showProjectFilter.value && filters.value.project) {
        const project = projects.value.find(p => p.id === filters.value.project);
        if (project?.name) parts.push(project.name);
    }

    if (!showPointFilter.value && filters.value.project && filters.value.point) {
        const point = getPointsByProjectId(filters.value.project).find(p => p.id === filters.value.point);
        if (point?.name) parts.push(point.name);
    }

    return parts.join(' · ');
});

const formatPersonName = (person: any): string => {
    return `${person?.surname || ''} ${person?.name || ''} ${person?.patronymic || ''}`.trim();
};

const getRgByProjectAndPoint = (projectId?: number, pointId?: number): UserFilterOption[] => {
    if (!projectId) return [];

    const project = projects.value.find((p: any) => p.id === projectId) as any;
    if (!project || !Array.isArray(project.points)) return [];

    const selectedPoints = pointId
        ? project.points.filter((pt: any) => pt.id === pointId)
        : project.points;

    const rgMap = new Map<number, UserFilterOption>();

    selectedPoints.forEach((pt: any) => {
        const leader = pt?.leader || pt?.group_leader || null;
        if (leader?.id && typeof leader.id === 'number') {
            const leaderName = formatPersonName(leader);
            if (leaderName) {
                rgMap.set(leader.id, { id: leader.id, name: leaderName });
            }
        }
    });

    return Array.from(rgMap.values());
};

const getAllRg = (): UserFilterOption[] => {
    const rgMap = new Map<number, UserFilterOption>();

    projects.value.forEach((project: any) => {
        if (!Array.isArray(project?.points)) return;

        project.points.forEach((pt: any) => {
            const leader = pt?.leader || pt?.group_leader || null;
            if (leader?.id && typeof leader.id === 'number') {
                const leaderName = formatPersonName(leader);
                if (leaderName) {
                    rgMap.set(leader.id, { id: leader.id, name: leaderName });
                }
            }
        });
    });

    return Array.from(rgMap.values());
};

const userOptions = computed(() => {
    // Если выбран проект и точка, показываем агентов только для этой точки
    // Если выбран только проект, показываем агентов для этого проекта
    // Если ничего не выбрано, показываем всех агентов и РГ
    let agentsToShow: Agent[] = [];
    let rgToShow: UserFilterOption[] = [];
    if (filters.value.project) {
        agentsToShow = getAgentsByProjectAndPoint(
            filters.value.project,
            filters.value.point
        );
        rgToShow = getRgByProjectAndPoint(filters.value.project, filters.value.point);
    } else {
        // Если проект не выбран, показываем всех агентов (из кэша 'all' или объединенных)
        agentsToShow = agents.value;
        rgToShow = getAllRg();
    }

    const combinedMap = new Map<number, UserFilterOption>();

    agentsToShow.forEach(agent => {
        combinedMap.set(agent.id, {
            id: agent.id,
            name: formatPersonName(agent),
        });
    });

    rgToShow.forEach(rg => {
        if (!combinedMap.has(rg.id)) {
            combinedMap.set(rg.id, rg);
        }
    });

    return [
        { id: undefined, name: 'Все агенты и РГ' },
        ...Array.from(combinedMap.values())
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
        if (showProjectFilter.value) {
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
            );
        }

        if (showPointFilter.value) {
            configs.push(
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
            );
        }

        configs.push(
            {
                key: 'user',
                type: 'select' as const,
                label: 'Агент / РГ',
                placeholder: (isLoadingData.value || isLoadingAgents.value) ? 'Загрузка списка...' : 'Выберите сотрудника',
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
        applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
    }
};

const handleFilterChange = async (key: string, value: any) => {
    if (key === 'project') {
        await onProjectChange();
    }
    scheduleLoadResults();
};

const handleFilterClose = () => {
    scheduleLoadResults();
};

let loadResultsTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleLoadResults = () => {
    if (!props.visible || isLoadingData.value) return;

    if (loadResultsTimer) {
        clearTimeout(loadResultsTimer);
    }

    loadResultsTimer = setTimeout(() => {
        loadResultsTimer = null;
        loadResults();
    }, 150);
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
    filters.value.user = undefined;

    applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);

    if (filters.value.project && filters.value.project !== undefined) {
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

let loadResultsRequestId = 0;

const loadResults = async () => {
    const requestId = ++loadResultsRequestId;
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

        let responseData: any[] = [];
        if (props.dateOnly) {
            const response = await props.fetchPlanReports(params);
            responseData = Array.isArray(response?.data) ? response.data : [];
        } else {
            const response = await props.fetchStaffResultsTotal(params);
            responseData = response.data;
        }

        if (requestId !== loadResultsRequestId) {
            return;
        }

        results.value = responseData;

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
        if (requestId === loadResultsRequestId) {
            isLoading.value = false;
        }
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

function applyInitialFiltersFromParent() {
    const projectId = Number(props.initialProject);
    if (Number.isFinite(projectId) && projectId > 0) {
        filters.value.project = projectId;
    }

    const pointId = Number(props.initialPoint);
    if (Number.isFinite(pointId) && pointId > 0) {
        filters.value.point = pointId;
    }
}

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

        isLoadingData.value = true;

        try {
            if (!props.dateOnly) {
                await loadProjectsAndPoints();
                applyInitialFiltersFromParent();
                applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
                await loadAgentsData(filters.value.project);
            }

            await loadResults();
        } finally {
            isLoadingData.value = false;
        }
    }
});

// При изменении проекта перезагружаем агентов для этого проекта
watch(() => filters.value.project, async (newProjectId, oldProjectId) => {
    if (newProjectId && newProjectId !== oldProjectId) {
        applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
        try {
            await loadAgentsData(newProjectId);
            filters.value.user = undefined;
        } catch (error) {
            console.error('Ошибка загрузки агентов для проекта:', error);
        }
    } else if (!newProjectId) {
        filters.value.user = undefined;
        filters.value.point = undefined;
    }
});

onMounted(() => {
    setYesterdayAsDefault();
});

onUnmounted(() => {
    if (loadResultsTimer) {
        clearTimeout(loadResultsTimer);
        loadResultsTimer = null;
    }
    loadResultsRequestId += 1;
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
    gap: 20px;
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
    background: var(--russ-bg);
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
    background: var(--russ-warning-light);
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
    background: var(--russ-warning);
}

.hint-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--russ-warning);
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
