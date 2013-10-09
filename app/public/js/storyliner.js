(function($) {
  $('document').ready(function(){
    window.socket = io.connect(window.location.href);
    socket.emit();
    $('.stbody > .tabbable > .nav a').click(function() {
      
    })
  });
})(jQuery);