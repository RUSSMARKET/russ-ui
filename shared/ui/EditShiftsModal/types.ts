// Types for EditShiftsModal component
// These types are extracted from the application to avoid direct dependencies

export interface Point {
  id: number;
  name: string;
  project_id: number;
  created_at: string;
  updated_at: string;
}

export interface ShiftDay {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  timezone: number;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  name: string;
  surname: string;
  patronymic: string | null;
  email: string | null;
  phone: string;
  disabled: number;
  role_id: number;
  code?: string;
  shifts: Record<string, ShiftDay> | [];
  point: Point[];
}

export interface PlannedShiftInterval {
  id: number;
  start_time: string;
  end_time: string;
  timezone: number;
}
