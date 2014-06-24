exports.testUserParams = [
[
  '0000000-0000-0000-0000-000000000000',
  'test0@test.com',
  true,
  new Date(),
  'hello0',
  'world',
  'first name',
  'last name',
  20,
  'address',
  'paymentinfo',
  1000,
  'fbid',
  0,
  'image'
],
[
  '0000000-0000-0000-0000-000000000001',
  'test1@test.com',
  true,
  new Date(),
  'hello1',
  'world',
  'first name',
  'last name',
  20,
  'address',
  'paymentinfo',
  0,
  'fbid',
  0,
  'image'
]
];

exports.contestSettings = [
[
  {
    0: 'a',
    1: 'b',
    2: 'c',
    3: 'd',
    4: '5'
  }, //athletes
  0,  //commission_earned
  new Date().setDate(new Date().getDate() + 1), //contest_deadline_time
  null, //contest_end_time
  '0000000-0000-0000-0000-000000000000', //contest_id
  new Date(), //contest_start_time
  0,  //contest_state
  {}, //contestants
  0,  //current_entries
  2, //entries_allowed_per_contestant
  1000, //entry_fee
  'daily prophet', //game_type
  null, //last_locked
  false,  //lock_current_entries
  8000,   //max_wager
  3, //maximum_entries
  1, //minimum_entries
  {1: 1000},  //pay_outs
  null, //processed_payouts_timestamp
  'world',  //sport
  10000, //starting_virtual_money
  10  //total_prize_pool
]
];