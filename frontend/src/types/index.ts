export interface Student {
  id: string;
  name: string;
  phone?: string;
  age?: number;
  grade?: string;
  notes?: string;
  start_date: string;
  is_active: boolean;
  created_at: string;
  completed_lesson_count: number;
  purchased_lesson_count: number;
  remaining_lessons: number;
}

export interface StudentDetail extends Student {
  lessons: Lesson[];
  payments: Payment[];
  schedule_slots: ScheduleSlot[];
}

export interface Lesson {
  id: string;
  student_id?: string;
  group_class_id?: string;
  date: string;
  duration: number;
  content?: string;
  status: "scheduled" | "completed" | "cancelled";
  is_rescheduled: boolean;
  created_at: string;
  student_name?: string;
  group_class_name?: string;
}

export interface Payment {
  id: string;
  student_id?: string;
  group_class_id?: string;
  date: string;
  amount: number;
  validity_start: string;
  validity_end: string;
  payment_method: string;
  lesson_count: number;
  notes?: string;
  created_at: string;
  student_name?: string;
}

export interface GroupClass {
  id: string;
  name: string;
  total_lessons: number;
  completed_lessons: number;
  price: number;
  start_date: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  student_count: number;
  remaining_lessons: number;
}

export interface GroupClassDetail extends GroupClass {
  students: Student[];
  schedule_slots: ScheduleSlot[];
}

export interface ScheduleSlot {
  id: string;
  schedule_type: "individual" | "group";
  student_id?: string;
  group_class_id?: string;
  weekday: number;
  hour: number;
  minute: number;
  duration: number;
  location?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  display_name: string;
  weekday_name: string;
  time_string: string;
}

export interface Statistics {
  total_lessons: number;
  total_income: number;
  active_students: number;
  monthly_lessons: { month: string; count: number }[];
  monthly_income: { month: string; amount: number }[];
  student_distribution: { name: string; count: number }[];
}

export interface BackupInfo {
  filename: string;
  size: number;
  created_at: string;
}
