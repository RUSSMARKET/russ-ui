import iconPersonal from '../assets/activation/personal.png'
import iconPassport from '../assets/activation/passport.png'
import iconInn from '../assets/activation/inn.png'
import iconSnils from '../assets/activation/snils.png'
import iconBank from '../assets/activation/bank.png'
import iconAgentType from '../assets/activation/agent-type.png'

export type ActivationStepId =
  | 'personal'
  | 'passport'
  | 'inn'
  | 'snils'
  | 'bank'
  | 'agent-type'

/** empty — не заполнено; review — на проверке; done — заполнено (на подписании); error — нужно исправить */
export type ActivationStepStatus = 'empty' | 'review' | 'done' | 'error'

export interface ActivationStep {
  id: ActivationStepId
  title: string
  icon: string
  /** Учитывается в счётчике «N из 5» */
  countsTowardProgress: boolean
}

export type ActivationStepsMap = Record<ActivationStepId, ActivationStepStatus>

export const EMPTY_ACTIVATION_STATUSES: ActivationStepsMap = {
  personal: 'empty',
  passport: 'empty',
  inn: 'empty',
  snils: 'empty',
  bank: 'empty',
  'agent-type': 'empty',
}

/** Хаб активации — как в макете Title+StepCard */
export const ACTIVATION_STEPS: ActivationStep[] = [
  {
    id: 'personal',
    title: 'Личные данные',
    icon: iconPersonal,
    countsTowardProgress: true,
  },
  {
    id: 'passport',
    title: 'Паспорт',
    icon: iconPassport,
    countsTowardProgress: true,
  },
  {
    id: 'inn',
    title: 'ИНН',
    icon: iconInn,
    countsTowardProgress: true,
  },
  {
    id: 'snils',
    title: 'СНИЛС',
    icon: iconSnils,
    countsTowardProgress: true,
  },
  {
    id: 'bank',
    title: 'Банковские реквизиты',
    icon: iconBank,
    countsTowardProgress: true,
  },
  {
    id: 'agent-type',
    title: 'Тип оформления',
    icon: iconAgentType,
    countsTowardProgress: false,
  },
]

export const ACTIVATION_PROGRESS_TOTAL = ACTIVATION_STEPS.filter(
  (step) => step.countsTowardProgress,
).length

export function activationStatusLabel(status: ActivationStepStatus): string {
  if (status === 'done') return 'Заполнено'
  if (status === 'review') return 'На проверке'
  if (status === 'error') return 'Нужно исправить'
  return 'Не заполнено'
}

/** Нормализует `user.activation.steps` из GET /api/user. */
export function normalizeActivationSteps(
  steps: Partial<Record<string, string>> | null | undefined,
): ActivationStepsMap {
  const next: ActivationStepsMap = { ...EMPTY_ACTIVATION_STATUSES }
  if (!steps || typeof steps !== 'object') return next

  for (const step of ACTIVATION_STEPS) {
    const raw = steps[step.id]
    if (raw === 'empty' || raw === 'review' || raw === 'done' || raw === 'error') {
      next[step.id] = raw
    }
  }

  return next
}
