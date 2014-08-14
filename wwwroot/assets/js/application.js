var app = function() {

    var init = function() {

        tooltips();
        toggleMenuLeft();
        toggleMenuRight();
        menu();
        togglePanel();
        closePanel();
    };

    var tooltips = function() {
        $('#toggle-left').tooltip();
    };

    var togglePanel = function() {
        $('.actions > .fa-chevron-down').click(function() {
            $(this).parent().parent().next().slideToggle('fast');
            $(this).toggleClass('fa-chevron-down fa-chevron-up');
        });

    };

    /*var doChart = function() {
        var chartData = [
          { label: 'Layer 1', values: [ {x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2} ] },
          { label: 'Layer 2', values: [ {x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 4} ] }
        ];

        var theChart = $('#chart').epoch({ type: 'time.line', data: chartData });
    };*/

    var toggleMenuLeft = function() {
        $('#toggle-left').bind('click', function(e) {
            if (!$('.sidebarRight').hasClass('.sidebar-toggle-right')) {
                $('.sidebarRight').removeClass('sidebar-toggle-right');
                $('.main-content-wrapper').removeClass('main-content-toggle-right');
            }
            $('.sidebar').toggleClass('sidebar-toggle');
            $('.main-content-wrapper').toggleClass('main-content-toggle-left');
            e.stopPropagation();
        });
    };

    var toggleMenuRight = function() {
        $('#toggle-right').bind('click', function(e) {

            if (!$('.sidebar').hasClass('.sidebar-toggle')) {
                $('.sidebar').addClass('sidebar-toggle');
                $('.main-content-wrapper').addClass('main-content-toggle-left');
            }
            
            $('.sidebarRight').toggleClass('sidebar-toggle-right animated bounceInRight');
            $('.main-content-wrapper').toggleClass('main-content-toggle-right');

            if ( $(window).width() < 660 ) {
                $('.sidebar').removeClass('sidebar-toggle');
                $('.main-content-wrapper').removeClass('main-content-toggle-left main-content-toggle-right');
             };

            e.stopPropagation();
        });
    };

    var closePanel = function() {
        $('.actions > .fa-times').click(function() {
            $(this).parent().parent().parent().fadeOut();
        });

    }

    var menu = function() {
        $("#leftside-navigation .sub-menu > a").click(function(e) {
            $("#leftside-navigation ul ul").slideUp();
            if (!$(this).next().is(":visible")) {
                $(this).next().slideDown();
            }
              e.stopPropagation();
        });
    };
    //End functions

    //Dashboard functions
    var timer = function() {
        $('.timer').countTo();
    };


    //Vector Maps 
    /*var map = function() {
        $('#map2').vectorMap({
            map: 'world_mill_en',
            backgroundColor: 'transparent',
            regionStyle: {
                initial: {
                    fill: '#1ABC9C',
                },
                hover: {
                    "fill-opacity": 0.8
                }
            },
            markerStyle: {
                initial: {
                    r: 10
                },
                hover: {
                    r: 12,
                    stroke: 'rgba(255,255,255,0.8)',
                    "stroke-width": 3
                }
            },
            markers: [{
                latLng: [46.072758, 14.520305],
                name: '5 Nodes',
                style: {
                    fill: '#E84C3D',
                    stroke: 'rgba(255,255,255,0.7)',
                    "stroke-width": 3
                }
            }]
        });
        /*mapMarkers = new GMaps({
            div: '#map',
            lat: 46.072758,
            lng: 14.520305
        });
        mapMarkers.addMarker({
            lat: 46.072758,
            lng: 14.520305,
            title: '5 Nodes',
            details: {
              database_id: 42,
              author: 'HPNeo'
            },
            click: function(e){
              if(console.log)
                console.log(e);
              alert('You clicked in this marker');
            }
        });
        mapMarkers.addMarker({
            lat: -12.042,
            lng: -77.028333,
            title: 'Marker with InfoWindow',
            infoWindow: {
              content: '<p>HTML Content</p>'
            }
        });
    };*/

    var weather = function() {
        var icons = new Skycons({
            "color": "white"
        });

        icons.set("clear-day", Skycons.CLEAR_DAY);
        icons.set("clear-night", Skycons.CLEAR_NIGHT);
        icons.set("partly-cloudy-day", Skycons.PARTLY_CLOUDY_DAY);
        icons.set("partly-cloudy-night", Skycons.PARTLY_CLOUDY_NIGHT);
        icons.set("cloudy", Skycons.CLOUDY);
        icons.set("rain", Skycons.RAIN);
        icons.set("sleet", Skycons.SLEET);
        icons.set("snow", Skycons.SNOW);
        icons.set("wind", Skycons.WIND);
        icons.set("fog", Skycons.FOG);

        icons.play();
    }

    //morris pie chart
    var morrisPie = function() {

        Morris.Donut({
            element: 'donut-example',
            data: [{
                    label: "Solar panels",
                    value: 45
                }, {
                    label: "Grid power",
                    value: 40
                }, {
                    label: "Wind turbine",
                    value: 15
                }
            ],
            colors: [
                '#1abc9c',
                '#293949',
                '#e84c3d',
                '#3598db',
                '#2dcc70',
                '#f1c40f'
            ],
            formatter: function (x) { return x + "%"}
        });
    }

    //Sliders
    var sliders = function() {
        $('.slider-span').slider()
    };


    //return functions
    return {
        init: init,
        timer: timer,
        map: map,
        sliders: sliders,
        weather: weather,
        morrisPie: morrisPie

    };
}();

//Load global functions
$(document).ready(function() {
    app.init();

});
