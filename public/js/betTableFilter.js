$(document).ready(function() {
  $('#betTable').dataTable().columnFilter({
    sPlaceHolder: "head:after",
    aoColumns: [
                {type: "number-range"},
                {type: "number-range"},
                null
               ]
  });
});