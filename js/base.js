(function() {
  function activateFeature(sel) {
    $('div.basepage-feature').hide();
    $(sel).show();
    $('li.basepage-feature-selector').removeClass('active');
    $('li.basepage-feature-selector > a').each(function() {
      if (this.getAttribute('href') === sel) {
        $(this).parent().addClass('active');
      }
    });
  }

  function initFeatureSelector() {
    $('div.basepage-feature').hide();
    var active = $(window.location.hash);
    if (active.is('div.basepage-feature')) {
      activateFeature(window.location.hash);
      $('html, body').animate({
        scrollTop: $('.basepage-showcase').offset().top
      }, 1000);
    } else {
      var firstFeature = $('div.basepage-feature')[0];
      if (firstFeature) {
        activateFeature('#' + firstFeature.id);
      }
    }

    $('ul li.basepage-feature-selector a').on('click', function(evt) {
      evt.preventDefault();
      history.replaceState({}, '', evt.target.href);
      activateFeature(this.getAttribute('href'));
    });
  }

  $(function() {
    initFeatureSelector();
  });
})();

