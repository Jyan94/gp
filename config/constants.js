
exports.defaultPlayerImage = 'http://2.bp.blogspot.com/-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/facebook-default-no-profile-pic.jpg';
exports.profileStrings = {
  incorrectUsername: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try again with a different username."] }',
  deleteError: '{ "title": "Delete error", "parts": ["Something went wrong while deleting a file."] }',
  uploadError:'{ "title": "Upload error", "parts": ["Something went wrong while uploading a file."] }',
  databaseError: 4,
  betDeleterError: 5,
};
exports.marketStrings = {
  //submitted: '{ "title": "Bet submitted successfully", "parts": [] }',
  //taken: '{ "title": "Bet taken successfully", "parts": [] }',
  //betTakerError: '{ "title": "Bet taker error", "parts": ["You can\'t take your own bet."] }',
  //spendingPowerError: '{ "title": "Spending power error", "parts": ["Your spending power is too low.", "Recharge your money, cancel a pending bet, or wait until your current bets are over, and try again."] }'
  submitted: 1,
  taken: 2,
  databaseError: 3,
  spendingPowerError: 4,
  betAlreadyTakenError: 5,
  betTakerError: 6,
}
exports.auth = {
  incorrectUsername: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try again with a different username, or sign up."] }',
  incorrectPassword: '{ "title": "Incorrect password", "parts": ["The provided username and password didn\'t match anyone in our records.", "Please check your spelling and try again." ]}'
};
exports.mlbKey='grnayxvqv4zxsamxhsc59agu';
exports.contestB = {
  //for update.js states
  OPEN: 0,
  FILLED: 1,
  TO_PROCESS: 2,
  PROCESSED: 3,
  CANCELLED: 4,
  //for lock.js times and tries
  MIN_MILLISECONDS: 30000,
  MAX_TRIES: 20,
  MAX_WAIT: 10000,
  //for locking
  APPLIED: '[applied]'
};
exports.FacebookStrategy = {
    clientID: "855194074508903",
    clientSecret: "f0eba05b866e9921a7d88071d800bb72",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
}
exports.signupResponseValues = {
  userTaken: 1,
  emailTaken: 2,
  success: 3
};
