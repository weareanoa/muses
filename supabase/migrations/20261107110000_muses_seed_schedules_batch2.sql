-- Batch kedua: 7 jadwal tambahan MUSES (Feb-Jul 2027), semuanya future date.
insert into public.schedules (
  id, tour_name, title, day, day_name, month, year,
  city, country, venue, status, door_open, show_time,
  ticket_url, poster_image, target_date
)
values
  (
    'muses-valentine-2027',
    'VALENTINE SPECIAL LIVE',
    'MUSES Valentine Special Live',
    '14', 'MINGGU', 'FEB', '2027',
    'JAKARTA', 'INDONESIA',
    'Balai Sarbini',
    'Available',
    '16:30 WIB', '18:00 WIB',
    'https://www.loket.com/',
    '/images/tours/poster-2.svg',
    '2027-02-14T18:00:00+07:00'
  ),
  (
    'muses-surabaya-minilive',
    'MINI LIVE & MEET AND GREET',
    'MUSES Mini Live & Meet and Greet Surabaya',
    '06', 'SABTU', 'MAR', '2027',
    'SURABAYA', 'INDONESIA',
    'Grand City Convex',
    'Available',
    '13:30 WIB', '15:00 WIB',
    'https://www.loket.com/',
    '/images/tours/poster-1.svg',
    '2027-03-06T15:00:00+07:00'
  ),
  (
    'muses-yogya-fanmeet',
    'FAN MEETING TOUR',
    'MUSES Fan Meeting Tour Yogyakarta',
    '27', 'SABTU', 'MAR', '2027',
    'YOGYAKARTA', 'INDONESIA',
    'Jogja Expo Center',
    'Selling Fast',
    '11:30 WIB', '13:00 WIB',
    'https://www.loket.com/',
    '/images/muses_group_frame1.webp',
    '2027-03-27T13:00:00+07:00'
  ),
  (
    'muses-medan-live',
    'MUSES LIVE IN MEDAN',
    'MUSES Live in Medan',
    '24', 'SABTU', 'APR', '2027',
    'MEDAN', 'INDONESIA',
    'Cambridge City Hall',
    'Available',
    '17:00 WIB', '18:30 WIB',
    'https://www.loket.com/',
    '/images/tours/poster-1.svg',
    '2027-04-24T18:30:00+07:00'
  ),
  (
    'muses-bali-live',
    'MUSES LIVE IN BALI',
    'MUSES Live in Bali',
    '15', 'SABTU', 'MEI', '2027',
    'DENPASAR', 'INDONESIA',
    'Bali Nusa Dua Convention Center',
    'Available',
    '17:00 WITA', '19:00 WITA',
    'https://www.loket.com/',
    '/images/tours/poster-2.svg',
    '2027-05-15T19:00:00+08:00'
  ),
  (
    'muses-midyear-live',
    'MID-YEAR SPECIAL LIVE',
    'MUSES Mid-Year Special Live',
    '12', 'SABTU', 'JUN', '2027',
    'JAKARTA', 'INDONESIA',
    'Ciputra Artpreneur Theater',
    'Coming Soon',
    '16:00 WIB', '18:00 WIB',
    null,
    '/images/muses_group_frame1.webp',
    '2027-06-12T18:00:00+07:00'
  ),
  (
    'muses-summer-fest',
    'SUMMER FEST 2027',
    'MUSES Summer Fest 2027',
    '17', 'SABTU', 'JUL', '2027',
    'TANGERANG', 'INDONESIA',
    'ICE BSD City',
    'Coming Soon',
    '14:00 WIB', '16:00 WIB',
    null,
    '/images/tours/poster-1.svg',
    '2027-07-17T16:00:00+07:00'
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
