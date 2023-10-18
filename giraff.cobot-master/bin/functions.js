
module.exports = function (server) {
    var rclnodejs = require('rclnodejs');
    

    var io = require('socket.io').listen(server);

    // Register node with ROS master
    var intervention_sender;
    var intervention_abort;

    var tree = new String();

    var goals = {};
    //function to remove a goal
    var remove_goal = function(id){
        var goal_id = parseInt(id);
        if(goals[goal_id] != null){
            delete goals[goal_id];
            io.emit("remove-goal", goal_id);
        }
    };
    
    rclnodejs.init().then(() => {
        const node = new rclnodejs.Node('rclnodejs_node');


        

        //Intervention_sender, used in socket.io below
        intervention_sender = node.createClient('task_manager_interfaces/srv/AddTask', 'task_manager/add_task');


        //Intervention_abort, used in socket.io below
        intervention_abort = node.createClient('task_manager_interfaces/srv/RemoveTask', 'task_manager/remove_task');
        
    });

    /* rosnodejs.initNode('rosnodejs_node')
        .then(function(rosNode){


            //subscribe to /bt_manager/task_manager_result to check when a goal is reached and remove maker in client's widget
            var std_msgs = rosnodejs.require("std_msgs").msg;

            rosNode.subscribe('/bt_manager/task_manager_result', std_msgs.String,
                function (message) {
                    var id = parseInt(JSON.parse(message.data).task_id);
                    remove_goal(id);
                });


            //subscribe to the topic that publish behavior tree to read it
            var std_msgs = rosnodejs.require("std_msgs").msg;
            rosNode.subscribe("/bt_manager/tree", std_msgs.String,
                function (message) {
                //send new tree if it changed
                if(tree.localeCompare(message.data) != 0){
                    tree = message.data;
                    io.emit("update-task-manager", tree);
                }});

            //Intervention_sender, used in socket.io below
            intervention_sender = rosNode.serviceClient('/bt_manager/add_new_task', 'task_manager/addTask');

            //Intervention_abort, used in socket.io below
            intervention_abort = rosNode.serviceClient('/bt_manager/remove_task', 'task_manager/removeTask');

            //subscribe to /giraff_battery_filtered to read te battery status
            var sensor_msgs = rosnodejs.require("sensor_msgs").msg;
            rosNode.subscribe("/giraff_battery_filtered", sensor_msgs.BatteryState,
                function (message) {
                io.emit('battery-status', {percentage: message.percentage, supply_status: message.power_supply_status});
            });
        });
    */
    var socket_global;

    io.on('connection', function (socket) {

        socket_global = socket;

        //Intervention handler
        socket.on('send-intervention', function (args, ret_func) {
            intervention_sender.sendRequest(args, (response) => {

                    //if the intervention is a go_to_point the id is saved in goals array
                    if(args.task_name === "goto_to_pose"){
                        var pose = JSON.parse(args.task_args[1]);
                        goals[parseInt(response.task_id)] = {x: pose[0], y: pose[1], z: pose[2]};
                    }

                    if (ret_func != null)
                        ret_func(response.task_id);
                });
        });

        //get behavior tree
        socket.on('get-behavior-tree', function () {
            io.emit("update-task-manager", tree);
        });

        //delete intervention
        socket.on("delete-intervention", function (id) {
            if (id != -1){
                intervention_abort.call({task_id: id, info: ""}).then(function (response) {});

                //if the id is contained in goals the relative position marker in the map must be removed
                remove_goal(id);
            }
        });

        //return to the client the position already set
        socket.on("get-positions", function (ret_func) {
            if(ret_func != null)
                ret_func(goals);
        });
    });
};