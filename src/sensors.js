require("sunrise.min.js")
import "sunangle.js"


//throw { name: 'FatalError', message: 'Something went badly wrong' };
// loading in larger dataset
//ar filename = "./sandbox/sensors/sensorType_data.txt"
//var SensorType = qm.store("SensorType");
var SensorMeasurement = qm.store("SensorMeasurement");
var WeatherMeasurement = qm.store("WeatherMeasurement");
var linReg = qm.analytics.newRecLinReg({"dim":8, "forgetFact":1});

function isNumber(n) {
    return (Object.prototype.toString.call(n) === '[object Number]' || Object.prototype.toString.call(n) === '[object String]') &&!isNaN(parseFloat(n)) && isFinite(n.toString().replace(/^-/, ''));
}

//get the set of all sensors from a node
function getSensorsOnNode(nodeName){    
    var sensorsRSet = qm.search({                         
        "$join": { 
            "$name": "hasSensor",
            "$query": { "$from": "SensorNode",
                "Name": nodeName
            }
        }              
    });
    return sensorsRSet;
};

function addNewMeasurement(sensorName, data){

    //TODO: Make proper JSON form of measurement
    SensorMeasurement.add(JSON.parse(data));    
    console.say("OK addSensorMeasurement");   
    return jsonp(req, resp, "OK");
};

//Make a stream of data, n seconds apart
/*function streamData(delay){
    //console.say(JSON.stringify(process));
    //TODO: how to get nodejs functions to work here?
    var inDataFile = fs.openRead("sandbox/sensors/vojkova_2013-11-19-node-1.csv");
    var count = 0;
    while(!inDataFile.eof && count < 15){
        count++;
        var LineStr = inDataFile.getNextLn();
        var ValueV = LineStr.split(",");
        for(var i=0; i < ValueV.length; i++){
            console.say(ValueV[i]);
        };
        //sleep(5000);
    };
    console.say("Streaming like a Baws!");
};*/

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

//get the time stamp of the last measurement registered for a given node
function getLastTmStamp(nodeNm) {
    var sensorsRSet = getSensorsOnNode(nodeNm);
    if (sensorsRSet.empty) { return ""; }
    var result = [];        
    for (var i = 0; i < sensorsRSet.length; i++) {   
        var sensorType = sensorsRSet[i].join("ofType");             
        var measuredRSet = sensorsRSet[i].join("measured");             
        var measNo = measuredRSet.length;        
        return measuredRSet[measNo - 1].DateTime;               
    }   
}

function genJSON(inDataFile, outDataFile, storeNm, fn) {    
    var prevDate, thisDate;
    var day = 0;
    var startFlg = 1;
    var store = qm.store(storeNm);
    console.say("opened " + store.name); 
    while (!inDataFile.eof) {
        var LineStr = inDataFile.getNextLn();
        var ValueV = LineStr.split(",");
        if (ValueV.length != 9) {
            console.say("less than 9 measurements"); 
            continue;
        }
        for (var v = 0; v < ValueV.length; v++) { 
            var Value;
            if (startFlg == 1 && v == 8) {
                thisDate = new Date(Date.parse(ValueV[8]));                
                Value = 0;
            } else if (startFlg == 0 && v == 8) {
                prevDate = thisDate;
                thisDate = new Date(Date.parse(ValueV[8]));
                Value = (thisDate - prevDate) / 100;                            
            } else {
                Value = ValueV[v];
            }

            if (startFlg == 0 && (thisDate.getDate() - prevDate.getDate()) > 0)
            { day++; } 
            var idObj = new Object();       
            idObj.Id = (fn * 10 + v).toString();
            var jsonObject = new Object();
            jsonObject.DateTime = ValueV[8];
            jsonObject.Window = day;
            jsonObject.Value = parseFloat(Value);
            jsonObject.measuredBy = [];
            jsonObject.measuredBy.push({Id: (fn * 10 + v).toString()});            
            //console.say("adding" + JSON.stringify(jsonObject)); 
            store.add(jsonObject);
            //console.say("added" + JSON.stringify(jsonObject)); 
            outDataFile.writeLine(JSON.stringify(jsonObject));    
        }                                      
    }       
}

http.onGet("test", function (req, resp) {
    jsonp(req, resp, "#SensorNode=" + qm.store("SensorNode").length);
});

http.onGet("addaggrnum", function (req, resp) {    
    if (!req.args.aggrnm) { response.send("Missing aggrnm= parameter"); }
    if (!req.args.storenm) { response.send("Missing storenm= parameter"); }
    if (!req.args.tfid) { response.send("Missing tfid= parameter"); }
    if (!req.args.tw) { response.send("Missing tw= parameter"); }
    if (!req.args.fid) { response.send("Missing fid= parameter"); }
    qm.addStreamAggr("" + req.args.aggrnm, "num", "" + req.args.storenm, 
        parseInt(req.args.tfid), parseInt(req.args.tw), parseInt(req.args.fid));    
    jsonp(req, resp, req.args.aggrnm + "aggregate added");
});

http.onGet("addaggrnumgrp", function (req, resp) {    
    if (!req.args.aggrnm) { response.send("Missing aggrnm= parameter"); }
    if (!req.args.storenm) { response.send("Missing storenm= parameter"); }
    if (!req.args.tfid) { response.send("Missing tfid= parameter"); }
    if (!req.args.tw) { response.send("Missing tw= parameter"); }
    if (!req.args.fid) { response.send("Missing fid= parameter"); }
    if (!req.args.grpstorenm) { response.send("Missing group storenm= parameter"); }
    if (!req.args.gfid) { response.send("Missing group field id gfid= parameter"); }
    if (!req.args.jid) { response.send("Missing join id jid= parameter"); }
    qm.addStreamAggr("" + req.args.aggrnm, "numgrp", "" + req.args.storenm, 
        parseInt(req.args.tfid), parseInt(req.args.tw), parseInt(req.args.fid),
        "" + req.args.grpstorenm, parseInt(req.args.gfid), "" + req.args.jid);    
    jsonp(req, resp, req.args.aggrnm + "aggregate added");
});

http.onGet("getaggr", function (req, resp) {
    if (!req.args.aggrnm) { response.send("Missing aggrnm= parameter"); }   
    if (!req.args.storenm) { response.send("Missing storenm= parameter"); }
    var aggr = qm.getStreamAggr("" + req.args.aggrnm, "" + req.args.storenm, 20);    
    jsonp(req, resp, aggr);
});

http.onGet("load", function (req, resp) {
    var outDataFile = fs.openAppend("/home/carolina/Software/QMiner/test/Examples/sensors/sandbox/sensors/sensorMeasurement_data.txt");

    var inDataFile = fs.openRead("/home/carolina/Software/QMiner/test/Examples/sensors/sandbox/sensors/297.csv"); 
    genJSON(inDataFile, outDataFile, "SensorMeasurement", 0);
    console.say("OK");   

    /*inDataFile = fs.openRead("data/2112.csv");                 
    genJSON(inDataFile, outDataFile, 1);
    console.say("OK");   

    inDataFile = fs.openRead("data/2114.csv");                 
    genJSON(inDataFile, outDataFile, 2);
    console.say("OK");   

    inDataFile = fs.openRead("data/2115.csv");                 
    genJSON(inDataFile, outDataFile, 3);
    console.say("OK");   

    inDataFile = fs.openRead("data/2116.csv");                 
    genJSON(inDataFile, outDataFile, 4);
    console.say("OK");   */
    return jsonp(req, resp, "OK");
});

http.onGet("add", function (req, resp) {
            var dataFile = "";
    if (req.store == "SensorNode") {
        dataFile = fs.openAppend("sensorNode_data.txt");
    } else if (req.store == "SensorMeasurement") {
        dataFile = fs.openAppend("sensorMeasurement_data.txt");
    }
    qm.store(req.store).add(JSON.parse(req.data));
    dataFile.write("\n");dataFile.write(req.data);
    console.say("OK");   
    return jsonp(req, resp, "OK");
});

http.onGet("am", function (req, resp) {

    if (!rec.store) { return jsonp(rec, "Give stote name!"); }
    if (!rec.d) { return jsonp(rec, "Give date!"); }
    if (!rec.v) { return jsonp(rec, "Give measurement value!"); }
    if (!rec.n) { return jsonp(rec, "Give node name!"); }
    if (!rec.s) { return jsonp(rec, "Give sensor name!"); }

    var sensorNodeRSet = qm.search({                                     
        "$from": "SNode",
        "Name": rec.n                                          
    });         
    var id = "";
    var sensorRSet = sensorNodeRSet[0].join("hasSensor");   
    console.say(sensorRSet.length + " ");
    for (var s = 0; s < sensorRSet.length; s++) {
        console.say(s + " " + sensorRSet[s].Name + " " + rec.s);
        if (sensorRSet[s].Name == rec.s) {
            id = sensorRSet[s].Id;
        }
    }
    if (id != "") {                    
        var idObj = new Object();       
        idObj.Id = id;
        var jsonObj = new Object();             
        jsonObj.DateTime = rec.d;
        jsonObj.Value = parseFloat(rec.v);
        jsonObj.measuredBy = idObj;      

        //file for storing the measurement - backup
        var dataFile = fs.openAppend("sensorMeasurement_data.txt");
        console.say(JSON.stringify(jsonObj));                           
        qm.store(rec.store).add(jsonObj); 
        dataFile.write("\n"); dataFile.write(JSON.stringify(jsonObj));    
        return jsonp(req, resp, "OK");
    } else { return jsonp(req, resp, "!OK"); }        
});

http.onGet("type", function (req, resp) {
    var recs = qm.search({
        "$from": "SensorType",
        "Type": req.type
    });
    if (recs.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < recs.length; i++) {    
        result.push({name: recs[i].Name, type: recs[i].Type});      
    }   
    return jsonp(req, resp, result);
});

http.onGet("filter", function (req, resp) {       
    //console.say(JSON.stringify(req));   
    //return 0;
    var recs = qm.search(JSON.parse(req.args.filter + ''));

    if (recs.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < recs.length; i++) {    
        result.push({name: recs[i].Name, location: recs[i].Location, status: recs[i].Status});      
    }   
    return jsonp(req, resp, result);
});

http.onGet("zoomCoordinates", function (req, resp) {        
    var store = qm.store("SensorNode");
    var recs = store.recs;
    if (recs.empty) { return "no results"; }
    //console.say("Test", "before for");
    var result = {}; var x = 0, y = 0;       
    for (var i = 0; i < recs.length; i++) {    
        x += recs[i].Location[0];
        y += recs[i].Location[1];       
    }   
    x = x/recs.length;
    y = y/recs.length;
    result = {lat: x, lng: y};
    //console.say("Test", "the result");
    return jsonp(req, resp, result);
});

http.onGet("sensorNodes", function (req, resp) {        
    var store = qm.store("SensorNode");
    var recs = store.recs;
    if (recs.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < recs.length; i++) {    
        result.push({name: recs[i].Name, location: recs[i].Location, status: recs[i].Status});      
    }   
    return jsonp(req, resp, result);
});

http.onGet("sensorTypes", function (req, resp) {        
    var store = qm.store("SensorType");
    var recs = store.recs;
    if (recs.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < recs.length; i++) {    
        result.push({id: recs[i].Id, name: recs[i].Name, type: recs[i].Type});      
    }   
    return jsonp(req, resp, result);
});

http.onGet("sensorMeasurements", function (req, resp) {     
    //var sensorsRSet = qm.store("SensorMeasurement");
    //var recs = store.recs;
    var sensorsRSet = qm.search({ $join: { $name: "measured", $query: { $from: "SensorType", "Type": "bam"}}});
    console.say(JSON.stringify(sensorsRSet)+"");
    if (sensorsRSet.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < sensorsRSet.length; i++) {     
        //var recSet = recs[i].join("measuredBy"); 
        result.push({measuredBy: sensorsRSet[i].Id, dateTime: sensorsRSet[i].DateTime, value: sensorsRSet[i].Value});       
    }   
   return jsonp(req, resp, result);
});

http.onGet("keys", function (req, resp) {     
    var store = qm.store(req.args.store + '');
    var keys = store.keys;       
             
    if (keys.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < keys.length; i++) {     
        result.push(keys[i]);       
    }   
    return jsonp(req, resp, result);               
});

http.onGet("key", function (req, resp) { 
    var store = qm.store(req.store);
    var keys = store.key(req.key).voc;       
    var fq = store.key(req.key).fq;     
    if (keys.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < keys.length; i++) {    
        result.push({key:keys[i], fq: fq[i]});      
    }   
    return jsonp(req, resp, result);               
});

http.onGet("allSensorsInfo", function (req, resp){
    var allSensorsJSON = '{"text": "There are _sensorNodeNo_ sensor devices installed; out of these, _sensorNodeOKNo_ are up and running. <br> _sensorNodeDataNo_ are providing data streams, having a total of _sensorStreamNo_ active streams. <br> The sensor devices are used in _ProjectNo_ projects."}'        
    var store = qm.store("SensorNode");
    var length = store.recs.length;
    allSensorsJSON = allSensorsJSON.replace("_sensorNodeNo_", length.toString());
    var recs = qm.search({
        "$from": "SensorNode",
        "Status": "Running"
    });
    allSensorsJSON = allSensorsJSON.replace("_sensorNodeOKNo_", recs.length.toString());
    return jsonp(req, resp, allSensorsJSON);
});

http.onGet("groupMeasurements", function (req, resp) {    
    //get all the sensors on the node
    
    var sensorsRSet = getSensorsOnNode(req.args.name+'');
    console.say(JSON.stringify(sensorsRSet));
    if (sensorsRSet.empty) { return jsonp(req, resp, "no results"); }    

    // group the sensors by groupId
    var groupsRSetV = qm.op(sensorsRSet, {           
        "$operator": "GroupBy",
        "$storeid": 2,            
        "fieldid": 2                        
    });    

    var result = [];                
    for (var g = 0; g < groupsRSetV.length; g++) {                        
        var group = [];                        
        for (var s = 0; s < groupsRSetV[g].length; s++) {                                
            var sensorType = groupsRSetV[g][s].join("ofType"); 
            var measuredRSet = groupsRSetV[g][s].join("measured");   
            if (measuredRSet.length == 0) { continue; }
            var measurementValV = [];            
            var lastMeasDateTime = new Date(measuredRSet[measuredRSet.length - 1].DateTime);            
            var threeDaysWindow = new Date(measuredRSet[measuredRSet.length - 1].DateTime);        
            threeDaysWindow.setDate(lastMeasDateTime.getDate() - 3);
            for (var m = 0; m < measuredRSet.length; m++) {                        
                if (measuredRSet.length > 2) {                                                
                    var crtMeasDateTime = new Date(measuredRSet[m].DateTime);                  
                    if (crtMeasDateTime.valueOf() > threeDaysWindow.valueOf()) 
                    {
                        measurementValV.push({          
                            time: measuredRSet[m].DateTime,
                            value: measuredRSet[m].Value
                        });
                    }//if
                }//if
            }//for       
            group.push({sensor: sensorType[0].Type, unit: sensorType[0].UoM, measured: measurementValV});   
        }//for  
        result.push({group: groupsRSetV[g][0].GroupId, data: group});  
    }           
    return jsonp(req, resp, result);               
});   

http.onGet("posClust", function (req, resp){        
    var clusts = qm.op({
        "$operator": "AggClust",
        "$storeid": 1,            
        "fieldid": 2            
    });

    console.say("started " + clusts.length);               
    var result = [];
    for (var cid = 0; cid < clusts.length; cid++) { 
        var recs = [];
        console.say("started " + clusts[cid].length);   
        for (var rid = 0; rid < clusts[cid].length; rid++) {       
            recs.push({name: clusts[cid][rid].Name, 
                location: clusts[cid][rid].Location, 
                status: clusts[cid][rid].Status});      
        }   
        result.push({"clusterid": cid, "recs": recs});      
    }   
    console.say(" " + result); 

    return jsonp(req, resp, result);    
});

http.onGet("measurementsByNode", function (req) {    
    var sensorsRSet = getSensorsOnNode(req.name);
    if (sensorsRSet.empty) { return jsonp(req, resp, "no results"); }        
    var result = [];        
    for (var i = 0; i < sensorsRSet.length; i++) {  
        var sensorType = sensorsRSet[i].join("ofType");     
        if (sensorType[0].Type == "battery voltage" || 
            sensorType[0].Type == "signal strength") {continue; };
        var measuredRSet = sensorsRSet[i].join("measured");            
        var measurementValV = [];            
        var lastMeasDateTime = new Date(measuredRSet[measuredRSet.length - 1].DateTime);            
        var threeDaysWindow = new Date(measuredRSet[measuredRSet.length - 1].DateTime);        
        threeDaysWindow.setDate(lastMeasDateTime.getDate() - 3);
        for (var v = 0; v < measuredRSet.length; v++) {              
            if (measuredRSet.length > 2) {                                                
                var crtMeasDateTime = new Date(measuredRSet[v].DateTime);                  
                if (crtMeasDateTime.valueOf() > threeDaysWindow.valueOf()) 
                {
                    measurementValV.push({          
                        time: measuredRSet[v].DateTime,
                        value: measuredRSet[v].Value
                    });
                }
            }
        }       
        result.push({sensor: sensorType[0].Type, unit: sensorType[0].UoM, measured: measurementValV});                
    }   
    return jsonp(req, resp, result);               
});   

http.onGet("measurements", function (req, resp) {       
    var store = qm.store("SensorMeasurement");
    var recs = store.recs;        
    if (recs.empty) { return jsonp(req, resp, "no results"); }
    var result = [];        
    for (var i = 0; i < recs.length; i++) {    
        var recSet = recs[i].join("measuredBy");              
        result.push({measuredBy: recSet[0].Id, time: recs[i].DateTime, value: recs[i].Value});      
    } 
    return jsonp(req, resp, result);
});

http.onGet("tagCloud", function (req, resp) {
    var recs = qm.search({
        "$from": "SensorType",
        "$field": "name",
        "$aggr":  {" $type": "piechart", "$field": "name" }
    });
    if (recs.empty) { return "no results"; }
    var result = [];        
    for (var i = 0; i < recs.length; i++) {    
        result.push({name: recs[i].Name, type: recs[i].Type});      
    }   
    return jsonp(req, resp, result);
});

http.onGet("correlations", function (req, resp) {    
    //get all the sensors on the node
    var sensorsRSet = getSensorsOnNode(req.name);
    if (sensorsRSet.empty) { return jsonp(req, resp, "no results"); }    

    // group the sensors by groupId
    var groupsRSetV = qm.op(sensorsRSet, {           
        "$operator": "GroupBy",
        "$storeid": req.storeid,         //3    
        "fieldid": req.fieldid           //1                        
    });    

    //if(0 < query.corr1fid && query.corr1fid < groupsRSetV.length) 

    var corrV = qm.corr({                       
        "$storeid": 3,            
        "fieldid": 9,                        
        "field1id": 2,                        
        "field2id": 3                       
    });    
    console.say("" + corrV.length);
});

//http://localhost:8080/sensors/addSensorType?data={%22Id%22:%2210%22,%20%22Name%22:%22JANKO%22,%22Type%22:%22tefe%22,%22onNode%22:{%22Name%22:%22Node%20500%22,%22Status%22:%22Running%22,%22Location%22:[45.91494,14.22883],%22Cluster%22:%22Unknown%22,%22Scope%22:%22Environmental%20monitoring%22,%20%22Source%22:%22JSI%22},%22measured%22:[{%22DateTime%22:%222013-01-21T11:15:47%22,%22Value%22:1},{%22DateTime%22:%222013-01-21T11:13:47%22,%22Value%22:2},{%22DateTime%22:%222013-01-21T11:11:47%22,%22Value%22:3}]}
http.onGet("addSensorType", function (req, resp) {
    SensorType.add(JSON.parse(req.args.data));    
    console.say("OK addSensorType");   
    return jsonp(req, resp, "OK");
});

//http://localhost:8080/sensors/addSensorMeasurement?data={"DateTime":"2013-01-22T11:11:47","Value":4, "measuredBy":[{"Id":"10", "Name":"JANKO","Type":"tefe"}]}
http.onGet("addSensorMeasurement", function (req, resp) {
    if (JSON.parse(req.args.data).store == 'WeatherMeasurement') {
        WeatherMeasurement.add(JSON.parse(req.args.data));    
        console.say("OK addWeatherMeasurement");   
    }
    else {
        SensorMeasurement.add(JSON.parse(req.args.data));    
        console.say("OK addSensorMeasurement");   
    }
    return jsonp(req, resp, "OK");
});

//http://localhost:8080/sensors/queryMeasurement?data={"$from":"SensorMeasurement"}
http.onGet("queryMeasurement", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);
    console.say("" + JSON.stringify(jsonData));
    var recs = qm.search(jsonData);
    var result = []; 
    for (var i = 0; i < 20; i++) {     
        result.push({value: recs[i].Value, timestamp: recs[i].DateTime});       
    }
    jsonp(req, resp, result);
});

//http://localhost:8080/sensors/queryLastMeasurementAndType?data={"$from":"SensorMeasurement"}
//http://localhost:8080/sensors/queryLastMeasurementAndType?data={"$join":{"$name":"measured","$query":{"$from":"SensorType","Name":"wind_direction"}}}
http.onGet("queryLastMeasurementAndType", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);
    console.say("" + JSON.stringify(jsonData));
    //By date is now reversed because we feed reversed data
    jsonData.$sort = { "DateTime": 1 };
    jsonData.$limit = 0;
    var recs = qm.search(jsonData);
    var result = []; 
    if (recs) {
        result.push({value: recs[0].Value, timestamp: recs[0].DateTime, type_id: recs[0].measuredBy[0].Id});        
    }
    jsonp(req, resp, result);
});
//http://localhost:8080/sensors/queryMeasurementAndType?data={"$from":"SensorMeasurement"}
//TODO: JOÅ T add selector by type, then query, then stream -> so, get last temp measurement, to add to stream.
http.onGet("queryMeasurementAndType", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);
    console.say("" + JSON.stringify(jsonData));
    var recs = qm.search(jsonData);
    var result = []; 
    if (recs) {
        for (var i = 0; i < recs.length; i++) { 
            if (recs[i].measuredBy) {
                result.push({value: recs[i].Value, timestamp: recs[i].DateTime, type_id: recs[i].measuredBy[0].Id});        
            }
        }
    }
    jsonp(req, resp, result);
});

//http://localhost:8080/sensors/query_boss?data={%20%22$join%22:%20{%20%22$name%22:%20%22measured%22,%20%22$query%22:%20{%22$from%22:%22SensorType%22,%20%22Id%22:%221%22}%20}%20}
//http://localhost:8080/sensors/query_boss?data={"$from":"SensorMeasurement"}
http.onGet("query_boss", function (req, resp) {    
    console.say("" + JSON.stringify(req.args.data));
    jsonData = JSON.parse(req.args.data);
    console.say("" + JSON.stringify(jsonData));
    var recs = qm.search(jsonData);
    jsonp(req, resp, recs);
});

//http://localhost:8080/sensors/query_boss_aggr?dataS={%22$join%22:{%22$name%22:%22measured%22,%22$query%22:{%22$from%22:%22SensorType%22,%22Name%22:%22wind_direction%22}}}&dataAgg={%22name%22:%22Value%22,%22type%22:%22histogram%22,%22field%22:%22Value%22}
http.onGet("query_boss_aggr", function (req, resp) {    
    jsonData = JSON.parse(req.args.dataS);
    jsonDataAgg = JSON.parse(req.args.dataAgg);
    console.say("" + JSON.stringify(jsonData));
    var res = qm.search(jsonData);
    var recs = res.aggr(jsonDataAgg);
    jsonp(req, resp, recs);
});

//-------------------------------------------------- stream aggregators experiments -------------------------------------------------------
//http://localhost:8080/sensors/add_stream_aggr?data={"store":"SensorMeasurement","name":"valueAgg","field":"Value","timeField":"DateTime","window":{"unit":"hour","value":2}}
http.onGet("add_stream_aggr", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);

    var store = qm.store(jsonData.store);
    var recs = store.addStreamAggr("numeric",jsonData);

    jsonp(req, resp, recs);
});

//get aggregate data
//http://localhost:8080/sensors/get_stream_aggr?data={"store":"SensorMeasurement","name":"valueAgg","limit":20}
http.onGet("get_stream_aggr", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);
    var store = qm.store(jsonData.store);
    var recs = store.getStreamAggr(jsonData.name, jsonData.limit);

    jsonp(req, resp, recs);
});

//http://localhost:8080/sensors/store_info?data={"store":"SensorMeasurement"}
http.onGet("store_info", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);
    var store = qm.store(jsonData.store);

    jsonp(req, resp, store);
});

//Feature generators experiments
//http://localhost:8080/sensors/feature_gen?data={"type":"multinomial","source":"SensorMeasurement","field":"DateTime"}
http.onGet("feature_gen", function (req, resp) {    
    jsonData = JSON.parse(req.args.data);

    var recs = qm.search({ "$from" : jsonData.source});
    var featureSpace = qm.analytics.newFeatureSpace(jsonData);

    featureSpace.updateRecords(recs);

    jsonp(req, resp, featureSpace);
});

function squareVector(vect){
    var squaredVec = [];
    for(var i = 0; i < vect.length; i++){
        for(var j = 0; j < vect.length; j++){
            if (i == 0) {
                //squaredVec[]
            };
        }
    }
}

//-------------------------------------- streaming linear regression & prediction experiments --------------------------------------------
//INIT:
var analytics = require('analytics');
var nodeStoreNm = "SMeasAvg";
var wStoreNm = "WMeasAvg";
var wPredNm = "WPredHour";
var hoursInAdvance = 6; //how many hours in advance do we predict?
var maWindow = 60; //size of moving average window in minutes
var buffSize = hoursInAdvance * 60 / maWindow; //how many ticks in advance do we predict
var nAreg = hoursInAdvance * 60 / maWindow; //how many previous values do we take in account for autoregression
var sInterval = 120; //interval of sensor measurements in seconds

//define stores we'll be storing resampled measurements into
var Training = qm.store("SensorMeasurementCalc");
var WeatherResampled = qm.store("WeatherMeasurementCalc");
var WMeasAvg = qm.store("WMeasAvg");
var SMeasAvg = qm.store("SMeasAvg");
var WPredHour = qm.store("WPredHour");
qm.load.jsonFile(WPredHour, "sandbox/sensors/forecastio.txt.json");


//initialize resamplers
// results in an equally spaced time series with n second interval
WeatherMeasurement.addStreamAggr({ name: "Resample2mins", type: "resampler",
    outStore: "WeatherMeasurementCalc", timestamp: "DateTime", start: "2013-05-01T07:29:00", 
    fields: [ 
        { name: "wind_direction", interpolator: "previous" },
        { name: "air_temperature", interpolator: "previous" },
        { name: "humidity", interpolator: "previous" },
        { name: "wind_speed", interpolator: "previous" },
        { name: "rain", interpolator: "previous" },
        { name: "solar_radiation", interpolator: "previous" } ],
    createStore: false, interval: sInterval*1000 });
SensorMeasurement.addStreamAggr({ name: "Resample2mins", type: "resampler",
    outStore: "SensorMeasurementCalc", timestamp: "DateTime", start: "2013-05-01T07:29:00", 
    fields: [ 
        { name: "current_val", interpolator: "previous" },
        { name: "bottom_solar_cell_temperature", interpolator: "previous" },
        { name: "top_solar_cell_temperature", interpolator: "previous" },
        { name: "air_temperature", interpolator: "previous" } ],
    createStore: false, interval: sInterval*1000 });

// insert Training store aggregates
//moving averages for the sensor node
Training.addStreamAggr({ name: "window_current", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "current_val", winsize: maWindow });          
Training.addStreamAggr({ name: "ma_current", type: "ma", 
    inAggr: "window_current" });           
Training.addStreamAggr({ name: "window_bott", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "bottom_solar_cell_temperature", winsize: maWindow });          
Training.addStreamAggr({ name: "ma_bott", type: "ma", 
    inAggr: "window_bott" });           
Training.addStreamAggr({ name: "window_topt", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "top_solar_cell_temperature", winsize: maWindow });          
Training.addStreamAggr({ name: "ma_topt", type: "ma", 
    inAggr: "window_topt" });           
Training.addStreamAggr({ name: "window_airt", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "air_temperature", winsize: maWindow });          
Training.addStreamAggr({ name: "ma_airt", type: "ma", 
    inAggr: "window_airt" });           
Training.addStreamAggr({ name: "window_sunaltltr", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "sunAltLater", winsize: maWindow });          
Training.addStreamAggr({ name: "ma_sunaltltr", type: "ma", 
    inAggr: "window_sunaltltr" });           
Training.addStreamAggr({ name: "window_sunazimltr", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "sunAzimLater", winsize: maWindow });          
Training.addStreamAggr({ name: "ma_sunazimltr", type: "ma", 
    inAggr: "window_sunazimltr" });           

//moving averages for the weather station
WeatherResampled.addStreamAggr({ name: "window_windd", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "wind_direction", winsize: maWindow });
WeatherResampled.addStreamAggr({ name: "ma_windd", type: "ma", 
    inAggr: "window_windd" });          
WeatherResampled.addStreamAggr({ name: "window_atemp", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "air_temperature", winsize: maWindow });
WeatherResampled.addStreamAggr({ name: "ma_airt", type: "ma", 
    inAggr: "window_atemp" });          
WeatherResampled.addStreamAggr({ name: "window_hum", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "humidity", winsize: maWindow });
WeatherResampled.addStreamAggr({ name: "ma_hum", type: "ma", 
    inAggr: "window_hum" });          
WeatherResampled.addStreamAggr({ name: "window_sol", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "solar_radiation", winsize: maWindow });
WeatherResampled.addStreamAggr({ name: "ma_sol", type: "ma", 
    value: "solar_radiation", inAggr: "window_sol" });          
WeatherResampled.addStreamAggr({ name: "window_winds", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "wind_speed", winsize: maWindow });
WeatherResampled.addStreamAggr({ name: "ma_winds", type: "ma", 
    value: "wind_speed", inAggr: "window_winds" });          
WeatherResampled.addStreamAggr({ name: "window_rain", type: "timeSeriesWinBuf", 
    timestamp: "DateTime", value: "rain", winsize: maWindow });
WeatherResampled.addStreamAggr({ name: "ma_rain", type: "ma", 
    value: "rain", inAggr: "window_rain" });          

// insert buffer for generating training examples
SMeasAvg.addStreamAggr({ name: "delay", type: "recordBuffer", size: buffSize});

// define feature extractors FS.... -> featureSpace...
// feature space of one node
var FSNode = analytics.newFeatureSpace([
    {type:"multinomial", source: nodeStoreNm, field:"DateTime", datetime: true},
    {type:"numeric", source: nodeStoreNm, field:"bottom_solar_cell_temperature"},
    {type:"numeric", source: nodeStoreNm, field:"top_solar_cell_temperature"},
    {type:"numeric", source: nodeStoreNm, field:"sunAltLater"},
    {type:"numeric", source: nodeStoreNm, field:"sunAzimLater"},
    {type:"numeric", source: nodeStoreNm, field:"air_temperature"}
]);
var FSSolar = analytics.newFeatureSpace([
    {type:"numeric", source: nodeStoreNm, field:"sunAltLater"},
    {type:"numeric", source: nodeStoreNm, field:"sunAzimLater"}
]);
// feature space of whole weather station
var FSWthrAll = analytics.newFeatureSpace([
    // {type:"multinomial", source: wStoreNm, field:"DateTime", datetime: true},
    {type:"numeric", source: wStoreNm, field:"wind_direction"},
    {type:"numeric", source: wStoreNm, field:"air_temperature"},
    {type:"numeric", source: wStoreNm, field:"humidity"},
    {type:"numeric", source: wStoreNm, field:"solar_radiation"},
    {type:"numeric", source: wStoreNm, field:"wind_speed"},
    {type:"numeric", source: wStoreNm, field:"rain"}
]);
// feature space of relevant weather station data -> TODO: make this weather prediction data
var FSWthrRel = analytics.newFeatureSpace([
    {type:"numeric", source: wStoreNm, field:"air_temperature"}/*,
    {type:"numeric", source: wStoreNm, field:"solar_radiation"}*/
]);
// feature space of relevant weather station data -> TODO: make this weather prediction data
var FSWthrFcast = analytics.newFeatureSpace([
    {type:"numeric", source: wPredNm, field:"temperature"},
    {type:"numeric", source: wPredNm, field:"apparent_temperature"},
    {type:"numeric", source: wPredNm, field:"dew_point"},
    {type:"numeric", source: wPredNm, field:"humidity"},
    {type:"numeric", source: wPredNm, field:"wind_speed"},
    {type:"numeric", source: wPredNm, field:"wind_bearing"},
    {type:"numeric", source: wPredNm, field:"visibility"},
    {type:"numeric", source: wPredNm, field:"cloud_cover"}
]);

console.say("DIM OF FS: " + (FSNode.dim + FSWthrAll.dim + FSWthrRel.dim))
var LRVect = [
    analytics.newRecLinReg({"dim": FSNode.dim + FSWthrAll.dim + FSWthrRel.dim, "forgetFact":1, "regFact":1}),
    analytics.newRecLinReg({"dim": FSSolar.dim + FSWthrRel.dim, "forgetFact":0.9995, "regFact":1000}),
    analytics.newRecLinReg({"dim": FSSolar.dim + FSWthrRel.dim + nAreg, "forgetFact":0.9995, "regFact":1000}),
    analytics.newRecLinReg({"dim": FSSolar.dim + FSWthrFcast.dim, "forgetFact":0.9995, "regFact":1000}), // solar + wforecast
    analytics.newRecLinReg({"dim": 1 + FSSolar.dim + FSWthrFcast.dim, "forgetFact":0.9995, "regFact":1000}) // intercept + solar + wforecast
]

var rememberDate = "1970-09-07T12:12:12";
var outFile = fs.openWrite("sandbox/sensors/output.txt");
outFile.writeLine(
    "from: \tto: \tmax: \tmin: \tavg: \tcount: \tavgErrAll: \tavgErrSW: \tavgErrSWAreg: \tavgErrSWFcast: \tavgErrSWFcastIcept: \tavgErrAllSq: \tavgErrSWSq: \tavgErrSWAregSq: \tavgErrSWFcastSq: \tavgErrSWFcastIceptSq: "
);

var max = 0;
var min = 999999;
var sum = 0;
var avg = 0;
var count2min = 0;
var count = 0;
var eSums = [];
var eSumsSq = [];
var sumAltLater = 0;
var sumAzimLater = 0;

var predictBuffer = [];
var oldVals = [];
var tmpVec = []; // just to use for linreg when oldVals vector isn't full yet.
for (var i = 0; i < nAreg; i++) tmpVec[i] = 0;

var oldMinute = 0;
var oldMinute2 = 0;

// add trigger to store hourly averages
Training.addTrigger({
    onAdd: function (val) {
        // get time of sunrise for every sensor TODO: now just adding 2 hours manually, would need to take location in account
        var sensorInfo = qm.search({$from: "SensorNode", Name: "Node_54"});
        var dateNow = new Date(val.DateTime.string + '+0200');
        var datePredictingFor = new Date(dateNow.getTime() + buffSize*maWindow*60000);
        var currentHour = new Date(Date.parse(val.DateTime.string));
        var currentMinute = currentHour.getMinutes();
        currentHour.setMinutes(0);
        currentHour.setHours(currentHour.getHours() - 1);

        //TODO: get timezones in order, in the winter time there may be problems
        datePredictingFor.setHours(datePredictingFor.getHours()/*-2*/);

        var sunPosTimeOfPrediction = compute_angle(
            sensorInfo[0].Location[0],
            sensorInfo[0].Location[1],
            '2.0', // TODO: manage this timezone relative to WINTER/SUMMER time
            datePredictingFor.toString()
        );

        //console.say("NOW: " + dateNow.toString())
        //console.say("PREDFOR: " + datePredictingFor.toString())
        count2min++;
        sumAltLater += sunPosTimeOfPrediction[0];
        sumAzimLater += Math.abs(sunPosTimeOfPrediction[1]);

        Training.add({ 
            $id: val.$id,
            sunAltLater: sunPosTimeOfPrediction[0],
            sunAzimLater: Math.abs(sunPosTimeOfPrediction[1])
        });

        //when hour breaks record averages in a new store
        if(currentMinute < oldMinute){
            SMeasAvg.add({
                DateTime: currentHour.toISOString(),
                current_val: Training.getStreamAggr("ma_current").MA,
                bottom_solar_cell_temperature: Training.getStreamAggr("ma_bott").MA,
                top_solar_cell_temperature: Training.getStreamAggr("ma_topt").MA,
                air_temperature: Training.getStreamAggr("ma_airt").MA,
                sunAltLater: sumAltLater/count2min,
                sunAzimLater: sumAzimLater/count2min
            });
            sumAzimLater = 0;
            sumAltLater = 0;
            count2min = 0;
        }
        if(oldMinute < 30 && currentMinute >= 30 && maWindow == 30){
            currentHour.setMinutes(30);
            SMeasAvg.add({
                DateTime: currentHour.toISOString(),
                current_val: Training.getStreamAggr("ma_current").MA,
                bottom_solar_cell_temperature: Training.getStreamAggr("ma_bott").MA,
                top_solar_cell_temperature: Training.getStreamAggr("ma_topt").MA,
                air_temperature: Training.getStreamAggr("ma_airt").MA,
                sunAltLater: sumAltLater/count2min,
                sunAzimLater: sumAzimLater/count2min
            });
            sumAzimLater = 0;
            sumAltLater = 0;
            count2min = 0;            
        }
        oldMinute = currentMinute;
    }
});

// add trigger to store hourly averages of 
WeatherResampled.addTrigger({
    onAdd: function (val) {
        var currentHour = new Date(Date.parse(val.DateTime.string));
        var currentMinute = currentHour.getMinutes();
        currentHour.setMinutes(0);
        currentHour.setHours(currentHour.getHours() - 1);
        //when hour breaks record averages in a new store
        if(currentMinute < oldMinute2){
            WMeasAvg.add({
                DateTime: currentHour.toISOString(),
                wind_direction: WeatherResampled.getStreamAggr("ma_windd").MA,
                air_temperature: WeatherResampled.getStreamAggr("ma_airt").MA,
                humidity: WeatherResampled.getStreamAggr("ma_hum").MA,
                solar_radiation: WeatherResampled.getStreamAggr("ma_sol").MA,
                wind_speed: WeatherResampled.getStreamAggr("ma_winds").MA,
                rain: WeatherResampled.getStreamAggr("ma_rain").MA
            });
        }
        if(oldMinute2 < 30 && currentMinute >= 30 && maWindow == 30){
            currentHour.setMinutes(30);
            WMeasAvg.add({
                DateTime: currentHour.toISOString(),
                wind_direction: WeatherResampled.getStreamAggr("ma_windd").MA,
                air_temperature: WeatherResampled.getStreamAggr("ma_airt").MA,
                humidity: WeatherResampled.getStreamAggr("ma_hum").MA,
                solar_radiation: WeatherResampled.getStreamAggr("ma_sol").MA,
                wind_speed: WeatherResampled.getStreamAggr("ma_winds").MA,
                rain: WeatherResampled.getStreamAggr("ma_rain").MA
            });
        }
        oldMinute2 = currentMinute;
    }
});

// learning and prediction when new hourly avg is stored
SMeasAvg.addTrigger({
    onAdd: function (val) {
        var sensorInfo = qm.search({$from: "SensorNode", Name: "Node_54"});
        //TODO: set timezone by coordinates
        var dateNow = new Date(val.DateTime.string + '+0200');
        var dateNowAdjusted = new Date(val.DateTime.string + '+0200');
        //we add two hours so sunrise and sunset get calculated for the correct day. otherwise it's usually lagging for 1 day
        dateNowAdjusted.setHours(dateNowAdjusted.getHours() + 2); //TODO: add number of hours by timezone
        var datePredictingFor = new Date(dateNow.getTime() + buffSize*maWindow*60000);
        var sunriseTime = dateNowAdjusted.sunrise(sensorInfo[0].Location[0],sensorInfo[0].Location[1]);
        var sunsetTime = dateNowAdjusted.sunset(sensorInfo[0].Location[0],sensorInfo[0].Location[1]);
        
        /*
        console.say("BUFFER: START ")
        console.say("BUFFER: TIME - " + dateNow.toString())
        predictBuffer.forEach(function(element){
            console.say("BUFFER: " + JSON.stringify(element))
        })
        console.say("BUFFER: END ")
        */

        //Learn and predict only in daytime
        if(datePredictingFor < sunriseTime || dateNow > sunsetTime){ 
            SMeasAvg.add({ 
                $id: val.$id,
                crnt_pred_all: val.current_val, 
                crnt_pred_solar_wpred: val.current_val,
                crnt_pred_solar_wpred_areg: val.current_val,
                crnt_pred_solar_fcastio: val.current_val,
                crnt_pred_solar_fcastio_lintercept: val.current_val
            });

            //JUST keep filling the buffer at night
            predictBuffer.push([
                val.current_val, 
                val.current_val, 
                val.current_val,
                val.current_val,
                val.current_val
            ]);

            if(predictBuffer.length > buffSize){
                predictBuffer.shift();
            }
/*
            console.say("NIGHT TIME");
            console.say("DATE: START ")
            console.say("DATE: datePredictingFor < sunriseTime: " + (datePredictingFor < sunriseTime))
            console.say("DATE: dateNow > sunsetTime: " + (dateNow > sunsetTime))
            console.say("DATE: received - " + val.DateTime.string)
            console.say("DATE: read - " + dateNow.toString())
            console.say("DATE: predfor - " + datePredictingFor.toString())
            console.say("DATE: sunrise - " + sunriseTime.toString())
            console.say("DATE: sunset - " + sunsetTime.toString())
            console.say("DATE: END ")*/
        }
        else{ 
            // IF not night then calculate
            var WNow = WMeasAvg[val.$id];
            var WFuture = WMeasAvg[val.$id + buffSize];
            var preds = [] //storing predictions
            
            // prediction using all available data ----------------------------------------------------------------------------------------------
            var ftrVAll = FSNode.ftrVec(val);
            ftrVAll.concat(FSWthrAll.ftrVec(WNow));
            ftrVAll.concat(FSWthrRel.ftrVec(WFuture)); //Current weather data
            preds.push(LRVect[0].predict(ftrVAll));
            // prediction using only weather prediction and solar angles -------------------------------------------------------------------------------
            // get "weather prediction" -> value from sensor n samples in the future. Cheating a bit now, fix it with weather prediction data.
            var ftrVSolWPred = FSSolar.ftrVec(val);
            ftrVSolWPred.concat(FSWthrRel.ftrVec(WFuture));
            preds.push(LRVect[1].predict(ftrVSolWPred));
            // prediction using weather prediction and solar angles + prediction with added autoregression -------------------------------------------------------------------
            // setup for autoregression
            // fill the vector with previous values -> fill it on every iteration without querying the db
            if(oldVals.length >= nAreg + buffSize){
                //vector of old values used for prediction - contains values n back from current measurement
                var oldValsCVec = linalg.newVec(oldVals.slice(oldVals.length-nAreg, oldVals.length));
                //vector of old values used for learning - contains values n back from end of buffer
                //in real life these vectors would be the same
                var endBuffValsCVec = linalg.newVec(oldVals.slice(0, nAreg));
                oldVals.shift();
            }
            else{
                var oldValsCVec = linalg.newVec(tmpVec);
                var endBuffValsCVec = linalg.newVec(tmpVec);
            }
            oldVals.push(val.current_val);
            
            ftrVSolWPred.concat(oldValsCVec);
            ftrVWSAreg = ftrVSolWPred;
            // add autoregression
            preds.push(LRVect[2].predict(ftrVWSAreg));

            // prediction using only weather prediction from forecast.io and solar angles -------------------------------------------------------------------------------
            var ftrVSolWFcast = FSSolar.ftrVec(val);
            var WFcast = qm.search({ "$from" : "WPredHour" , "DTString" : WFuture.DateTime.string.substring(0, WFuture.DateTime.string.length - 2 )});
            ftrVSolWFcast.concat(FSWthrFcast.ftrVec(WFcast[0]));
            console.say("HERE!")
            preds.push(LRVect[3].predict(ftrVSolWFcast));
            // prediction using only weather prediction from forecast.io and solar angles plus a constant 1 for linear intercept -------------------------------------------------------------------------------
            ftrVSolWFcast.push(1);
            preds.push(LRVect[4].predict(ftrVSolWFcast));

            // store predicted values in the buffer so we can match them to correct timestamps later
            predictBuffer.push(preds);
            if(predictBuffer.length > buffSize){
                console.say("DATE: crnt_pred_all " + predictBuffer[0][0])
                console.say("DATE: crnt_pred_solar_wpred " + predictBuffer[0][1])
                console.say("DATE: crnt_pred_solar_wpred_areg " + predictBuffer[0][2])
                console.say("DATE: crnt_pred_solar_fcastio " + predictBuffer[0][3])
                console.say("DATE: crnt_pred_solar_fcastio " + predictBuffer[0][4])
                SMeasAvg.add({ 
                    $id: val.$id, 
                    crnt_pred_all: predictBuffer[0][0], 
                    crnt_pred_solar_wpred: predictBuffer[0][1],
                    crnt_pred_solar_wpred_areg: predictBuffer[0][2],
                    crnt_pred_solar_fcastio: predictBuffer[0][3],
                    crnt_pred_solar_fcastio_lintercept: predictBuffer[0][4]
                });
                predictBuffer.shift();
            }

            //get Id of record n positions back - end of the buffer
            var trainRecId = SMeasAvg.getStreamAggr("delay").first;
            // Learning part
            if (trainRecId > 0) {
                // learn using all available data ----------------------------------------------------------------------------------------------
                var ftrVAll = FSNode.ftrVec(SMeasAvg[trainRecId]) 
                ftrVAll.concat(FSWthrAll.ftrVec(WMeasAvg[trainRecId])) 
                ftrVAll.concat(FSWthrRel.ftrVec(WMeasAvg[val.$id]));
                LRVect[0].learn(ftrVAll, val.current_val);

                // learn using only weather prediction and solar angles -------------------------------------------------------------------------------
                var ftrVSolWPred = FSSolar.ftrVec(SMeasAvg[trainRecId])
                ftrVSolWPred.concat(FSWthrRel.ftrVec(WMeasAvg[val.$id]));
                LRVect[1].learn(ftrVSolWPred, val.current_val);

                // learn with above and added autoregression -------------------------------------------------------------------
                ftrVSolWPred.concat(oldValsCVec);
                ftrVWSAreg = ftrVSolWPred;
                LRVect[2].learn(ftrVWSAreg, val.current_val)
                
                // learn using only weather forecast from forecast.io and solar angles -------------------------------------------------------------------------------
                var ftrVSolWFcast = FSSolar.ftrVec(SMeasAvg[trainRecId])
                var WFcast = qm.search({ "$from" : "WPredHour" , "DTString" : WMeasAvg[val.$id].DateTime.string.substring(0, WMeasAvg[val.$id].DateTime.string.length - 2 )});
                ftrVSolWFcast.concat(FSWthrFcast.ftrVec(WFcast[0]));
                LRVect[3].learn(ftrVSolWFcast, val.current_val);

                // learn using only weather forecast from forecast.io and solar angles and linear intercept-------------------------------------------------------------------------------
                ftrVSolWFcast.push(1);
                LRVect[4].learn(ftrVSolWFcast, val.current_val);

            }
            // check predictions
            var diff = [];
            diff.push(Math.abs(val.current_val - val.crnt_pred_all));
            diff.push(Math.abs(val.current_val - val.crnt_pred_solar_wpred));
            diff.push(Math.abs(val.current_val - val.crnt_pred_solar_wpred_areg));
            diff.push(Math.abs(val.current_val - val.crnt_pred_solar_fcastio));
            diff.push(Math.abs(val.current_val - val.crnt_pred_solar_fcastio_lintercept));

            var diffSq = [];
            diffSq.push(Math.pow(val.current_val - val.crnt_pred_all, 2));
            diffSq.push(Math.pow(val.current_val - val.crnt_pred_solar_wpred, 2));
            diffSq.push(Math.pow(val.current_val - val.crnt_pred_solar_wpred_areg, 2));
            diffSq.push(Math.pow(val.current_val - val.crnt_pred_solar_fcastio, 2));
            diffSq.push(Math.pow(val.current_val - val.crnt_pred_solar_fcastio_lintercept, 2));

            if(diff.indexOf('NaN') == -1){
                SMeasAvg.add({ 
                    $id: val.$id,
                    diff_all: diff[0], 
                    diff_solar_wpred: diff[1], 
                    diff_solar_wpred_areg: diff[2], 
                    diff_solar_fcastio: diff[3], 
                    diff_solar_fcastio_lintercept: diff[4], 
                    diff_all_sq: diffSq[0], 
                    diff_solar_wpred_sq: diffSq[1], 
                    diff_solar_wpred_areg_sq: diffSq[2],
                    diff_solar_fcastio_sq: diffSq[3],
                    diff_solar_fcastio_lintercept_sq: diffSq[4]
                });
            }

            if(max < val.current_val)
                max = val.current_val;
            if(min > val.current_val)
                min = val.current_val;
            count++;
            sum += val.current_val;
            avg = sum/count;

            eSums = sumArray(eSums, diff);
            eSumsSq = sumArray(eSumsSq, diffSq);
            avgESums = divArray(eSums, count);
            avgESumsSq = divArray(eSumsSq, count);

            console.log("count: " + count);

            if(Date.parse(val.DateTime.string) - Date.parse(rememberDate) > 1000*60*60*24*7){
                outFile.writeLine(
                    rememberDate + "\t" + 
                    val.DateTime.string + "\t" + 
                    max.toFixed(2) + "\t" + 
                    min.toFixed(2) + "\t" + 
                    avg.toFixed(2) + "\t" + 
                    count + "\t" + 
                    avgESums[0].toFixed(2) + "\t" + 
                    avgESums[1].toFixed(2) + "\t" + 
                    avgESums[2].toFixed(2) + "\t" + 
                    avgESums[3].toFixed(2) + "\t" + 
                    avgESums[4].toFixed(2) + "\t" + 
                    avgESumsSq[0].toFixed(2) + "\t" + 
                    avgESumsSq[1].toFixed(2) + "\t" + 
                    avgESumsSq[2].toFixed(2) + "\t" + 
                    avgESumsSq[3].toFixed(2) + "\t" + 
                    avgESumsSq[4].toFixed(2)
                );
                outFile.flush();
                rememberDate = val.DateTime.string;
                console.log("Wrote to file!");
                max = 0;
                min = 999999;
                avg = 0;
                sum = 0;
                count = 0;
                eSums = [];
                eSumsSq = [];
            }
        }
    }
});

http.onGet("queryLastMeasurementAndPredict", function (req, resp) {    
    //jsonData = JSON.parse(req.args.data);
    //console.say("" + JSON.stringify(jsonData));
    //var recs = qm.search(jsonData);
    var result = []; 

    var recs = qm.search({ "$from" : "SMeasAvg" , "$limit" : 0, "$sort":{"DateTime" : -1}});
    if (recs.length) {
        var Weatherrec = WMeasAvg[recs[0].$id];

        result.push({
            value: recs[0].current_val, 
            pred_value: recs[0].crnt_pred_all, 
            pred_value_fctemp_solar_autoreg: recs[0].crnt_pred_solar_wpred_areg, 
            pred_value_fctemp_solar: recs[0].crnt_pred_solar_wpred, 
            time: recs[0].DateTime.string,
            idx: recs[0].$id,
            others:{ 
                bot_temp: recs[0].bottom_solar_cell_temperature,
                top_temp: recs[0].top_solar_cell_temperature,
                air_temp: recs[0].air_temperature,
                air_temp2: Weatherrec.air_temperature,
                solar_radiation: Weatherrec.solar_radiation,
        }});  
    }
    jsonp(req, resp, result);
});

//---------------------------------------------- stream aggregate for a week --------------------------------------
function getCurrentAgg() {    
    var res = Training.getStreamAggr("weekAgg");
    console.log(JSON.stringify(res));
    return res;
}
function sumArray(arr1, arr2) {
    var newArr = [];
    if(arr1.length == arr2.length){
        for(var i = 0; i < arr1.length; i++){
            newArr.push(arr1[i] + arr2[i]);
        }
    }
    else
        newArr = arr2;
    return newArr
}
//divide every element by number
function divArray(arr, num) {
    var newArr = [];
    for(var i = 0; i < arr.length; i++){
        newArr.push(arr[i] / num);
    }
    return newArr
}
/*
var fin = fs.openRead("./sandbox/sensors/nodes54_out.txt");
while (!fin.eof) {
    var data = fin.getNextLn();
    if (JSON.parse(data).store == 'WeatherMeasurement') {
        WeatherMeasurement.add(JSON.parse(data));    
        console.say("OK addWeatherMeasurement");   
    }
    else {
        SensorMeasurement.add(JSON.parse(data));    
        console.say("OK addSensorMeasurement");   
    }
};*/