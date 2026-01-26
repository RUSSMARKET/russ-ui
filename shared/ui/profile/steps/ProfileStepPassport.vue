<template>
  <div class="step-panel">
    <section class="form-wrapper">
      <h3 class="form-block-title">Паспортные данные</h3>
      <InputPassport :value="form.passport" @update:value="updateField('passport', $event)"
        placeholder="Номер паспорта *" class="form-input" :class="{ 'error': errors.passport }" />
      <div v-if="errors.passport" class="error-message">{{ errors.passport }}</div>
      <InputText :model-value="form.passport_issued" @update:model-value="updateField('passport_issued', $event)" placeholder="Кем выдан *" class="form-input"
        :class="{ 'error': errors.passport_issued }" />
      <div v-if="errors.passport_issued" class="error-message">{{ errors.passport_issued }}</div>
      <InputDate :model-value="form.passport_date" @update:model-value="updateField('passport_date', $event)" placeholder="Дата выдачи *" name="passport_date" />
      <div v-if="errors.passport_date" class="error-message">{{ errors.passport_date }}</div>
      <InputCode :value="form.passport_code" @update:value="updateField('passport_code', $event)"
        placeholder="Код подразделения *" class="form-input" :class="{ 'error': errors.passport_code }" />
      <div v-if="errors.passport_code" class="error-message">{{ errors.passport_code }}</div>
    </section>

    <section class="form-wrapper user-data-block">
      <h3 class="form-block-title">Личные и банковские данные</h3>
      <InputDate :model-value="form.birthday" @update:model-value="updateField('birthday', $event)" placeholder="Дата рождения *" name="birthday" />
      <div v-if="errors.birthday" class="error-message">{{ errors.birthday }}</div>
      <InputText :model-value="form.birthday_place" @update:model-value="updateField('birthday_place', $event)" placeholder="Место рождения *" class="form-input"
        :class="{ 'error': errors.birthday_place }" />
      <div v-if="errors.birthday_place" class="error-message">{{ errors.birthday_place }}</div>
      <InputText :model-value="form.registration_address" @update:model-value="updateField('registration_address', $event)" placeholder="Адрес регистрации *" class="form-input"
        :class="{ 'error': errors.registration_address }" />
      <div v-if="errors.registration_address" class="error-message">{{ errors.registration_address }}</div>
      <InputText :model-value="form.inn" @update:model-value="updateField('inn', $event)" placeholder="ИНН" class="form-input"
        :class="{ 'error': errors.inn }" />
      <div v-if="errors.inn" class="error-message">{{ errors.inn }}</div>
      <InputText :model-value="form.bank_account" @update:model-value="updateField('bank_account', $event)" placeholder="Расчётный счёт" class="form-input"
        :class="{ 'error': errors.bank_account }" />
      <div v-if="errors.bank_account" class="error-message">{{ errors.bank_account }}</div>
      <InputText :model-value="form.bank_bik" @update:model-value="updateField('bank_bik', $event)" placeholder="БИК банка" class="form-input"
        :class="{ 'error': errors.bank_bik }" />
      <div v-if="errors.bank_bik" class="error-message">{{ errors.bank_bik }}</div>
      <InputText :model-value="form.bank_name" @update:model-value="updateField('bank_name', $event)" placeholder="Название банка" class="form-input"
        :class="{ 'error': errors.bank_name }" />
      <div v-if="errors.bank_name" class="error-message">{{ errors.bank_name }}</div>
    </section>
    <div class="button-row spaced">
      <Button label="Назад" class="p-button-secondary" @click="$emit('back')" />
      <Button label="Продолжить" @click="$emit('continue')"
        :loading="isSubmitting" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { InputPassport, InputCode, InputText, InputDate, Button } from '@/shared/ui';

interface FormData {
  passport: string;
  passport_issued: string;
  passport_date: string;
  passport_code: string;
  birthday: string;
  birthday_place: string;
  registration_address: string;
  inn: string;
  bank_account: string;
  bank_bik: string;
  bank_name: string;
}

interface Props {
  form: FormData;
  errors: {
    passport: string;
    passport_issued: string;
    passport_date: string;
    passport_code: string;
    birthday: string;
    birthday_place: string;
    registration_address: string;
    inn: string;
    bank_account: string;
    bank_bik: string;
    bank_name: string;
  };
  isSubmitting: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:form', value: Partial<FormData>): void;
  (e: 'continue'): void;
  (e: 'back'): void;
}>();

const updateField = (field: keyof FormData, value: any) => {
  emit('update:form', { [field]: value });
};
</script>

<style scoped>
.step-panel {
  margin-top: 2rem;
}

.form-wrapper {
  border-radius: 1rem;
  padding: 1rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.user-data-block {
  background: #f5f7ff;
  border: 1px solid #d4ddff;
}

.form-block-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  font-size: clamp(0.8rem, calc(0.8rem + (0.95 - 0.8) * ((100vw - 320px) / (960 - 320))), 0.95rem);
  margin-bottom: 0.5rem;
}

.form-input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: clamp(0.75rem, calc(0.75rem + (0.85 - 0.75) * ((100vw - 320px) / (960 - 320))), 0.85rem);
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.button-row {
  margin: 1.5rem 0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-right: 20px;
}

.button-row.spaced {
  justify-content: space-between;
  padding-right: 20px;
}
</style>
