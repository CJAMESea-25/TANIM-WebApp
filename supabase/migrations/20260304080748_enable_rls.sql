alter table profiles enable row level security;
alter table farms enable row level security;
alter table sensor_readings enable row level security;


create policy "Users can view own profiles"
on profiles for select using (auth.uid() = id);

create policy "Users can view own farms"
on farms for select using (owner_id = auth.uid());

create policy "Farmers can insert own farms"
on farms for insert with (check (owner_id = auth.uid()));

create policy "Farmers can update own farms"
on farms for update with (check (owner_id = auth.uid()));  

create policy "Farmer can view sensor readings"
on sensor_readings for select using (farm_id in (select id from farms where owner_id = auth.uid()));   

role text default 'farmer';

create policy "Admin can view all farms"
one farms for select using (exists(selec 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))

