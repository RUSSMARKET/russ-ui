<template>
  <div class="client-registration-widget">
    <div class="widget-header">
      <h3 class="widget-title">{{ title }}</h3>
      <p v-if="description" class="widget-description">{{ description }}</p>
    </div>

    <div v-if="isClientsLoading" class="mini-loader" style="margin-bottom: 16px;" />
    <div v-if="recentClients.length > 0" class="recent-clients-slider-block">
      <div class="recent-clients-header">
        <div class="recent-clients-title">Последние клиенты</div>
        <div class="slider-controls">
          <button @click="scrollSlider(-1)" class="slider-arrow" aria-label="Назад">‹</button>
          <button @click="scrollSlider(1)" class="slider-arrow" aria-label="Вперед">›</button>
        </div>
      </div>
      <div 
        class="recent-clients-slider" 
        ref="sliderContainer"
        @mousedown.prevent="handleMouseDown"
        @mouseleave="handleMouseLeave"
        @mouseup="handleMouseUp"
        @mousemove="handleMouseMove"
      >
        <div v-for="client in recentClients" :key="client.id" class="recent-client-card" @click="selectClient(client)">
          <div class="recent-client-fio">{{ [client.surname, client.name, client.patronymic].filter(Boolean).join(' ') }}</div>
          <div class="recent-client-phone">{{ client.phone }}</div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-row">
        <InputPhone 
          type="text" 
          v-model="phone" 
          :disabled="isLoading"
        />
        <span v-if="isSearching" class="mini-loader"></span>
      </div>

      <div v-if="foundClient" class="client-card found">
        <div class="client-info">
          <div class="client-name">{{ foundClient.fullName }}</div>
          <div class="client-phone">{{ foundClient.phone }}</div>
        </div>
        <div class="client-actions">
          <Button 
            label="Выбрать клиента" 
            @click="selectClient(foundClient)"
            class="select-client-btn"
            :disabled="isLoading"
          />
        </div>
      </div>

      <div v-if="isPhoneComplete(phone) && !foundClient && !isSearching" class="not-found-message" style="margin-bottom: 8px; font-weight: 500;">
        Клиент не найден, заполните поля
      </div>

      <div v-if="isPhoneComplete(phone)" class="registration-form">
        <div class="form-row">
          <label>Фамилия<span class="required">*</span></label>
          <InputText 
            v-model="lastName" 
            placeholder="Введите фамилию" 
            :disabled="isLoading"
          />
        </div>
        <div class="form-row">
          <label>Имя<span class="required">*</span></label>
          <InputText 
            v-model="firstName" 
            placeholder="Введите имя" 
            :disabled="isLoading"
          />
        </div>
        <div class="form-row">
          <label>Отчество</label>
          <InputText 
            v-model="middleName" 
            placeholder="Введите отчество" 
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-actions">
          <Button 
            label="Зарегистрировать клиента"
            @click="registerClient"
            :disabled="!isFormValid || isLoading"
            :loading="isLoading"
            class="register-btn"
          />

        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { InputPhone, InputText, Button } from "~/shared/ui";
import { addClientApi, fetchClientByPhone } from "~/pages/clients/api";
import { http } from "@/shared/api";

const props = defineProps({
  title: {
    type: String,
    default: 'Регистрация клиента'
  },
  description: {
    type: String,
    default: ''
  },
  onClientRegistered: {
    type: Function,
    default: null
  },
  onClientSelected: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['client-registered', 'client-selected', 'error']);

const phone = ref("");
const foundClient = ref(null);
const lastName = ref("");
const firstName = ref("");
const middleName = ref("");
const showAddForm = ref(false);
const isSearching = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const agentClients = ref([]);
const isClientsLoading = ref(false);
const recentClients = ref([]);
const sliderContainer = ref(null);

const isDown = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

const isFormValid = computed(() => {
  if (foundClient.value) return true;
  return isPhoneComplete(phone.value) && lastName.value.trim() && firstName.value.trim();
});

function isPhoneComplete(phoneValue) {
  return phoneValue && phoneValue.length === 18 && !phoneValue.includes("_");
}

function resetForm() {
  phone.value = "";
  lastName.value = "";
  firstName.value = "";
  middleName.value = "";
  foundClient.value = null;
  showAddForm.value = false;
  errorMessage.value = "";
}

async function loadAgentClients() {
  isClientsLoading.value = true;
  try {
    const token = localStorage.getItem("access_token");
    const res = await http.get("/api/client", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const clientsFromServer = Array.isArray(res.data.data) ? res.data.data : [];
    
    agentClients.value = clientsFromServer.map(client => ({
      ...client,
      fullName: [client.surname, client.name, client.patronymic].filter(Boolean).join(' ')
    }));

    recentClients.value = [...agentClients.value]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

  } catch (e) {
    agentClients.value = [];
    recentClients.value = [];
  } finally {
    isClientsLoading.value = false;
  }
}

onMounted(loadAgentClients);

async function registerClient() {
  if (!isFormValid.value) {
    errorMessage.value = "Заполните все обязательные поля корректно";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const newClient = await addClientApi({
      phone: phone.value,
      name: firstName.value.trim(),
      surname: lastName.value.trim(),
      patronymic: middleName.value.trim(),
    });

    emit('client-registered', newClient);
    
    if (props.onClientRegistered) {
      props.onClientRegistered(newClient);
    }
    
    await loadAgentClients();

    resetForm();
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Ошибка при регистрации клиента";
    errorMessage.value = errorMsg;
    emit('error', errorMsg);
  } finally {
    isLoading.value = false;
  }
}

function selectClient(client) {
  emit('client-selected', client);
  if (props.onClientSelected) {
    props.onClientSelected(client);
  }
}

watch(phone, async (val) => {
  if (!isPhoneComplete(val)) {
    foundClient.value = null;
    showAddForm.value = false;
    errorMessage.value = "";
    return;
  }

  isSearching.value = true;
  errorMessage.value = "";

  try {
    const client = await fetchClientByPhone(val);
    if (client) {
      foundClient.value = {
        ...client,
        fullName: [client.surname, client.name, client.patronymic].filter(Boolean).join(' ')
      };
      showAddForm.value = false;
    } else {
      foundClient.value = null;
      showAddForm.value = true;
    }
  } catch (error) {
    errorMessage.value = "Ошибка при поиске клиента";
    emit('error', errorMessage.value);
  } finally {
    isSearching.value = false;
  }
});

function scrollSlider(direction) {
  if (sliderContainer.value) {
    const scrollAmount = sliderContainer.value.clientWidth * 0.8;
    sliderContainer.value.scrollBy({
      left: scrollAmount * direction,
      behavior: 'smooth'
    });
  }
}

function handleMouseDown(e) {
  const slider = sliderContainer.value;
  if (!slider) return;
  isDown.value = true;
  slider.classList.add('active-grab');
  startX.value = e.pageX - slider.offsetLeft;
  scrollLeft.value = slider.scrollLeft;
}

function handleMouseLeave() {
  const slider = sliderContainer.value;
  if (!slider) return;
  isDown.value = false;
  slider.classList.remove('active-grab');
}

function handleMouseUp() {
  const slider = sliderContainer.value;
  if (!slider) return;
  isDown.value = false;
  slider.classList.remove('active-grab');
}

function handleMouseMove(e) {
  const slider = sliderContainer.value;
  if (!isDown.value || !slider) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX.value) * 2;
  slider.scrollLeft = scrollLeft.value - walk;
}
</script>

<style scoped>
.client-registration-widget {
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.widget-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.widget-description {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.client-card.found {
  background: #f8fafc;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 16px;
}

.client-info {
  margin-bottom: 12px;
}

.client-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 16px;
  margin-bottom: 4px;
}

.client-phone {
  color: #64748b;
  font-size: 14px;
}

.client-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.registration-form {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.register-btn {
  flex: 1;
  min-width: 200px;
}

.cancel-btn {
  min-width: 100px;
}

.select-client-btn {
  background: #10b981;
  border-color: #10b981;
}

.select-client-btn:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.register-new-btn {
  background: #f59e0b;
  border-color: #f59e0b;
}

.register-new-btn:hover:not(:disabled) {
  background: #d97706;
  border-color: #d97706;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 16px;
}

.mini-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e0e8f7;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-left: 8px;
  vertical-align: middle;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {

  .widget-title {
    font-size: 16px;
  }
  .widget-description {
    font-size: 13px;
  }
}

@media (max-width: 640px) {
  .form-section, .form-actions, .client-actions {
    flex-direction: column !important;
    gap: 8px !important;
  }
  .form-row label {
    font-size: 13px;
  }
  .register-btn, .cancel-btn, .select-client-btn {
    width: 100% !important;
    min-width: 0 !important;
    font-size: 14px !important;
    padding: 10px 0 !important;
    border-radius: 6px !important;
    box-sizing: border-box;
  }
  .recent-client-card {
    min-width: 140px;
    width: 140px;
    padding: 8px 8px;
    font-size: 13px;
  }
  .recent-client-fio {
    font-size: 13px;
  }
  .recent-client-phone {
    font-size: 12px;
  }
}

.recent-clients-slider-block {
  margin-bottom: 24px;
}

.recent-clients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recent-clients-title {
  font-size: 16px;
  color: #1e293b;
  font-weight: 600;
}

.slider-controls {
  display: flex;
  gap: 8px;
}

.slider-arrow {
  background: #fff;
  color: #4f46e5;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  font-weight: bold;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.slider-arrow:hover {
  background: #f8fafc;
  border-color: #4f46e5;
  transform: scale(1.05);
}

.recent-clients-slider {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 10px;
  cursor: grab;
  scrollbar-width: none; 
}

.recent-clients-slider.active-grab {
  cursor: grabbing;
  cursor: -webkit-grabbing;
  transform: scale(1.02);
}

.recent-clients-slider::-webkit-scrollbar {
  display: none;
}

.recent-client-card {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  min-width: 200px;
  width: 200px;
  transition: background 0.18s, box-shadow 0.18s;
  box-shadow: 0 1px 3px rgba(37,99,235,0.04);
  flex-shrink: 0;
  user-select: none; 
}

.recent-client-card:hover {
  background: #e0e7ff;
  box-shadow: 0 2px 8px rgba(37,99,235,0.10);
}

.recent-client-fio {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.recent-client-phone {
  color: #64748b;
  font-size: 13px;
}
</style> 