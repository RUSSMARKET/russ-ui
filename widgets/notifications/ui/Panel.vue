<script setup>
import { ref, onMounted } from 'vue'
import { useNotification } from '~/stores/notification'
import { storeToRefs } from 'pinia'

const NotificationShow = ref(false)
const notificationStore = useNotification()
const { notifications } = storeToRefs(notificationStore)

onMounted(async () => {
  await notificationStore.fetchNotifications()
})

const clearAll = async () => {
  await notificationStore.clearAllNotifications()
}

const deleteNotification = async (id) => {
  await notificationStore.removeNotification(id)
}
</script>

<template>
  <div>
    <i class="pi pi-bell" @click="NotificationShow = true" />

    <Drawer
      v-model:visible="NotificationShow"
      header="Оповещения"
      position="right"
      class="notification-drawer"
    >
      <div class="notification-header-bar" v-if="notifications && notifications.length">
        <button class="clear-all-btn" @click="clearAll">Очистить всё</button>
      </div>

      <div class="notification-wrapper">
        <div
          v-for="item in notifications"
          :key="item.id"
          :class="['notification', 'notification-' + item.severity]"
        >
          <div class="notification-header">
            <i
              v-if="item.severity === 'success'"
              class="pi pi-check"
              style="color: #10b981"
            ></i>
            <i
              v-else-if="item.severity === 'info'"
              class="pi pi-info-circle"
              style="color: #3b82f6"
            ></i>
            <i
              v-else-if="item.severity === 'warn'"
              class="pi pi-exclamation-triangle"
              style="color: #f59e0b"
            ></i>
            <i
              v-else-if="item.severity === 'error'"
              class="pi pi-times-circle"
              style="color: #ef4444"
            ></i>
            <i
              v-else-if="item.severity === 'secondary'"
              class="pi pi-circle"
              style="color: #6b7280"
            ></i>
            <i
              v-else-if="item.severity === 'contrast'"
              class="pi pi-circle-fill"
              style="color: #9ca3af"
            ></i>
            <i
              v-else
              class="pi pi-bell"
              style="color: #6b7280"
            ></i>

            <div class="notification-title" v-html="item.summary"></div>

            <i
              class="pi pi-times remove_icon"
              @click="deleteNotification(item.id)"
            ></i>
          </div>

          <div class="notification-content" v-html="item.detail"></div>
        </div>
        
        <div v-if="!notifications || !notifications.length" class="no-notifications">
          Нет уведомлений
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.notification-drawer {
  width: 30rem !important;
}

.notification-wrapper .notification {
  margin-bottom: 15px;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.notification-wrapper .notification:hover {
  
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-success {
  background-color: #d1fae5;
  border: 1px solid #10b981;
  border-left: 4px solid #10b981;
}

.notification-info {
  background-color: #dbeafe;
  border: 1px solid #3b82f6;
  border-left: 4px solid #3b82f6;
}

.notification-warn {
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-left: 4px solid #f59e0b;
}

.notification-error {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  border-left: 4px solid #ef4444;
}

.notification-secondary {
  background-color: #f3f4f6;
  border: 1px solid #6b7280;
  border-left: 4px solid #6b7280;
}

.notification-contrast {
  background-color: #1f2937;
  border: 1px solid #374151;
  border-left: 4px solid #374151;
}

.notification-contrast .notification-title {
  color: #f9fafb;
}

.notification-contrast .notification-content {
  color: #d1d5db;
}

.notification-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.remove_icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: #6b7280;
}

.remove_icon:hover {
  background-color: rgba(107, 114, 128, 0.1);
  color: #374151;
}

.notification-title {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
  color: #111827;
}

.notification-content {
  font-size: 14px;
  color: #374151;
}

.notification-header-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.clear-all-btn {
  background: transparent;
  color: #213e89;
  border: 1px solid #213e89;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background-color: #213e89;
  color: white;
}

.no-notifications {
  color: #999;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}
</style>
