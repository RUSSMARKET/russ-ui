<template>
    <BaseModal :modelValue="visible" size="sm" max-width="520px" class="effectiveness-base-modal"
        @update:modelValue="(v: boolean) => { if (!v) closeModal(); }">
        <template #header>
            <div class="modal-title">
                <i class="pi pi-chart-line"></i>
                <h2>Отчет по эффективности агентов</h2>
            </div>
        </template>

        <div class="modal-content">
            <div class="filters-section">
                <FiltersBar :filters="filterConfigs" :model-value="filterValues" :show-reset-button="false"
                    :show-mobile-button="false" @update:model-value="handleFiltersUpdate"
                    @filter-change="handleFilterChange" />
            </div>
        </div>

        <template #footer>
            <button class="btn-export" @click="handleExport"
                :disabled="isExporting || !filters.project || filters.project === undefined"
                :class="{ 'btn-export-loading': isExporting }">
                <i v-if="!isExporting && filters.project" class="pi pi-external-link"></i>
                <span v-if="isExporting" class="loader"></span>
                {{ isExporting ? 'Открытие...' : (filters.project ? 'Открыть в Excel' : 'Выберите проект') }}
            </button>
            <button class="btn-close" @click="closeModal">
                Закрыть
            </button>
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { FiltersBar, type FilterConfig, BaseModal } from '@/shared/ui';
import { useToast } from 'primevue/usetoast';
import { useProjects, useAgents } from '@/shared/composables';
import type { Agent } from '@/stores/agents';

export interface ShiftReportField {
    id?: number;
    key: string;
    label: string;
    name?: string;
}

interface ShiftReportFieldsByProjectsResponse {
    data: Array<{
        project_id: number;
        project_name: string;
        shift_report_fields: ShiftReportField[];
    }>;
}

interface Props {
    visible: boolean;
    exportEffectivenessReport: (params: {
        date_from?: string;
        date_to?: string;
        project: number;
        point?: number;
        user_id?: number;
        options?: string;
        sort_by?: string;
    }) => Promise<Blob>;
    fetchShiftReportFieldsByProjects: () => Promise<ShiftReportFieldsByProjectsResponse>;
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
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    project: undefined as number | undefined,
    point: undefined as number | undefined,
    user_id: undefined as number | undefined,
    options: undefined as string | undefined,
    sort_by: undefined as string | undefined,
});

const shiftReportFields = ref<Array<{ project_id: number; project_name: string; shift_report_fields: ShiftReportField[] }>>([]);
const isExporting = ref(false);
const isLoadingData = ref(false);
const isLoadingMetrics = ref(false);

const metricOptions = computed(() => {
    if (!filters.value.project) {
        return [{ id: undefined, name: 'Все метрики' }];
    }

    const projectFields = shiftReportFields.value.find(p => p.project_id === filters.value.project);
    if (!projectFields || !projectFields.shift_report_fields.length) {
        return [{ id: undefined, name: 'Все метрики' }];
    }

    return [
        { id: undefined, name: 'Все метрики' },
        ...projectFields.shift_report_fields.map(field => ({
            id: field.key,
            name: field.label
        }))
    ];
});

const sortByOptions = computed(() => {
    const baseOptions = [
        { id: undefined, name: 'По фамилии' },
        { id: 'shifts_count', name: 'По количеству смен' },
    ];

    // efficiency и total доступны только при указании options
    if (filters.value.options !== undefined) {
        baseOptions.push(
            { id: 'efficiency', name: 'По эффективности' },
            { id: 'total', name: 'По сумме выдач' }
        );
    }

    return baseOptions;
});

const projectOptions = computed(() =>
    projects.value.map(p => ({ id: p.id, name: p.name }))
);

const pointOptions = computed(() => {
    if (!filters.value.project) {
        return [{ id: undefined, name: 'Все точки' }];
    }
    const projectPoints = getPointsByProjectId(filters.value.project);
    return [
        { id: undefined, name: 'Все точки' },
        ...projectPoints.map(p => ({ id: p.id, name: p.name }))
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
        ...agentsToShow.map(a => ({
            id: a.id,
            name: `${a.surname || ''} ${a.name || ''} ${a.patronymic || ''}`.trim() || a.phone
        }))
    ];
});

const filterValues = computed(() => ({
    dateRange: filters.value.dateRange || { from: undefined, to: undefined },
    project: filters.value.project,
    point: filters.value.point,
    userId: filters.value.user_id,
    options: filters.value.options,
    sortBy: filters.value.sort_by,
}));

const filterConfigs = computed((): FilterConfig[] => [
    {
        key: 'dateRange',
        type: 'date-range' as const,
        label: 'Период',
        placeholder: 'Выберите период',
    },
    {
        key: 'project',
        type: 'select' as const,
        label: 'Проект',
        placeholder: (isLoadingData.value || isLoadingProjects.value) ? 'Загрузка...' : 'Проект',
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
        key: 'userId',
        type: 'select' as const,
        label: 'Агент',
        placeholder: (isLoadingData.value || isLoadingAgents.value) ? 'Загрузка агентов...' : 'Выберите агента',
        options: userOptions.value,
        optionLabel: 'name',
        optionValue: 'id',
        searchable: false,
        disabled: isLoadingData.value || isLoadingAgents.value,
    },
    {
        key: 'options',
        type: 'select' as const,
        label: 'Метрика',
        placeholder: isLoadingMetrics.value ? 'Загрузка метрик...' : (!filters.value.project || filters.value.project === undefined) ? 'Сначала выберите проект' : 'Все метрики',
        options: metricOptions.value,
        optionLabel: 'name',
        optionValue: 'id',
        searchable: false,
        disabled: isLoadingMetrics.value || !filters.value.project || filters.value.project === undefined,
    },
    {
        key: 'sortBy',
        type: 'select' as const,
        label: 'Сортировка',
        placeholder: 'По фамилии',
        options: sortByOptions.value,
        optionLabel: 'name',
        optionValue: 'id',
        searchable: false,
    },
]);

const handleFiltersUpdate = (values: Record<string, any>) => {
    filters.value.dateRange = values.dateRange || { from: undefined, to: undefined };
    filters.value.project = values.project || undefined;
    filters.value.point = values.point || undefined;
    filters.value.user_id = values.userId || undefined;
    filters.value.options = values.options || undefined;
    filters.value.sort_by = values.sortBy || undefined;
};

const handleFilterChange = (key: string, value: any) => {
    if (key === 'project') {
        onProjectChange();
    }
};

const onProjectChange = () => {
    filters.value.point = undefined;
    filters.value.options = undefined; // Сбрасываем выбранную метрику при смене проекта
};

// Сбрасываем sort_by при изменении options, если выбраны опции, требующие options
watch(() => filters.value.options, (newOptions) => {
    if (!newOptions && (filters.value.sort_by === 'efficiency' || filters.value.sort_by === 'total')) {
        filters.value.sort_by = undefined;
    }
});

const formatDateForAPI = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const handleExport = async () => {
    if (isExporting.value) return;

    // Проверяем, что проект выбран (обязательное поле)
    if (!filters.value.project || filters.value.project === undefined) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Необходимо выбрать проект для экспорта',
            life: 4000,
        });
        return;
    }

    isExporting.value = true;

    try {
        const params: any = {};
        const dateRange = filters.value.dateRange || { from: undefined, to: undefined };

        const dateFrom = formatDateForAPI(dateRange.from);
        const dateTo = formatDateForAPI(dateRange.to);

        if (dateFrom) {
            params.date_from = dateFrom;
        }
        if (dateTo) {
            params.date_to = dateTo;
        }
        // Проект обязателен
        params.project = filters.value.project;
        if (filters.value.point !== undefined) {
            params.point = filters.value.point;
        }
        if (filters.value.user_id !== undefined) {
            params.user_id = filters.value.user_id;
        }
        if (filters.value.options !== undefined) {
            params.options = filters.value.options;
        }
        if (filters.value.sort_by !== undefined) {
            params.sort_by = filters.value.sort_by;
        }

        const blob = await props.exportEffectivenessReport(params);

        // Проверяем, что blob валидный
        if (!blob || !(blob instanceof Blob)) {
            throw new Error('Получен неверный формат файла');
        }

        if (blob.size === 0) {
            throw new Error('Получен пустой файл');
        }

        console.log('Blob получен:', {
            size: blob.size,
            type: blob.type
        });

        // Создаем blob с правильным MIME типом, если он не установлен
        const excelBlob = blob.type
            ? blob
            : new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Создаем URL для blob
        const url = window.URL.createObjectURL(excelBlob);

        // Открываем в новой вкладке
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
            window.URL.revokeObjectURL(url);
            throw new Error('Не удалось открыть новую вкладку. Проверьте настройки блокировщика всплывающих окон.');
        }

        // Очищаем URL через некоторое время
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
        console.log('[EffectivenessModal] Проекты загружены/из кэша:', loadedProjects.length);
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
        console.log('[EffectivenessModal] Агенты загружены/из кэша для проекта', projectId || 'all', ':', loadedAgents.length);
        await nextTick();
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

const loadMetricsForProject = async (projectId: number) => {
    isLoadingMetrics.value = true;
    try {
        const response = await props.fetchShiftReportFieldsByProjects();
        shiftReportFields.value = response.data;
        await nextTick();
    } catch (error) {
        console.error('Ошибка загрузки метрик:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка загрузки',
            detail: 'Не удалось загрузить метрики для проекта',
            life: 4000,
        });
    } finally {
        isLoadingMetrics.value = false;
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

watch(() => props.visible, (newVal) => {
    if (newVal) {
        const now = new Date();
        const dateRange = filters.value.dateRange || { from: undefined, to: undefined };
        if (!dateRange.from) {
            dateRange.from = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        if (!dateRange.to) {
            dateRange.to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        filters.value.dateRange = dateRange;

        // Всегда вызываем загрузку - store сам проверит кэш и вернет данные из кэша или загрузит новые
        // Это гарантирует, что данные будут загружены при первом открытии после обновления страницы
        isLoadingData.value = true;

        const promises: Promise<any>[] = [
            loadProjectsAndPoints(), // Store проверит кэш внутри
            loadAgentsData(filters.value.project), // Загружаем агентов для выбранного проекта (если есть)
        ];

        // Метрики загружаем всегда (они специфичны для модалки)
        promises.push(
            props.fetchShiftReportFieldsByProjects().then(response => {
                shiftReportFields.value = response.data;
            }).catch(error => {
                console.error('Ошибка загрузки метрик:', error);
            })
        );

        Promise.all(promises).finally(() => {
            isLoadingData.value = false;
        });
    }
});

// При изменении проекта перезагружаем агентов для этого проекта
watch(() => filters.value.project, async (newProjectId, oldProjectId) => {
    if (!newProjectId) {
        filters.value.options = undefined;
        filters.value.user_id = undefined; // Сбрасываем выбранного агента
    }

    // Если проект изменился, загружаем агентов для нового проекта
    if (newProjectId && newProjectId !== oldProjectId) {
        try {
            await loadAgentsData(newProjectId);
            // Сбрасываем выбранного агента, так как список изменился
            filters.value.user_id = undefined;
        } catch (error) {
            console.error('Ошибка загрузки агентов для проекта:', error);
        }
    }
});

onMounted(() => {
    const now = new Date();
    filters.value.dateRange = {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
});
</script>

<style scoped>
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
    color: #213e89;
}

.modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.filters-section :deep(.filters-grid) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 16px;
}

@media (max-width: 500px) {
    .filters-section :deep(.filters-grid) {
        grid-template-columns: 1fr;
        gap: 10px;
    }
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
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
    background: #fff;
}

.filters-section :deep(.base-select-combo--readonly) {
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
    box-shadow: 0 1px 4px rgba(37, 99, 235, 0.04);
    padding: 8px 16px 8px 12px;
    font-size: 13px;
    height: 36px;
    min-height: 36px;
    color: #1e293b;
}

.filters-section :deep(.base-select-arrow) {
    right: 8px;
    width: 18px;
    height: 18px;
    background-size: 18px;
}

.loader {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.btn-export {
    background: linear-gradient(135deg, var(--russ-success) 0%, var(--russ-success-dark) 100%);
    color: white;
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
}

.btn-export:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--russ-success-dark) 0%, var(--russ-success-dark) 100%);
    box-shadow: 0 4px 12px var(--russ-shadow-primary);
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
    background: linear-gradient(135deg, var(--russ-primary) 0%, var(--russ-primary-dark) 100%) !important;
    color: white !important;
    cursor: wait !important;
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
</style>
