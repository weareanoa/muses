-- Seed data jadwal asli MUSES. Tanggal future agar countdown publik jalan,
-- dan supaya /schedule tidak lagi tampil kosong setelah fallback JSON dihapus.
insert into public.schedules (
  id, tour_name, title, day, day_name, month, year,
  city, country, venue, status, door_open, show_time,
  ticket_url, poster_image, target_date
)
values
  (
    'muses-anniversary-1',
    '1ST ANNIVERSARY LIVE',
    'MUSES 1st Anniversary Live',
    '05', 'SABTU', 'DES', '2026',
    'JAKARTA', 'INDONESIA',
    'M Bloc Space',
    'Available',
    '13:00 WIB', '14:00 WIB',
    'https://www.loket.com/',
    '/images/muses_group_frame1.webp',
    '2026-12-05T14:00:00+07:00'
  ),
  (
    'muses-countdown-2026',
    'YEAR-END COUNTDOWN LIVE',
    'MUSES Year-End Countdown Live',
    '31', 'KAMIS', 'DES', '2026',
    'BEKASI', 'INDONESIA',
    'Revo Mall Bekasi',
    'Selling Fast',
    '17:00 WIB', '19:00 WIB',
    'https://www.loket.com/',
    '/images/tours/poster-1.svg',
    '2026-12-31T19:00:00+07:00'
  ),
  (
    'muses-fanmeeting-2027',
    'FAN MEETING 2027',
    'MUSES Fan Meeting 2027',
    '16', 'SABTU', 'JAN', '2027',
    'BANDUNG', 'INDONESIA',
    'Sasana Budaya Ganesha',
    'Coming Soon',
    '12:00 WIB', '13:00 WIB',
    null,
    '/images/tours/poster-2.svg',
    '2027-01-16T13:00:00+07:00'
  )
on conflict (id) do update set
  tour_name = excluded.tour_name,
  title = excluded.title,
  day = excluded.day,
  day_name = excluded.day_name,
  month = excluded.month,
  year = excluded.year,
  city = excluded.city,
  country = excluded.country,
  venue = excluded.venue,
  status = excluded.status,
  door_open = excluded.door_open,
  show_time = excluded.show_time,
  ticket_url = excluded.ticket_url,
  poster_image = excluded.poster_image,
  target_date = excluded.target_date;
