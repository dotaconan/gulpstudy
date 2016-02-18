(function ($) {
    var theme = {
        defaults: {
            dateOrder: 'Mddyy',
            mode: 'mixed',
            rows: 5,
            width: 140,
            height: 72,
            showLabel: false,
            useShortLabels: true
        }
    }

    $.mobiscroll.themes['android-ics'] = theme;
    $.mobiscroll.themes['android-ics light'] = theme;

})(jQuery);

