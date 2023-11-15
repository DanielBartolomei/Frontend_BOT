
module.exports = async function (server) {
    var rclnodejs = require('rclnodejs');

    // Socket that listens to events coming from the HTTP Web App
    const options = { /* ... */ };
    var socketWA = require('socket.io')(server,options);

    // var socket_global = 

    // Socket that emits events to the socket_publisher server socket
    var { io } = require("socket.io-client");
    const PORT = 9696;
    const HOST = '127.0.0.1';

    const socketSP = io(`http://${HOST}:${PORT}`);
    console.log('socket_publisher Socket instantiated!');

    // Socket that listens to events coming from the Frontend of the WebApp
    var connected = false;

    await rclnodejs.init();
    const mapPubNode = new rclnodejs.Node('nodejsMapPublisher');

    socketWA.on('connection', function (socket) {
        if(!socketSP.connected){
            const publisher = mapPubNode.createPublisher('nav_msgs/msg/OccupancyGrid', 'map');
            publisher.qos.durability = rclnodejs.QoS.DurabilityPolicy.RMW_QOS_POLICY_DURABILITY_TRANSIENT_LOCAL;
            publisher.qos.history = rclnodejs.QoS.HistoryPolicy.RMW_QOS_POLICY_HISTORY_KEEP_LAST;

            socketSP.connect("ws://127.0.0.1:"+PORT);

            // Emit map event and read map data
            socketSP.emit("map", {"callback": "map_callback"});

            socketSP.on("map_callback", function (data){
                let msgObj = rclnodejs.createMessageObject('nav_msgs/msg/OccupancyGrid');
                msgObj = fill_map_msg(msgObj, data);
            
                publisher.publish(msgObj);
            });
        }
    });

    socketWA.on('send-intervention', function (args) {
        console.log("GOTOPOSE");

        if(socketSP.connected){
            if(args.function_name === "go_to_pose"){
                socketSP.emit("go_to_pose", args);
            }
        }
        
    });
  
};


function fill_map_msg(msgObj, data){
    // jsonData = JSON.parse(data);
    
    // Header
    msgObj.header.stamp = data.body.header.stamp;
    msgObj.header.frame_id = data.body.header.frame_id;

    // Info
    msgObj.info.map_load_time = data.body.info.map_load_time;
    msgObj.info.resolution = data.body.info.resolution;
    msgObj.info.width = data.body.info.width;
    msgObj.info.height = data.body.info.height;

    msgObj.info.origin.position.x = data.body.info.origin.position.x;
    msgObj.info.origin.position.y = data.body.info.origin.position.y;
    msgObj.info.origin.position.z = data.body.info.origin.position.z;

    msgObj.info.origin.orientation.x = data.body.info.origin.orientation.x;
    msgObj.info.origin.orientation.y = data.body.info.origin.orientation.y;
    msgObj.info.origin.orientation.z = data.body.info.origin.orientation.z;
    msgObj.info.origin.orientation.w = data.body.info.origin.orientation.w;

    // Data
    msgObj.data = data.body.data;

    return msgObj;
}