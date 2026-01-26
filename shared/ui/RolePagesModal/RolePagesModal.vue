<template>
    <BaseModal
        v-model="modalVisible"
        title="Управление страницами роли"
        width="600px"
        @hide="onClose"
    >
        <div class="role-pages-modal">
            <div class="role-selector mb-4">
                <BaseSelect
                    id="roleSelect"
                    :model-value="selectedRoleId ?? undefined"
                    :options="roleOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Выберите роль для управления страницами"
                    label="Выберите роль:"
                    @update:model-value="handleRoleChange"
                />
            </div>

            <div v-if="isLoading" class="text-center py-4">
                <div class="loader"></div>
                <p class="mt-2 text-gray-600">Загрузка страниц роли...</p>
            </div>

            <div v-else-if="selectedRoleId && rolePages.length > 0" class="role-pages-list">
                <h3 class="text-lg font-semibold mb-3">Страницы роли:</h3>
                <div class="pages-container">
                    <div v-for="(page, index) in rolePages" :key="page.id" class="page-item"
                        :class="{ 'dragging': draggedIndex === index }" draggable="true"
                        @dragstart="onDragStart(index, $event)" @dragover.prevent @drop="onDrop(index, $event)"
                        @dragend="onDragEnd">
                        <div class="modal-page-content">
                            <div class="drag-handle">⋮⋮</div>
                            <div class="page-info">
                                <span class="page-name">{{ page.name }}</span>
                                <span class="page-code">({{ page.code }})</span>
                            </div>
                            <button @click="removePage(page)" class="remove-btn" title="Удалить страницу из роли"
                                :disabled="isRemoving">
                                🗑
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-4 text-right">
                    <Button label="Сохранить порядок" :loading="isSavingOrder"
                        :disabled="isSavingOrder || !hasOrderChanged" @click="savePageOrder" />
                </div>
            </div>

            <div v-else-if="selectedRoleId" class="no-pages-message">
                <p class="text-gray-500 text-center py-4">
                    У выбранной роли нет назначенных страниц.
                </p>
            </div>

            <div v-else class="select-role-message">
                <p class="text-gray-500 text-center py-4">
                    Выберите роль для управления её страницами.
                </p>
            </div>
        </div>

        <template #footer>
            <Button label="Закрыть" @click="onClose" />
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BaseModal from "../BaseModal/BaseModal.vue";
import { Button, BaseSelect } from "@/shared/ui";
import { useToast } from "primevue/usetoast";
import {
    FetchRolePages,
    RemovePageFromRole,
    UpdateRolePagePositions,
    type Page
} from "@/pages/admin/api/index";

interface Props {
    visible: boolean;
    roles: Array<{ id: number; name: string; label: string }>;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'pages-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();

// Computed для совместимости между visible/update:visible и v-model
const modalVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value)
});

const selectedRoleId = ref<number | null>(null);
const rolePages = ref<Page[]>([]);
const isLoading = ref(false);
const isRemoving = ref(false);
const isSavingOrder = ref(false);
const draggedIndex = ref<number | null>(null);
const originalOrder = ref<number[]>([]);

const roleOptions = computed(() =>
    props.roles.map(role => ({
        label: role.label,
        value: role.id
    }))
);

const hasOrderChanged = computed(() => {
    if (originalOrder.value.length !== rolePages.value.length) return false;
    return !originalOrder.value.every((id, index) => rolePages.value[index]?.id === id);
});

const onClose = () => {
    emit('update:visible', false);
    selectedRoleId.value = null;
    rolePages.value = [];
    originalOrder.value = [];
};

const handleRoleChange = async (value: number | string | undefined) => {
    selectedRoleId.value = value as number | null;
    if (!selectedRoleId.value) {
        rolePages.value = [];
        originalOrder.value = [];
        return;
    }

    await loadRolePages();
};

const loadRolePages = async () => {
    if (!selectedRoleId.value) return;

    isLoading.value = true;
    try {
        const response = await FetchRolePages(selectedRoleId.value);
        rolePages.value = response.pages;
        originalOrder.value = response.pages.map(page => page.id);
    } catch (error) {
        console.error('Ошибка при загрузке страниц роли:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при загрузке страниц роли: ${error}`,
            life: 5000
        });
    } finally {
        isLoading.value = false;
    }
};

const removePage = async (page: Page) => {
    if (!selectedRoleId.value) return;

    isRemoving.value = true;
    try {
        await RemovePageFromRole(selectedRoleId.value, page.id);
        rolePages.value = rolePages.value.filter(p => p.id !== page.id);
        emit('pages-updated');
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: `Страница "${page.name}" удалена из роли`,
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка при удалении страницы:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при удалении страницы: ${error}`,
            life: 5000
        });
    } finally {
        isRemoving.value = false;
    }
};

const onDragStart = (index: number, event: DragEvent) => {
    draggedIndex.value = index;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
    }
};

const onDrop = (dropIndex: number, event: DragEvent) => {
    event.preventDefault();
    if (draggedIndex.value === null || draggedIndex.value === dropIndex) return;

    const pages = [...rolePages.value];
    const draggedPage = pages[draggedIndex.value];
    pages.splice(draggedIndex.value, 1);
    pages.splice(dropIndex, 0, draggedPage);
    rolePages.value = pages;
};

const onDragEnd = () => {
    draggedIndex.value = null;
};

const savePageOrder = async () => {
    if (!selectedRoleId.value || !hasOrderChanged.value) return;

    isSavingOrder.value = true;
    try {
        const pageIds = rolePages.value.map(page => page.id);
        await UpdateRolePagePositions(selectedRoleId.value, pageIds);
        originalOrder.value = [...pageIds];
        emit('pages-updated');
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Порядок страниц успешно сохранен',
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка при сохранении порядка страниц:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при сохранении порядка страниц: ${error}`,
            life: 5000
        });
    } finally {
        isSavingOrder.value = false;
    }
};

watch(() => props.visible, (newVisible) => {
    if (!newVisible) {
        selectedRoleId.value = null;
        rolePages.value = [];
        originalOrder.value = [];
    }
});
</script>

<style scoped>
.role-pages-modal {
    min-height: 300px;
}

.pages-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
}

.page-item {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.page-item:last-child {
    border-bottom: none;
}

.page-item:hover {
    background: #f3f4f6;
}

.page-item.dragging {
    opacity: 0.5;
    background: #e5e7eb;
}

.modal-page-content {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
}

.drag-handle {
    color: #9ca3af;
    cursor: grab;
    font-size: 14px;
    user-select: none;
}

.page-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.page-name {
    font-weight: 500;
    color: #374151;
}

.page-code {
    font-size: 12px;
    color: #6b7280;
}

.remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.remove-btn:hover:not(:disabled) {
    background: #fef2f2;
}

.remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.no-pages-message,
.select-role-message {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
}

.mb-4 {
    margin-bottom: 1rem;
}

.mt-4 {
    margin-top: 1rem;
}

.mt-2 {
    margin-top: 0.5rem;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mb-3 {
    margin-bottom: 0.75rem;
}

.block {
    display: block;
}

.text-sm {
    font-size: 0.875rem;
}

.font-medium {
    font-weight: 500;
}

.text-lg {
    font-size: 1.125rem;
}

.font-semibold {
    font-weight: 600;
}

.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

.text-gray-500 {
    color: #6b7280;
}

.text-gray-600 {
    color: #4b5563;
}

.w-full {
    width: 100%;
}

.py-4 {
    padding-top: 1rem;
    padding-bottom: 1rem;
}

.px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
}

.loader {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #213e89;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
