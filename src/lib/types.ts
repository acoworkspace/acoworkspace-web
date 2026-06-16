export type Sede = "Palermo" | "Monserrat";

export interface Room {
  id: string;
  name: string;
  description: string;
  sede: Sede;
  capacity: number;
  price_per_hour: number | null;
  price_per_day: number | null;
  points_per_hour: number;
  amenities: string[];
  images: string[];
  available_days: number[];
  available_from: string;
  available_to: string;
  is_active: boolean;
  google_calendar_id: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "pending";
  google_event_id: string | null;
  notes: string | null;
  created_at: string;
  room?: Room;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  aco_points: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  email?: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  booking_id: string | null;
  delta: number;
  description: string | null;
  created_at: string;
}
