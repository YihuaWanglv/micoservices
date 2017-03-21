
var express = require('express');
var zookeeper = require('node-zookeeper-client');
var httpProxy = require('http-proxy');

var PORT = 9000;
var CONNECTION_STRING='127.0.0.1:2181';
var REGISTRY_ROOT='/registry';

// connect zookeeper
var zk = zookeeper.createClient(CONNECTION_STRING);
zk.connect();

var proxy = httpProxy.createProxyServer();
proxy.on('error', function(err, req, res){
	res.end();
});

var app = express();
app.use(express.static('public'));
app.all('*', function (req, res) {
	res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Service-Name");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    
	if (req.path == '/favicon.ico') {
		res.end();
		return;
	}

	// get service name
	var serviceName = req.get('Service-Name');
	console.log('serviceName: %s', serviceName);
	if (!serviceName) {
		console.log('Service-Name request header is not exist.');
		res.end();
		return;
	}

	// 获取服务路径
	var servicePath = REGISTRY_ROOT + '/' + serviceName;
	console.log('servicePath: %s', servicePath);
	// 获取服务路径下的地址节点
	zk.getChildren(servicePath, function(error, addressNodes) {
		if (error) {
			console.log(error.stack);
			res.end();
			return;
		}
		var size = addressNodes.length;
		if (size == 0) {
			console.log('address node is not exist.');
			res.end();
			return;
		}
		// 生成地址路径
		var addressPath = servicePath + '/';
		if (size == 1) {
			addressPath += addressNodes[0];
		} else {
			addressPath += addressNodes[parseInt(Math.random()*size)];
		}
		console.log('addressPath: %s', addressPath);

		//获取服务地址
		zk.getData(addressPath, function(error, serviceAddress) {
			if (error) {
				console.log(error.stack);
				res.end();
				return;
			}
			console.log('serviceAddress: %s', serviceAddress);
			if (!serviceAddress) {
				console.log('serviceAddress node is not exist.');
			}
			// todo
			proxy.web(req, res, {
				target: 'http://' + serviceAddress
			});
		});
	});

	// next();

});
app.listen(PORT, function () {
	console.log('server is running at %d', PORT);
});
