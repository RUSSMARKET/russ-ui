<template>
  <div class="clients-list-widget">
    <div class="block last-clients-block">
      <div class="block-title">Последние клиенты</div>
      <div class="last-clients-cards">
        <div v-if="isLoading" class="clients-loader">
          <span class="loader"></span>
          <span class="loader-text">Пользователи загружаются…</span>
        </div>
        <div v-else-if="clients.length === 0" class="no-clients">
          Пользователи не найдены
        </div>
        <div v-else v-for="client in clients" :key="client.id" class="client-card">
          <div>
            <div v-for="(part, idx) in client.fullName.split(' ')" :key="idx">
              {{ part }}
            </div>
            <div class="client-phone">{{ client.phone }}</div>
          </div>
          <div class="phone-row">
            <button class="card-link" @click="$emit('select', client.id)">Выбрать</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  clients: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const deletingId = ref(null);

function handleDelete(id) {
  if (deletingId.value) return;
  deletingId.value = id;
  emit('delete', id);
}

function resetDeleting() {
  deletingId.value = null;
}

defineExpose({ resetDeleting });
</script>

<style scoped>
.clients-list-widget {
  width: 100%;
}
.block {
  background: #fff;
  border-radius: 10px;
  padding: 28px 28px;
  box-shadow: 0 1px 3px 0 #eee;
}
.block-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 18px;
}
.last-clients-cards {
  display: flex;
  justify-content: space-between;
}
.client-card {
  flex: 1 1 0;
  min-width: 180px;
  max-width: 220px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 16px 20px;
  box-sizing: border-box;
}
@media (max-width: 700px) {
  .last-clients-cards {
    flex-direction: column;
    gap: 16px;
  }
  .client-card {
    max-width: 100%;
    width: 100%;
  }
}
.client-phone {
  color: #888;
  margin: 6px 0 0 0;
  font-size: 14px;
}
.card-link {
  color: #2e7dfa;
  background: none;
  border: none;
  padding: 0;
  font-weight: 500;
  cursor: pointer;
  font-size: 15px;
  margin-top: 8px;
  align-self: flex-start;
}
.phone-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.no-clients {
  color: #888;
  font-size: 16px;
  padding: 24px 0;
  text-align: center;
  width: 100%;
}
.clients-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 56px;
}
.loader {
  width: 22px;
  height: 22px;
  border: 3px solid #e0e8f7;
  border-top: 3px solid #2e7dfa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
.loader-text {
  font-size: 15px;
  color: #2e7dfa;
}
.delete-link {
  color: #f34a4a;
  background: none;
  border: none;
  padding: 0;
  font-weight: 500;
  cursor: pointer;
  font-size: 15px;
  margin-top: 8px;
  align-self: flex-start;
  margin-left: 12px;
  transition: color 0.15s;
}
.delete-link:hover {
  color: #a90000;
}
</style> 