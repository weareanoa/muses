import { getSupabaseClient } from '../lib/supabase';
import { withBaseDeep } from '../lib/paths';
import schedulesDataRaw from '../data/schedules.json';
import type { ScheduleDTO, ServiceResult } from '../types/database';

const fallbackSchedules = withBaseDeep(schedulesDataRaw) as ScheduleDTO[];

function mapDbScheduleToDto(row: any): ScheduleDTO {
  return {
    id: row.id,
    tourName: row.tour_name || row.tourName,
    title: row.title,
    day: row.day,
    dayName: row.day_name || row.dayName,
    month: row.month,
    year: row.year,
    city: row.city,
    country: row.country || 'INDONESIA',
    venue: row.venue,
    status: row.status || 'Available',
    doorOpen: row.door_open || row.doorOpen,
    showTime: row.show_time || row.showTime,
    ticketUrl: row.ticket_url || row.ticketUrl || '#',
    posterImage: row.poster_image || row.posterImage,
    targetDate: row.target_date || row.targetDate,
  };
}

export const scheduleService = {
  getInitialSchedules(): ScheduleDTO[] {
    return fallbackSchedules;
  },

  async getSchedules(filter?: {
    city?: string;
    status?: string;
  }): Promise<ServiceResult<ScheduleDTO[]>> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        let query = sb.from('schedules').select('*').order('target_date', { ascending: true });
        if (filter?.city) {
          query = query.ilike('city', `%${filter.city}%`);
        }
        if (filter?.status) {
          query = query.eq('status', filter.status);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped = withBaseDeep(data.map(mapDbScheduleToDto)) as ScheduleDTO[];
          return { success: true, data: mapped };
        }
      } catch (err) {
        console.error('Failed to fetch schedules from Supabase, using fallback:', err);
      }
    }

    let items = [...fallbackSchedules];
    if (filter?.city) {
      const q = filter.city.toLowerCase();
      items = items.filter((s) => s.city.toLowerCase().includes(q));
    }
    if (filter?.status) {
      items = items.filter((s) => s.status.toLowerCase() === filter.status!.toLowerCase());
    }
    return { success: true, data: items };
  },

  async getScheduleById(id: string): Promise<ServiceResult<ScheduleDTO>> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('schedules').select('*').eq('id', id).single();
        if (!error && data) {
          return { success: true, data: withBaseDeep(mapDbScheduleToDto(data)) as ScheduleDTO };
        }
      } catch {}
    }

    const found = fallbackSchedules.find((s) => s.id === id);
    if (!found) {
      return { success: false, error: 'Jadwal tidak ditemukan.' };
    }
    return { success: true, data: found };
  },

  async upsertSchedule(schedule: ScheduleDTO): Promise<ServiceResult<ScheduleDTO>> {
    const sb = getSupabaseClient();
    if (!sb) {
      // Dulu fungsi ini mengembalikan success: true padahal tidak ada
      // yang tersimpan ke mana-mana. Untuk admin itu menyesatkan, jadi
      // sekarang gagal secara eksplisit kalau Supabase belum dikonfigurasi.
      // (Bacaan publik tetap memakai fallback JSON di getSchedules.)
      return {
        success: false,
        error: 'Supabase belum dikonfigurasi, jadi jadwal tidak bisa disimpan.',
      };
    }

    const { data, error } = await sb
      .from('schedules')
      .upsert({
        id: schedule.id,
        tour_name: schedule.tourName,
        title: schedule.title || schedule.tourName,
        day: schedule.day,
        day_name: schedule.dayName,
        month: schedule.month,
        year: schedule.year,
        city: schedule.city,
        country: schedule.country,
        venue: schedule.venue,
        status: schedule.status,
        door_open: schedule.doorOpen,
        show_time: schedule.showTime,
        ticket_url: schedule.ticketUrl,
        poster_image: schedule.posterImage,
        target_date: schedule.targetDate,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Gagal menyimpan jadwal.' };
    }
    return { success: true, data: mapDbScheduleToDto(data) };
  },

  async deleteSchedule(id: string): Promise<ServiceResult<boolean>> {
    const sb = getSupabaseClient();
    if (!sb) {
      return {
        success: false,
        error: 'Supabase belum dikonfigurasi, jadi jadwal tidak bisa dihapus.',
      };
    }

    const { error } = await sb.from('schedules').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message || 'Gagal menghapus jadwal.' };
    }
    return { success: true, data: true };
  },
};

