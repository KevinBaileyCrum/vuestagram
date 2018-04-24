// This is the js for the default/index.html view.

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    function get_tracks_url(start_idx, end_idx) {
        var pp = {
            start_idx: start_idx,
            end_idx: end_idx
        };
        return tracks_url + "?" + $.param(pp);
    }

    self.get_tracks = function () {
        $.getJSON(get_tracks_url(0, 10), function (data) {
            self.vue.tracks = data.tracks;
            self.vue.has_more = data.has_more;
            self.vue.logged_in = data.logged_in;
            enumerate(self.vue.tracks);
        })
    };

    self.get_more = function () {
        var num_tracks = self.vue.tracks.length;
        $.getJSON(get_tracks_url(num_tracks, num_tracks + 10), function (data) {
            self.vue.has_more = data.has_more;
            self.extend(self.vue.tracks, data.tracks);
            enumerate(self.vue.tracks);
        });
    };

    self.add_track_button = function () {
        // The button to add a track has been pressed.
        self.vue.is_adding_track = !self.vue.is_adding_track;
    };

    self.add_track = function () {
        // The submit button to add a track has been added.
        $.post(add_track_url,
            {
                artist: self.vue.form_artist,
                title: self.vue.form_track,
                album: self.vue.form_album,
                duration: self.vue.form_duration
            },
            function (data) {
                $.web2py.enableElement($("#add_track_submit"));
                self.vue.tracks.unshift(data.track);
                enumerate(self.vue.tracks);
            });
    };

    self.delete_track = function(track_idx) {
        $.post(del_track_url,
            { track_id: self.vue.tracks[track_idx].id },
            function () {
                self.vue.tracks.splice(track_idx, 1);
                enumerate(self.vue.tracks);
            }
        )
    };

    self.select_track = function(track_idx) {
        var track = self.vue.tracks[track_idx];
        if (self.vue.selected_id === track.id) {
            // Deselect track.
            self.vue.selected_id = -1;
        } else {
            // Select it.
            self.vue.selected_idx = track_idx;
            self.vue.selected_id = track.id;
            self.vue.selected_url = track.track_url;
        }
        // Shows the uploader if we don't have a track url.
        if (self.vue.selected_url && self.vue.selected_id > -1) {
            $("#uploader_div").hide();
        } else {
            // Also sets properly the attribute of the upload form.
            self.upload_url = upload_url + "&" + $.param({track_id: track.id});
            self.delete_file_url = delete_file_url + "?" + $.param({track_id: track.id});
            $("#uploader_div").show();
        }

    };



    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_adding_track: false,
            tracks: [],
            logged_in: false,
            has_more: false,
            form_artist: null,
            form_track: null,
            form_album: null,
            selected_id: -1  // Track selected to play.
        },
        methods: {
            get_more: self.get_more,
            add_track_button: self.add_track_button,
            add_track: self.add_track,
            delete_track: self.delete_track,
            select_track: self.select_track
        }

    });

    self.get_tracks();
    $("#vue-div").show();

    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
