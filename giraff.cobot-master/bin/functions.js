
module.exports = function (server) {
    var rclnodejs = require('rclnodejs');
    var socket_global;
    
    const PORT = 9696;

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
                let msgObj = rclnodejs.createMessageObject('nav_msgs/msg/OccupancyGrid');
                msgObj = fill_map_msg(msgObj, data);
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
};


function make_map_msg(msgObj, data){
    jsonData = JSON.parse(data);
    
    // Header
    msgObj.header.stamp = jsonData.body.header.stamp;
    msgObj.header.frame_id = jsonData.body.header.frame_id;

    // Info
    msgObj.info.map_load_time = jsonData.body.info.map_load_time;
    msgObj.info.resolution = jsonData.body.info.resolution;
    msgObj.info.width = jsonData.body.info.height;
    msgObj.info.origin.position.x = jsonData.body.info.origin.position.x;
    msgObj.info.origin.position.y = jsonData.body.info.origin.position.y;
    msgObj.info.origin.position.z = jsonData.body.info.origin.position.z;

    msgObj.info.origin.orientation.x = jsonData.body.info.origin.orientation.x;
    msgObj.info.origin.orientation.y = jsonData.body.info.origin.orientation.y;
    msgObj.info.origin.orientation.z = jsonData.body.info.origin.orientation.z;
    msgObj.info.origin.orientation.w = jsonData.body.info.origin.orientation.w;

    // Data
    msgObj.data = jsonData.body.data;

    return msgObj;
}