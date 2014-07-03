function wrongEmails() {
  $('#emailmatch').show().fadeOut(3000);
  $('#signup input[name=email2]').focus();
}

function badUsername() {
  $('#badusername').show().fadeOut(3000);
  $('#signup input[name=password2]').focus();
}

function wrongPasswords() {
  $('#passmatch').show().fadeOut(3000);
  $('#signup input[name=password2]').focus();
}

function existingEmail() {
  $('#bademail').show().fadeOut(3000);
  $('#signup input[name=email]').focus();
}

$('#signup').submit(function(e) {
  e.preventDefault();
  var inputs = $('#signup input');
  var values = {};
  inputs.each(function() {
    values[this.name] = $(this).val();
  });
  delete values[''];

  if (values.email !== values.email2) {
    wrongEmails();
  } else if (values.password !== values.password2) {
    wrongPasswords();
  } else {
    $.post('/signup', values, function(response) {
      if (response.value === 1) {
        badUsername();
      } else if (response.value === 2) {
        existingEmail();
      } else if (response.value === 3) {
        window.location.href = '/'; 
      }
      //do stuff here
    });
  }
});
