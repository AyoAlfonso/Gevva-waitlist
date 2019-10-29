function onInvite(clicked_id){
         
    if (clicked_id) {
         $.ajax({
          type: "POST",
          url: "/invite",
          data: {
              refcode: clicked_id
          },
          success: function(json) {
             if (json.code==200) {
                 swal({
                   title: "Awesome...",
                   text: json.message,
                   imageUrl: 'https://www.nannyfix.com/img/awesome.png',
                   imageWidth: 120,
                   imageHeight: 120,
                   animation: false
                 });
                 return true;
              }
              if (json.code==409) {
                 swal({
                   title: "Are you sure you know what you are doing...",
                   text: json.message,
                   imageUrl: 'https://www.nannyfix.com/img/awesome.png',
                   imageWidth: 120,
                   imageHeight: 120,
                   animation: false
               });
                 return true;
              }
          },
          error: function(jqXHR, textStatus, err) {
              if (err) {
                console.log(err)
                  swal({
                      title: 'Oh no!',
                      text: "An error occured",
                      animation: false
                  });
                  return false
              } else {
                  swal.stopLoading();
                  swal.close();
              }
          }
      })
  } else {
      swal({
          title: 'Wrong details',
          text: 'An error occured on the server',
          animation: false
      });
      return false
  }
}