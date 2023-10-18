/**
 * Setup all GUI elements when the page is loaded.
 */


var socket = io();
var ros;

function launch_all() {
    init();
    init_viewer();
    init_components();
    update_task_manager();
    update_battery_status();
    set_events();
}

function init(){

    // Connect to ROS.
    ros = new ROSLIB.Ros({
        url : 'ws://localhost:9090'
    });

    // Connect socket to Server

    // Emit map event

    // Read map data

    // Print map data on Map Topic
}

function init_viewer() {

    // Create the main viewer.
    var viewer = new ROS2D.Viewer({
        divID : 'map',
        width : $('#map').width(),
        height : $('#map').height()
     });

    

    // Setup the map client.
    var gridClient = new NAV2D.OccupancyGridClientNav({
        ros : ros,
        rootObject : viewer.scene,
        viewer : viewer,
        withOrientation : true
    
    });

    window.onresize = function(event) {
        viewer.width= $('#nav-map').width();
        viewer.height= $('#nav-map').height();
        nav.client.emit("change");
    };
        /*
        // Create the main viewer.
        var viewer = new ROS2D.Viewer({
            divID: 'nav-map',
            width: $('#nav-map').width(),
            height: $('#nav-map').height()
        });
        
        // Setup the nav client.
        var nav = new NAV2D.OccupancyGridClient({
            ros: ros,
            rootObject: viewer.scene,
            viewer: viewer,
            serverName: '/bt_navigator',
            withOrientation: true
        });
        

        window.onresize = function(event) {
            viewer.width= $('#nav-map').width();
            viewer.height= $('#nav-map').height();
            nav.client.emit("change");
        };
        */
    
}

function init_components(){
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });
}

// function update_task_manager(){

//     get_data = function (json, level) {
//         var data = {text: json.Node.name,
//                 id_intervention: json.Node.id,
//                 href: "#" + json.Node.id,
//                 delete:false};

//         var tags = 0;
//         var nodes = [];
//         for (var i = 0; i < json.Node.children.length; ++i){
//             var ret = get_data(json.Node.children[i], level + 1);
//             nodes.push(ret[0]);

//             tags += ret[1];
//         }

//         //to add button delete in treeview
//         if (level == 1)
//             data.delete = true;

//         data["tags"] = [tags.toString()];
//         if (nodes.length > 0)
//             data["nodes"] = nodes;
//         return [data, tags + 1];
//     };

//     socket.on("update-task-manager", function (tree) {
//         var json = JSON.parse(tree.replace(new RegExp("\'", 'g'), "\""));
//         var parameters = {color: "#428bca",
//             expandIcon: 'fa fa-chevron-right',
//             collapseIcon: 'fa fa-chevron-down',
//             nodeIcon: 'fa fa-bookmark',
//             showTags: true,
//             data: [get_data(json, 0)[0]]};
//             $("#tree").treeview(parameters);
//     });
//     socket.emit("get-behavior-tree");
// }

function update_battery_status() {

    socket.on("battery-status", function (message) {
        var IS_CHARGING = 1;
        var NOT_CHARGING = 3;
        var FULL_CHARGE = 4;
        var battery_charge = $("#battery-charge");
        var battery_percentage = $("#battery-percentage");
        var battery_progress = $("#battery-progress");
        var battery_progress_bar = $("#battery-progress-bar");

        var percentage = parseInt(message.percentage * 100);

        battery_percentage.text(percentage + "%");
        battery_progress_bar.css("width", percentage + "%");

        if(message.supply_status == IS_CHARGING || message.supply_status == FULL_CHARGE)
            battery_charge.show();
        else
            battery_charge.hide();

        if(percentage >= 50)
            battery_progress_bar.css("background-color", "#28a745");
        else if( percentage >= 25)
            battery_progress_bar.css("background-color", "#ffc107");
        else
            battery_progress_bar.css("background-color", "#dc3545");

    });
}

function set_events() {
    
    //DOCK
    $("#btn-dock-intervention").click(function () {
        socket.emit("send-intervention", {task_name: "dock", task_priority: 5,
            task_permanence: false, task_impact: "", task_args: ['[-1.4892177235719, -0.1424343554075, 0]', 'yes']});
    });

    //UNDOCK
    $("#btn-undock-intervention").click(function () {
        socket.emit("send-intervention", {task_name: "undock", task_priority: 5,
            task_permanence: false, task_impact: "", task_args: ['yes']});
    });
    
    //TALK
    $("#btn-talk-intervention").click(function () {
        var text = $("#input-talk").val();
        socket.emit("send-intervention", {task_name: "say", task_priority: 5,
            task_permanence: false, task_impact: "", task_args: [text]});
    });
    
    
}

function delete_intervention(id) {
    socket.emit("delete-intervention", id);
}




