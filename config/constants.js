
exports.defaultPlayerImage = 'http://2.bp.blogspot.com/-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/facebook-default-no-profile-pic.jpg';
exports.profileStrings = {
  incorrectUsername: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try again with a different username."] }',
  deleteError: '{ "title": "Delete error", "parts": ["Something went wrong while deleting a file."] }',
  uploadError:'{ "title": "Upload error", "parts": ["Something went wrong while uploading a file."] }'
};
exports.auth = {
  incorrectUsername: '{ "title": "Incorrect username", "parts": ["We couldn\'t find any user with the username you provided.", "Please try a different username and try again, or sign up."] }',
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
