<template>
  <div class="profile-section-card">
    <div class="profile-subcard">
      <div class="profile-row">
        <span class="profile-label">Паспорт:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Кем выдан:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport_issued || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Дата выдачи:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport_date || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Код подразделения:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport_code || '-' }}</span>
      </div>
    </div>

    <div class="profile-subcard user-data-subcard">
      <div class="profile-subcard-title">Личные и банковские данные</div>
      <div class="profile-row">
        <span class="profile-label">Дата рождения:</span>
        <span class="profile-value">{{ filledUserData?.data?.birthday || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Место рождения:</span>
        <span class="profile-value">{{ filledUserData?.data?.birthday_place || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Адрес регистрации:</span>
        <span class="profile-value">{{ filledUserData?.data?.registration_address || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">ИНН:</span>
        <span class="profile-value">{{ filledUserData?.data?.inn || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Расчётный счёт:</span>
        <span class="profile-value">{{ filledUserData?.data?.bank_account || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">БИК банка:</span>
        <span class="profile-value">{{ filledUserData?.data?.bank_bik || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Банк:</span>
        <span class="profile-value">{{ filledUserData?.data?.bank_name || '-' }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps(['filledUserData'])
</script>
<style scoped>
.profile-section-card {
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.profile-subcard {
  padding: 1rem 1rem 0.3rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.user-data-subcard {
  background: #f5f7ff;
  border-color: #d4ddff;
}

.profile-subcard-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f2937;
  margin-bottom: 0.75rem;
}
.profile-row {
  display: flex;
  gap: 18px;
  align-items: center;
  font-size: 1.08rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid #e5e7eb;
}
.profile-row:last-child {
  border-bottom: none;
}
.profile-label {
  color: #6366f1;
  min-width: 160px;
  font-weight: 600;
  font-size: 1.05em;
}
.profile-value {
  color: #213e89;
  font-weight: 500;
  word-break: break-word;
}
@media (max-width: 600px) {
  .profile-section-card {
    padding: 0.5rem 0.2rem;
    border-radius: 8px;
    gap: 0.3rem;
  }
  .profile-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-size: 0.95rem;
    padding-bottom: 0.1rem;
  }
  .profile-label {
    min-width: 0;
    font-size: 0.95em;
  }
}
</style> 