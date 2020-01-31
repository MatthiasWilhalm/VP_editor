var videolength = 0;
const BPNAME = ["Breakpoint", "Loop"];

//playback vars
var currevent = -1;
var skip = false;

var mouseX = 0;

var default_adj_rate = 1000;

var vs = new VideoScript("", "0.0.1", new Array());

function VideoScript(filename, version, breakpoins) {
    this.filename=filename;
    this.version=version;
    this.breakpoins=breakpoins;
};

function Loop(start, end, type) {
    this.start=start;
    this.end=end;
    this.type=type;
}

function Breakpoint(start) {
    this.start = start;
}

document.getElementById("of_video").onmouseenter = function(e) {
    $("#of_video_overlay").addClass("input_button_hover");
}

document.getElementById("of_video").onmouseleave = function(e) {
    $("#of_video_overlay").removeClass("input_button_hover");
}

document.getElementById("of_meta").onmouseenter = function(e) {
    $("#of_meta_overlay").addClass("input_button_hover");
}

document.getElementById("of_meta").onmouseleave = function(e) {
    $("#of_meta_overlay").removeClass("input_button_hover");
}

function resizeInput() {
    $(this).attr('size', $(this).val().length);
}

$('input[type="text"]').keyup(resizeInput).each(resizeInput);


document.getElementById("of_video").onchange = async function(e){
    vs = new VideoScript("", "0.0.1", new Array());
    var vp = document.getElementById('video_player');
    vs.filename = this.files[0].name;
    vp.src = await URL.createObjectURL(this.files[0]);
    document.getElementById('video_player').poster = "";
    document.getElementById("of_meta_d").type = "text/plain";
    document.getElementById("of_meta_d").download = vs.filename.split(".")[0]+".vpf";
    refresh();
}

function openFullscreen() {
    let elem = document.getElementById("video_player");
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}

$("#of_meta_d").click(function(){
    if(vs.filename!=null && vs.filename!="" && vs.filename!=undefined) {
        let exportText = "[Meta]\nfile: "+vs.filename+"\nversion: "+vs.version+"\n[Breakpoints]";
        vs.breakpoins.forEach(e => {
            if(e.constructor.name==BPNAME[0]) {
                exportText+="\n"+e.start;
            } else {
                exportText+="\n"+e.start+","+e.end+","+e.type;
            }
        });
        $("#temp_export").text(exportText);
        console.log($("#temp_export").text());
        var csv = document.getElementById("temp_export").innerHTML;
        var data = new Blob([csv]);
        document.getElementById("of_meta_d").href = URL.createObjectURL(data);
    }
});

document.getElementById("of_meta").onchange = async function(e){
    var fr = new FileReader();
    fr.onload = async function() {
        let metad;
        metad = this.result.slice(this.result.indexOf("[Meta]"), this.result.length);
        metad = metad.slice(metad.indexOf("]")+1, metad.length);
        metad = metad.slice(0, metad.indexOf("[")!=-1?metad.indexOf("["):metad.length).trim();
        while(metad.indexOf("\r")!=-1) metad = metad.replace("\r", "");
        var mapar = metad.split("\n");
        mapar.forEach(m => {
            m = m.split(":");
            switch (m[0].trim()) {
                case "flie":
                    vs.filename = m[1].trim();
                    break;
                case "version":
                    vs.version = m[1].trim();
                    break;
            }
        });

        let brpd;
        brpd = this.result.slice(this.result.indexOf("[Breakpoints]"), this.result.length);
        brpd = brpd.slice(brpd.indexOf("]")+1, brpd.length);
        brpd = brpd.slice(0, brpd.indexOf("[")!=-1?brpd.indexOf("["):brpd.length).trim();
        while(brpd.indexOf("\r")!=-1) brpd = brpd.replace("\r", "");
        mapar = brpd.split("\n");

        mapar.forEach(e => {
            e = e.split(",");
            if(e.length==1) vs.breakpoins.push(new Breakpoint(e[0]));
            else vs.breakpoins.push(new Loop(e[0], e[1], e[2]));
        });
        refresh();
    }
    await fr.readAsText(this.files[0]);
}

document.getElementById("video_player").ontimeupdate = function(e) {
    updateTimeline(document.getElementById("video_player").currentTime*1000);
    //playback
    if($("#usePlayBack").prop("checked")){
        playBack(document.getElementById("video_player").currentTime*1000);
        if(skip) $("#skip").text("skiping");
        else $("#skip").text("");
        if(currevent!=-1) {
            $("#curev").text(currevent+": "+(vs.breakpoins[currevent].end!=undefined?"Loop":"Break"));
        } else {
            $("#curev").text("playing");
            skip = false;
        }
    }

}

//not working
var intervalRewind;
document.getElementById("video_player").playBackwards = function() {
    this.pause();

    var video = this;

    var fps = 30;
    if(!intervalRewind) {
        intervalRewind = setInterval(function() {
        if(video.currentTime == 0){
           clearInterval(intervalRewind);
           intervalRewind=null;
           video.pause();
        }
        else {
            video.currentTime += -(1/fps);
        }
    }, 1000 / fps);
    }
};

$(document).mouseup(function() {
    mouseX = 0;
});

document.getElementById("playtime").onchange = function(e) {
    let time = convertToMs($("#playtime").val());
    if(time==-1 || time > videolength) {
        $("#playtime").val(convertMsToNormTime(document.getElementById("video_player").currentTime*1000));
    } else {
        document.getElementById("video_player").currentTime = time/1000;
    $("#timeline").val(time);
    }
}

$("#timeline").on("input change", () => {
    document.getElementById("video_player").currentTime = $("#timeline").val()/1000;
    $("#playtime").val(convertMsToNormTime($("#timeline").val()));
});

window.addEventListener('load', function() {
    var video = document.querySelector('#video_player');

    function checkLoad() {
        if (video.readyState === 4) {
            var vp = document.getElementById('video_player');
            videolength = vp.duration*1000;
            console.log(videolength);
            $("#tracklength").text("/"+convertMsToNormTime(videolength));
            $("#timeline").prop("max", videolength);
            document.getElementById("timeline").value = "0";
            document.getElementById("playtime").value = "0:00:000";
            console.log("upload complete");
        } else {
            setTimeout(checkLoad, 100);
        }
    }

    checkLoad();
}, false);


$("#add_break").click(event => {
    addBreakPoint(document.getElementById("video_player").currentTime*1000);
    refresh();
});

$("#add_loop_start").click(event => {
    addLoop(document.getElementById("video_player").currentTime*1000, 10000);
    refresh();
});

$("#fullscreen").click(event => {
    openFullscreen();
});

$("#play_pause").click(event => {
    if(document.getElementById("video_player").paused) {
        document.getElementById("video_player").play();
        $("#play_pause_icon").attr("src","./assets/play.png");
    } else {
        document.getElementById("video_player").pause();
        $("#play_pause_icon").attr("src","./assets/pause.png");
    }
});

$("#rev").click(event => {
    document.getElementById("video_player").currentTime = getLast(document.getElementById("video_player").currentTime*1000)/1000;
});

$("#ff").click(event => {
    document.getElementById("video_player").currentTime = getNext(document.getElementById("video_player").currentTime*1000)/1000;
})

$(document).keypress(event => {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '32'){
        skip = true;
        if(document.getElementById("video_player").paused) document.getElementById("video_player").play();
        if(vs.breakpoins[currevent].type==2) document.getElementById("video_player").currentTime = vs.breakpoins[e].end/1000;
    }
});


function updateTimeline(t) {
    document.getElementById("timeline").value = t;
    document.getElementById("playtime").value = convertMsToNormTime(t);
}

function addBreakPoint(time) {
    time=Math.trunc(time);
    if(!isOccupied1(time))
        vs.breakpoins.push(new Breakpoint(time));
}

//old
function startLoop(time) {
    time=Math.trunc(time);
    if(!isOccupied1(time))
        vs.breakpoins.push(new Loop(time, null, 1)); 
}

//old
function endLoop(time, starttime) {
    vs.breakpoins.forEach(e => {
        if(e.start==starttime && e.constructor.name==BPNAME[1]) e.end = time;
    });
}

function addLoop(start, length) {
    if(!isOccupied3(start, start+length)) {
        if(start+length>videolength) length = videolength - start;
        vs.breakpoins.push(new Loop(start, start+length, 1)); 
    }
}

function setLoopType(time) {
    vs.breakpoins.forEach(e => {
        if(e.start==time) {
            if(e.type==1) {
                e.type=2;
            }else {
                e.type=1;
            }
        }
    });
}

function refresh() {
    sortTimeLine();
    refreshEditView();
    refreshTimeline();
}

function refreshEditView() {
    $(".section").remove();
    $("#placeholder_marker_bar").remove();

    if(vs.breakpoins.length==0) {
        $("#marker_bar").append($("<p/>", {
            id: "placeholder_marker_bar",
            style: "font-size: 15pt; text-align: center; color: gray; font-style: italic;",
            text: "no breakpoints or loops"
        }));
    } else {
        vs.breakpoins.forEach(e => {

        if(e.constructor.name==BPNAME[0]) {
            d = document.createElement('div');
            $(d).attr("id", "sec"+e.start);
            $(d).addClass("section");
            $(d).append("<h2>"+convertMsToNormTime(e.start)+"</h2>");

            let adt = document.createElement('div');
            $(adt).addClass("adj_small");
            $(adt).css("margin-left", "35%");
            $(adt).css("margin-top", "35px");
            $(adt).append($("<button/>", {
                text: "+",
                id: "addstart_"+e.start,
                class: "defbutton adj_add_small",
                style: "float: left;",
                click: function() {
                    vs.breakpoins.forEach(i => {
                        if(parseInt($(this).attr("id").split("_")[1])==i.start && i.constructor.name==BPNAME[0]) {
                            let newstart = i.start+default_adj_rate;
                            if(!isOccupied2(newstart, i.start)) {
                                i.start = newstart;
                                $(this).attr("id", "addstart_"+i.start);
                                $(this).closest('.section').children('h2').text(convertMsToNormTime(i.start));
                                $(this).closest('.adj_small').children('.adj_sub_small').attr("id","substart_"+i.start);
                            }           
                        }
                    });
                    refreshTimeline();
            }}));
            $(adt).append($("<button/>", {
                text: "-",
                id: "substart_"+e.start,
                class: "defbutton adj_sub_small",
                click: function() {
                    vs.breakpoins.forEach(i => {
                        if(parseInt($(this).attr("id").split("_")[1])==i.start && i.constructor.name==BPNAME[0]) {
                            let newstart = i.start-default_adj_rate;
                            if(!isOccupied2(newstart, i.start)) {
                                i.start = newstart;
                                $(this).attr("id", "substart_"+i.start);
                                $(this).closest('.section').children('h2').text(convertMsToNormTime(i.start));
                                $(this).closest('.adj_small').children('.adj_add_small').attr("id","addstart_"+i.start);
                            }           
                        }
                    });
                    refreshTimeline();
            }}));
            $(d).append(adt);

            $(d).append($("<button/>", {
                id: "delete_"+e.start,
                class: "single defbutton",
                click: function () {
                    console.log("del:"+$(this).attr("id"));
                    removeBreakPoint(parseInt($(this).attr("id").split("_")[1]));
                }
            }).append($("<img/>", {
                src: "./assets/delete.png",
                style: "margin-left: -3px;"
            })));

            $("#marker_bar").append(d);
        } else {
            d = document.createElement('div');
            $(d).attr("id", "sec"+e.start);
            $(d).addClass("section");


            $(d).append("<h2>"+convertMsToNormTime(e.start)+" - "+convertMsToNormTime(e.end)+"</h2>");

            let adt = document.createElement('div');
            $(adt).addClass("adj_small");
            $(adt).css("margin-left", "35%");
            $(adt).css("margin-top", "35px");
            $(adt).append($("<button/>", {
                text: "+",
                id: "addstart_"+e.start,
                class: "defbutton adj_add_small",
                style: "float: left;",
                click: function() {
                    vs.breakpoins.forEach(i => {
                        if(parseInt($(this).attr("id").split("_")[1])==i.start  && i.constructor.name==BPNAME[1]) {
                            let newstart = i.start+default_adj_rate;
                            let newend = i.end+default_adj_rate;
                            if(!isOccupied4(newstart, newend, i.start)) {
                                i.start = newstart;
                                i.end = newend;
                                $(this).attr("id", "addstart_"+i.start);
                                $(this).closest('.section').children('h2').text(convertMsToNormTime(i.start)+" - "+convertMsToNormTime(i.end));
                                $(this).closest('.adj_small').children('.adj_sub_small').attr("id","substart_"+i.start);
                                $(this).closest('.section').children('.adj_small').last().children(".adj_add_small").attr("id", "addend_"+i.start);
                                $(this).closest('.section').children('.adj_small').last().children(".adj_sub_small").attr("id", "subend_"+i.start);
                            }           
                        }
                    });
                    refreshTimeline();
            }}));
            $(adt).append($("<button/>", {
                text: "-",
                id: "substart_"+e.start,
                class: "defbutton adj_sub_small",
                click: function() {
                    vs.breakpoins.forEach(i => {
                        if(parseInt($(this).attr("id").split("_")[1])==i.start  && i.constructor.name==BPNAME[1]) {
                            let newstart = i.start-default_adj_rate;
                            let newend = i.end-default_adj_rate;
                            if(!isOccupied4(newstart, newend, i.start)) {
                                i.start = newstart;
                                i.end = newend;
                                $(this).attr("id", "addstart_"+i.start);
                                $(this).closest('.section').children('h2').text(convertMsToNormTime(i.start)+" - "+convertMsToNormTime(i.end));
                                $(this).closest('.adj_small').children('.adj_add_small').attr("id","addstart_"+i.start);
                                $(this).closest('.section').children('.adj_small').last().children(".adj_add_small").attr("id", "addend_"+i.start);
                                $(this).closest('.section').children('.adj_small').last().children(".adj_sub_small").attr("id", "subend_"+i.start);
                            }           
                        }
                    });
                    refreshTimeline();
            }}));
            $(d).append(adt);


            $(d).append($("<input>", {
                type: "number",
                id: "end_"+e.start,
                value: e.end - e.start,
                style: "margin-right: 10px; width: 40%;",
                change: function() {
                    vs.breakpoins.forEach(i => {
                        console.log("id: "+parseInt($(this).attr("id").split("_")[1]) + " : "+i.start);
                        if(parseInt($(this).attr("id").split("_")[1])==i.start  && i.constructor.name==BPNAME[1]) {
                            i.end = (parseInt($(this).val()) + e.start<=e.start?i.end:parseInt($(this).val()) + e.start);
                            $(this).closest('.section').children('h2').text(convertMsToNormTime(e.start)+" - "+convertMsToNormTime(e.end));
                        }
                    });
                    refreshTimeline();
                }
            }));

            let ad = document.createElement('div');
            $(ad).addClass("adj_small");
            $(ad).css("margin-left", "35%");
            $(ad).css("margin-top", "35px");
            $(ad).append($("<button/>", {
                text: "+",
                id: "addend_"+e.start,
                class: "defbutton adj_add_small",
                style: "float: left;",
                click: function() {
                    vs.breakpoins.forEach(i => {
                        if(parseInt($(this).attr("id").split("_")[1])==i.start  && i.constructor.name==BPNAME[1]) {
                            $(this).closest('.section').children('input').val(parseInt($(this).closest('.section').children('input').val())+100);
                            i.end = (parseInt($(this).closest('.section').children('input').val()) + e.start<=e.start?i.end:parseInt($(this).closest('.section').children('input').val()) + e.start);
                            $(this).closest('.section').children('h2').text(convertMsToNormTime(e.start)+" - "+convertMsToNormTime(e.end));
                        }
                    });
                    refreshTimeline();
            }}));
            $(ad).append($("<button/>", {
                text: "-",
                id: "subend_"+e.start,
                class: "defbutton adj_sub_small",
                click: function() {
                    vs.breakpoins.forEach(i => {
                        if(parseInt($(this).attr("id").split("_")[1])==i.start  && i.constructor.name==BPNAME[1]) {
                            $(this).closest('.section').children('input').val(parseInt($(this).closest('.section').children('input').val())-100);
                            i.end = (parseInt($(this).closest('.section').children('input').val()) + e.start<=e.start?i.end:parseInt($(this).closest('.section').children('input').val()) + e.start);
                            $(this).closest('.section').children('h2').text(convertMsToNormTime(e.start)+" - "+convertMsToNormTime(e.end));
                        }
                    });
                    refreshTimeline();
            }}));
            $(d).append(ad);
            $(d).append($("<button/>", {
                id: "delete_"+e.start,
                class: "single defbutton",
                style: "margin-right: 70px;",
                click: function () {
                    console.log("del:"+$(this).attr("id"));
                    removeLoop(parseInt($(this).attr("id").split("_")[1]));
                }
            }).append($("<img/>", {
                src: "./assets/delete.png",
                style: "margin-left: -3px;"
            })));

            $(d).append($("<button/>", {
                id: "type_"+e.start,
                class: "single defbutton",
                click: function () {
                    console.log("type:"+e.type);
                    setLoopType(parseInt($(this).attr("id").split("_")[1]));
                    $(this).children("img").attr("src", "./assets/loop_t"+e.type+".png");
                }
            }).append($("<img/>", {
                src: "./assets/loop_t"+e.type+".png",
                style: "margin-left: -3px;"
            })));

            $("#marker_bar").append(d);
        }

});
    }

}

function refreshTimeline() {
    $(".defmarker").remove();
    $(".currmarker").remove();

    vs.breakpoins.forEach(e => {
        //console.log(e.constructor.name+" : "+BPNAME[0]);

        if(e.constructor.name==BPNAME[0]) {
            m = document.createElement('div');
            $(m).addClass("defmarker");
            $(m).attr("id", "mark_"+e.start);
            let ml = (e.start) / videolength*100;
            $(m).css("left",ml+"%");
            $(m).mousedown(function(){
                //mouseX = getMouseCoords()[0];
            });
            $(m).mousemove(function(){
                if(mouseX!=0) {
                    if(getMouseCoords()[0]<mouseX){
                        ml -=0.5;
                        $(this).css("left",ml+"%");
                    } else if(getMouseCoords()[0]>mouseX) {
                        ml +=0.5;
                        $(this).css("left",ml+"%");
                    }
                }
            });
            $(m).mouseup(function(){
                mouseX = 0;
            });
            $("#offsetmarker").append(m);
        } else {
            m = document.createElement('div');
            $(m).addClass("defmarker");
            let ml = (e.start) / videolength*100;
            $(m).css("left",ml+"%");
            //console.log($("#offsetmarker").width());
            let l = ((e.end-e.start)/videolength)*$("#offsetmarker").width();
            //console.log("l: "+l);
            $(m).css("width",l+"px");
            $("#offsetmarker").append(m);
        }

    });
}

function getMouseCoords() {
  var ev = window.event;
  return [ev.clientX, ev.clientY];
}

function removeBreakPoint(time) {
    for(e in vs.breakpoins) {
        console.log("e: ");
        console.log(vs.breakpoins);
        if(vs.breakpoins[e].start==time && vs.breakpoins[e].constructor.name==BPNAME[0]){
            console.log("removeing..."+e);
            vs.breakpoins.splice(e,1);
            break;
        } 
    }
    refresh();
}

function removeLoop(time) {
    for(e in vs.breakpoins) {
        if(vs.breakpoins[e].start==time && vs.breakpoins[e].constructor.name==BPNAME[1]){
            vs.breakpoins.splice(e,1);
            break;
        } 
    }
    refresh();
}

function isOccupied1(time) {
    let ret = false;
    vs.breakpoins.forEach(e => {
        if(e.start==time) ret = true;
        if(e.end!=undefined) {
            if(time<=e.end && time>=e.start){
                ret = true; 
            } 
        }     
    });
    return ret;
}

function isOccupied2(time, oldtime) {
    let ret = false;
    console.log(time+" : "+oldtime);
    vs.breakpoins.forEach(e => {
        if(e.start!=oldtime) {
            if(e.start==time) ret = true;
            if(e.end!=undefined) {
                if(time<=e.end && time>=e.start){
                    ret = true; 
                } 
            }
        }
    });
    return ret;
}

function isOccupied3(start, end) {
    let ret = false;
    vs.breakpoins.forEach(e => {
        if(e.start>=start && e.start<=end) ret = true;
        if(e.end!=undefined) {
            if((start<=e.end && start>=e.start) ||
               (end<=e.end && end>=e.start)){
                ret = true; 
            } 
        }    
    });
    return ret;
}

function isOccupied4(start, end, oldstart) {
    let ret = false;
    vs.breakpoins.forEach(e => {
        if(e.start!=oldstart) {
            if(e.start>=start && e.start<=end) ret = true;
            if(e.end!=undefined) {
                if((start<=e.end && start>=e.start) ||
                (end<=e.end && end>=e.start)){
                    ret = true; 
                } 
            }    
        }
    });
    return ret;
}

function sortTimeLine() {
    vs.breakpoins.sort((a, b)=>{return a.start-b.start});
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getLast(time) {
    time = Math.trunc(time);
    for(b in vs.breakpoins) {
        let c = parseInt(b)+1;
        if(time<vs.breakpoins[b].start) return 0;
        if(vs.breakpoins[b].start<time && (vs.breakpoins[c]!=undefined && vs.breakpoins[c].start>=time)) {
            return vs.breakpoins[b].start;
        }
        else if(vs.breakpoins[c]==undefined) {
            return vs.breakpoins[b].start;
        }
    }
    return 0;
}

function getNext(time) {
    time = Math.trunc(time);
    for(b in vs.breakpoins) {
        if(vs.breakpoins[b].start>time)
            return vs.breakpoins[b].start;
    }
    return videolength;
}

//ms -> mm:ss (string)
function convertMsToNormTime(millis) {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    let ms = Math.floor(millis % 1000);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds + ":"+ (ms<100?"0":"") + (ms<10?"0":"") + ms;
}

function convertToMs(time) {
    let timearray = time.split(":");
    if(timearray.length!=3) return -1;
    try {
        let min = parseInt(timearray[0]);
        let sek = parseInt(timearray[1]);
        let ms = parseInt(timearray[2]);
        if(min<0 || sek< 0 || ms<0) return -1;
        let ret = min*60000 + sek*1000 + ms;
        return ret;
    } catch(err) {
        return -1;
    }
}

//get next breakpoint or loop index
function getNextAction(time) {
    let ret = null;
    for(e in vs.breakpoins) {
        if(vs.breakpoins[e].start>=time){
            ret = e;
            break;
        }
        if(vs.breakpoins[e].end!=undefined) {
            if(time<vs.breakpoins[e].end && time>=vs.breakpoins[e].start){
                ret = e;
            } 
        }
    }

    return ret;
}

function playBack(time) {
    let offset = 235;
    currevent = -1;
    for(e in vs.breakpoins) {
        if((vs.breakpoins[e].start+offset>=time && vs.breakpoins[e].start-offset<=time) && vs.breakpoins[e].end==undefined) {
            if(!skip){
                document.getElementById("video_player").pause();
            }
            currevent = e;
            break;
        } else if(vs.breakpoins[e].end!=undefined) {
            if((vs.breakpoins[e].start<=time && vs.breakpoins[e].end>=time)){
                currevent = e;
            }
            if((vs.breakpoins[e].end+offset>=time && vs.breakpoins[e].end-offset<=time)){
                if(!skip) {
                    document.getElementById("video_player").currentTime = vs.breakpoins[e].start/1000;
                    //document.getElementById("video_player").playBackwards();
                }
                currevent = e;
                break;
            } 
        } 
    }
}