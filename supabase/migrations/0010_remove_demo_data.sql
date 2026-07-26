-- Remove only the known development/demo records. Real user-created records remain.
delete from public.campus_zones
where name in (
  'Academic Block A', 'Academic Block B', 'Academic Block C', 'Main Library',
  'Central Canteen', 'Sports Complex', 'Boys Hostel A', 'Boys Hostel B',
  'Girls Hostel A', 'Administration Block', 'Auditorium', 'Main Gate'
);

delete from public.colleges
where lower(btrim(name)) = 'loyola academy';
