
module.exports = function (server) {
    var rclnodejs = require('rclnodejs');
    var socket_global;
    

    var io = require('socket.io').listen(server);

    rclnodejs.init().then(() => {

        io.on('connection', function (socket) {
            var serverSocket;
            const node = new rclnodejs.Node('nodejsMapPublisher');
            const publisher = node.createPublisher('nav_msgs/msg/OccupancyGrid', 'map');
            publisher.qos.durability = rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_TRANSIENT_LOCAL;
            publisher.qos.history = rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_KEEP_LAST;
    
            // Connect socket to Server
            serverSocket.connect("ws://127.0.0.1:{}".format(PORT))
    
            // Emit map event and read map data
            serverSocket.emit("map", function map_callback(data){
                console.log(data);
                let msgObj = rlcsnodejs.createMessageObject('nav_msgs/msg/OccupancyGrid');
                msgObj.header = JSON.parse(data).header;
                msgObj.data = JSON.parse(data).body;
                // "header:                                    \
                //     stamp:                                  \
                //         sec: 0                              \
                //         nanosec: 0                          \
                //     frame_id: map                           \
                // info:                                       \
                //     map_load_time:                          \
                //         sec: 0                              \
                //         nanosec: 0                          \
                //     resolution: 0.05000000074505806         \
                //     width: 328                              \
                //     height: 279                             \
                //     origin:                                 \
                //         position:                           \
                //         x: -8.18                            \
                //         y: -4.39                            \
                //         z: 0.0                              \
                //     orientation:                            \
                //         x: 0.0                              \
                //         y: 0.0                              \
                //         z: 0.0                              \
                //         w: 1.0                              \
                // data:" 
                publisher,publish(msgObj);
                serverSocket.disconnect();
            });


            socket.on('send-intervention', function (args, ret_func) {

                if(args.function_name === "go_to_pose"){
                    serverSocket.emit("go_to_pose", args);
                }
            });
          
        });
    });

    

    
        // socket_global = socket;

        // //Intervention handler
        // socket.on('send-intervention', function (args, ret_func) {
        //     intervention_sender.sendRequest(args, (response) => {

        //             //if the intervention is a go_to_point the id is saved in goals array
        //             if(args.task_name === "goto_to_pose"){
        //                 var pose = JSON.parse(args.task_args[1]);
        //                 goals[parseInt(response.task_id)] = {x: pose[0], y: pose[1], z: pose[2]};
        //             }

        //             if (ret_func != null)
        //                 ret_func(response.task_id);
        //         });
        // });

        // //get behavior tree
        // socket.on('get-behavior-tree', function () {
        //     io.emit("update-task-manager", tree);
        // });

        // //delete intervention
        // socket.on("delete-intervention", function (id) {
        //     if (id != -1){
        //         intervention_abort.call({task_id: id, info: ""}).then(function (response) {});

        //         //if the id is contained in goals the relative position marker in the map must be removed
        //         remove_goal(id);
        //     }
        // });

        // //return to the client the position already set
        // socket.on("get-positions", function (ret_func) {
        //     if(ret_func != null)
        //         ret_func(goals);
        // });
    
};