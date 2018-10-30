export {Animate};


class Animate {
    constructor(map){
        this.map = map;
    }
    flyTo(location, done) {

        var duration = window.sets.animate_duration;
        var view = this.map.ol_map.getView();
        var zoom = view.getZoom();
        var parts = 2;
        var called = false;

        function callback(complete) {
            --parts;
            if (called) {
                return;
            }
            if (parts === 0 || !complete) {
                called = true;
                done(complete);
            }
        }

        view.animate({
            center: location,
            duration: duration
        }, callback);
        view.animate({
            zoom: zoom - 1,
            duration: duration / 2
        }, {
            zoom: zoom,
            duration: duration / 2
        }, callback);
    }
}