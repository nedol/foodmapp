/**
 * Created by android on 24.05.2018.
 */

'use strict';


export class VideoRecorder {

    constructor(){
        this.mediaSource = new MediaSource()

        this.stream;

        this.mediaRecorder;
        this.recordedBlobs = [];
        this.sourceBuffer;
        this.constraints = {
            audio: true,
            video: true
        };
        this.recordedVideo;

        this.status;
    }

    open(){

        // this.mediaSource.addEventListener('sourceopen',  function (ev) {
        //     console.log('MediaSource opened');
        //     this.sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        //     console.log('Source buffer: ', this.sourceBuffer);
        // }, false);

        $('#record').on('click',this,this.toggleRecording);
        $('#stop').on('click',this,this.stopRecording);
        $('#play').on('click',this,this.play);

    }

    toggleRecording(ev) {

        if (this.status !== 'recording') {
            ev.data.startRecording(ev);
        } else {
            ev.data.stopRecording(ev);
        }
    }

    startRecording(ev) {

        var options = {mimeType: 'video/webm;codecs=vp9'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: 'video/webm;codecs=vp8'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options = {mimeType: 'video/webm'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.log(options.mimeType + ' is not Supported');
                    options = {mimeType: ''};
                }
            }
        }
        try {
            ev.data.mediaRecorder = new MediaRecorder(ev.data.stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder: ' + e);
            alert('Exception while creating MediaRecorder: ' + e + '. mimeType: ' + options.mimeType);
            return;
        }
        console.log('Created MediaRecorder', ev.data.mediaRecorder, 'with options', options);

        this.status = 'recording';

        ev.data.mediaRecorder.onstop = ev.data.handleStop;
        ev.data.mediaRecorder.ondataavailable = function (event) {
            if (event.data && event.data.size > 0) {
                ev.data.recordedBlobs.push(event.data);
            }
        };
        ev.data.mediaRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', ev.data.mediaRecorder);
    }


    handleStop(event) {
        console.log('Recorder stopped: ', event);
    }
    stopRecording(ev) {
        ev.data.mediaRecorder.stop();
        console.log('Recorded Blobs: ', this.recordedBlobs);
        $('#recordedVideo').attr('controls','true');
        this.status = 'stop';
    }

    play(ev) {

        let recordedVideo = $('#recordedVideo')[0];
        var superBuffer = new Blob(ev.data.recordedBlobs, {type: 'video/webm'});
        recordedVideo.src = window.URL.createObjectURL(superBuffer);
        // workaround for non-seekable video taken from
        // https://bugs.chromium.org/p/chromium/issues/detail?id=642012#c23
        recordedVideo.addEventListener('loadedmetadata', function() {
            if (recordedVideo.duration === Infinity) {
                recordedVideo.currentTime = 1e101;
                recordedVideo.ontimeupdate = function() {
                    recordedVideo.currentTime = 0;
                    recordedVideo.ontimeupdate = function() {
                        delete recordedVideo.ontimeupdate;
                        recordedVideo.play();
                    };
                };
            }
        });
    }

    download() {
        var blob = new Blob(this.recordedBlobs, {type: 'video/webm'});
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}