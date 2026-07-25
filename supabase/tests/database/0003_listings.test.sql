begin;

select plan(6);

select has_type('public', 'listing_kind', 'listing_kind enum exists');
select has_type('public', 'listing_status', 'listing_status enum exists');
select has_table('public', 'listings', 'listings table exists');
select has_table('public', 'listing_images', 'listing_images table exists');
select has_table('public', 'item_attributes', 'item_attributes table exists');
select has_view('public', 'listings_public', 'safe public listings view exists');

select * from finish();
rollback;
