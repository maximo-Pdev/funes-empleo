begin;
select plan(1);
select ok(current_database() is not null, 'La base aislada permite ejecutar pgTAP');
select * from finish();
rollback;
