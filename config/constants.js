var path = require('path');

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
/*
 * ====================================================================
 * Cassandra constants
 * ====================================================================
 */
exports.cassandra = {
  APPLIED: '[applied]'
};
/*
 * ====================================================================
 * CONTESTB constants
 * ====================================================================
 */
exports.contestB = {
  //for update.js states
  STATES: {
    OPEN: 0,
    FILLED: 1,
    TO_PROCESS: 2,
    PROCESSED: 3,
    CANCELLED: 4,
  },
  //for retrying to atomically update times and tries
  MAX_WAIT: 10000,
  //for checking if lightweight transaction went through
  //time in milliseconds (2 hours)

  MAX_TIME_BEFORE_DEADLINE_TO_CANCEL: 120 * 60000,
  SIZES_NORMAL: [2, 3, 5, 10, 12, 14, 23, 56, 112, 167, 230, 1150]
};
/*
 * ====================================================================
 * Facebook login
 * ====================================================================
 */
exports.FacebookStrategy = {
    clientID: "855194074508903",
    clientSecret: "f0eba05b866e9921a7d88071d800bb72",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
};
/*
 * ====================================================================
 * Registry things
 * ====================================================================
 */
exports.signupResponseValues = {
  userTaken: 1,
  emailTaken: 2,
  success: 3
};
exports.PassportLocalStrategyObject = {
  usernameField: 'username',
  passwordField: 'password'
};
/*
 * ====================================================================
 * SMTP send email and verification
 * ====================================================================
 */
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
/*
 * ====================================================================
 * CONTEST UPDATE INTERVAL
 * ====================================================================
 */
exports.pollInterval = 2000;
/*
 * ====================================================================
 * Valid sports
 * ====================================================================
 */
exports.validSports = {
  baseball: 1,
  football: 1
}
/*
 * ====================================================================
 * contest A bets
 * ====================================================================
 */
exports.contestAbets = {
  STATES: {
    PENDING: 0,
    ACTIVE: 1,
    PROCESSED: 2,
    EXPIRED: 3
  },
  POSITIONS: {
    OVER: 1,
    UNDER: 0
  },
  DEFAULT_USERNAME: '-',
  BET_TYPES: {
    PROFILE_PENDING: 0,
    PROFILE_RESELL: 1,
    PROFILE_TAKEN: 2,
    MARKET_PENDING: 3,
    SECONDARY_MARKET: 4
  }
};

exports.game = {
  hasEnded: function(game) {
    if (game.status === 'closed') {
      return true;
    }
    return false;
  }
}

exports.globals = {
  SEMICOLON: ';',
  MINUTE_IN_MILLISECONDS: 60000,
/**
 * converts milliseconds to readable string
 * @param  {int} milliseconds
 * @return {string}
 */
  millisecondsToStr: function(milliseconds) {
    function numberEnding (number) {
      return (number > 1) ? 's' : '';
    }
    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
      return years + ' year' + numberEnding(years);
    }
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
      return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
      return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second';
  },
  DEFAULT_USER_UUIDS: 
  [
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    exports.contestAbets.DEFAULT_USER_UUID
  ],
  notADefaultUserUuid: function(uuid) {
    return exports.globals.DEFAULT_USER_UUIDS.indexOf(uuid) > -1 ? true : false;
  },
  DEFAULT_USERNAMES:
  [
    exports.contestAbets.DEFAULT_USERNAME
  ]
}


/*
 * ====================================================================
 * Background Scripts
 * ====================================================================
 */
exports.scriptNames = {
  parsePlayers: path.join(__dirname, '../scripts/baseball/parsePlayers.py'),
  parseAndUpdateGames: path.join(__dirname, '../scripts/baseball/parseAndUpdateGames.py')
}