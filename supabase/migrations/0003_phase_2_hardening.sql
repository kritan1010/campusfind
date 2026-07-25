create index if not exists colleges_requested_by_idx on public.colleges (requested_by);
create index if not exists colleges_reviewed_by_idx on public.colleges (reviewed_by);
create index if not exists profiles_college_id_idx on public.profiles (college_id);
create index if not exists listings_poster_id_idx on public.listings (poster_id);

alter policy "listings readable per community visibility rule"
  on public.listings
  using (public.can_view_listing(poster_id, (select auth.uid())));
alter policy "poster can insert own open listing"
  on public.listings
  with check (poster_id = (select auth.uid()) and status = 'open');
alter policy "poster can update own listing"
  on public.listings
  using (poster_id = (select auth.uid()))
  with check (poster_id = (select auth.uid()));
alter policy "poster can delete own listing"
  on public.listings
  using (poster_id = (select auth.uid()));

alter policy "images visible with their listing"
  on public.listing_images
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id
        and public.can_view_listing(listing.poster_id, (select auth.uid()))
    )
  );
alter policy "poster can insert listing images"
  on public.listing_images
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  );
alter policy "poster can update listing images"
  on public.listing_images
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  );
alter policy "poster can delete listing images"
  on public.listing_images
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  );

alter policy "attributes visible with their listing"
  on public.item_attributes
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id
        and public.can_view_listing(listing.poster_id, (select auth.uid()))
    )
  );
alter policy "poster can insert item attributes"
  on public.item_attributes
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  );
alter policy "poster can update item attributes"
  on public.item_attributes
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  );
alter policy "poster can delete item attributes"
  on public.item_attributes
  using (
    exists (
      select 1 from public.listings listing
      where listing.id = listing_id and listing.poster_id = (select auth.uid())
    )
  );

alter policy "authenticated users upload images for their listing"
  on storage.objects
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = (select auth.uid())
    )
  );
alter policy "posters update their listing image objects"
  on storage.objects
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = (select auth.uid())
    )
  );
alter policy "posters delete their listing image objects"
  on storage.objects
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from public.listings listing
      where listing.id::text = (storage.foldername(name))[1]
        and listing.poster_id = (select auth.uid())
    )
  );

-- Some hosted projects install this event-trigger helper outside project
-- migrations. It should never be callable through the Data API.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
