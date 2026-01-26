<template>
  <div class="profile-section-card">
    <div class="profile-row">
      <span class="profile-label">Email:</span>
      <span class="profile-value">{{ filledUserData?.email || '-' }}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Статус:</span>
      <span class="profile-status confirmed">
        Подтверждена
      </span>
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
  min-width: 120px;
  font-weight: 600;
  font-size: 1.05em;
}
.profile-value {
  color: #213e89;
  font-weight: 500;
  word-break: break-word;
}
.profile-status {
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 8px;
  font-size: 1.02em;
  display: inline-block;
}
.profile-status.confirmed {
  background: #e0fbe0;
  color: #22c55e;
  border: 1.5px solid #22c55e;
}
.profile-status.unconfirmed {
  background: #fee2e2;
  color: #ef4444;
  border: 1.5px solid #ef4444;
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
  .profile-status {
    font-size: 0.97em;
    padding: 3px 8px;
    border-radius: 6px;
  }
}
</style> 