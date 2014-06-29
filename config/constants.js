exports.defaultPlayerImage = 'http://2.bp.blogspot.com/' +
'-6QyJDHjB5XE/Uscgo2DVBdI/AAAAAAAACS0/DFSFGLBK_fY/s1600/' +
'facebook-default-no-profile-pic.jpg';
exports.profileStrings = {
  incorrectUsername: '{ "title": "Incorrect username", ' +
  '"parts": ["We couldn\'t find any user with the username you provided.", ' +
  '"Please try again with a different username."] }',
  deleteError: '{ "title": "Delete error", ' +
  '"parts": ["Something went wrong while deleting a file."] }',
  uploadError:'{ "title": "Upload error", ' +
  '"parts": ["Something went wrong while uploading a file."] }',
  databaseError: 4,
  betDeleterError: 5,
};
exports.marketStrings = {
  //submitted: '{ "title": "Bet submitted successfully", "parts": [] }',
  //taken: '{ "title": "Bet taken successfully", "parts": [] }',
  //betTakerError: '{ "title": "Bet taker error", "parts": 
  //["You can\'t take your own bet."] }',
  //spendingPowerError: '{ "title": "Spending power error", "parts": 
  //["Your spending power is too low.", "Recharge your money, cancel a 
  //pending bet, or wait until your current bets are over, and try again."] }'
  submitted: 1,
  taken: 2,
  databaseError: 3,
  spendingPowerError: 4,
  betAlreadyTakenError: 5,
  betTakerError: 6,
};
exports.auth = {
  incorrectUsername: '{ "title": "Incorrect username", ' +
    '"parts": ["We couldn\'t find any user with the username you provided.",' +
    ' "Please try again with a different username, or sign up."] }',
  incorrectPassword: '{ "title": "Incorrect password", ' +
    '"parts": ["The provided username and password didn\'t match anyone ' +
    'in our records.", "Please check your spelling and try again." ]}',
  unverified: '{ "title": "Account Not Verified", ' +
    '"parts": ["The provided email address has not been verified.", ' +
    '"Please check your email for a verification link." ]}'
};
exports.mlbKey='grnayxvqv4zxsamxhsc59agu';
exports.dailyProphet = {
  //for update.js states
  OPEN: 0,
  FILLED: 1,
  TO_PROCESS: 2,
  PROCESSED: 3,
  CANCELLED: 4,
  //for retrying to atomically update times and tries
  MAX_WAIT: 10000,
  //for checking if lightweight transaction went through
  APPLIED: '[applied]',
  //time in milliseconds (2 hours)
  MAX_TIME_BEFORE_DEADLINE_TO_CANCEL: 120 * 60000
};
exports.FacebookStrategy = {
    clientID: "855194074508903",
    clientSecret: "f0eba05b866e9921a7d88071d800bb72",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
};
exports.signupResponseValues = {
  userTaken: 1,
  emailTaken: 2,
  success: 3
};
exports.PassportLocalStrategyObject = {
  usernameField: 'username',
  passwordField: 'password'
};
exports.SMTP = {
  name: 'SMTP',
  configObject: {
    service: 'Gmail',
    auth: {
      user: 'goprophetteam@gmail.com',
      pass: 'goteamgp'
    }
  },
  createMailOptions: function(email, verificationCode) {
    return {
      from: "goprophetteam@gmail.com",
      to: email,
      subject: 'Welcome to GoProphet',
      text: 'Welcome to GoProphet.  To verify your account, go to',
      html: '<a href = http://localhost:3000/verify/' + email + 
            '/' + verificationCode + '> Verify My Account </a>'
    };
  }
};
exports.verificationMessages = {
  verified: 'Congratulations, your account is now verified!',
  noMatch: 'Your verification code does not match!',
  alreadyVerified: 'Your account is already verified!',
  invalidPage: 'You should not have reached this page!'
}