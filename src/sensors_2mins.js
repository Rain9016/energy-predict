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
var storeNm = "SensorMeasurementCalc";
var buffSize = 180; //how many ticks in advance do we predict
var nPrevious = 100; //how many previous values do we take in account for autoregression
var numSquared = 3; //how many features will be used in the squaring?
var numSquared2 = 1; //how many features will be used in the squaring?
//WORKAROUND COMMAND!
var using = 1;
//var StoreMeas = qm.store("SensorMeasurement");
var Training = qm.store("SensorMeasurementCalc");
var WeatherResampled = qm.store("WeatherMeasurementCalc");
aggregateCurrent();

WeatherMeasurement.addStreamAggr({ name: "Resample2mins", type: "resampler",
    outStore: "WeatherMeasurementCalc", timestamp: "DateTime", start: "2013-05-01T07:29:00", 
    fields: [ 
        { name: "wind_direction", interpolator: "previous" },
        { name: "air_temperature", interpolator: "previous" },
        { name: "humidity", interpolator: "previous" },
        { name: "wind_speed", interpolator: "previous" },
        { name: "rain", interpolator: "previous" },
        { name: "solar_radiation", interpolator: "previous" } ],
    createStore: false, interval: 120*1000 });
//add one record in the store, 
//WeatherMeasurement.add({DateTime:"2013-05-01T07:29:50",store:"WeatherMeasurement",wind_direction:0,air_temperature:0,humidity:0,rain:0,solar_radiation:0,wind_speed:0});
//WeatherMeasurement.add({DateTime:"2013-05-01T07:31:50",store:"WeatherMeasurement",wind_direction:47.8,air_temperature:12.2,humidity:92.4,rain:0,solar_radiation:140,wind_speed:0});

// initialize resamper from StoreMeas to Training store
// results in a equaly spaced time series with 10 second interval
SensorMeasurement.addStreamAggr({ name: "tick", type: "timeSeriesTick", 
    timestamp: "DateTime", value: "current_val" });
SensorMeasurement.addStreamAggr({ name: "Resample2mins", type: "resampler",
    outStore: "SensorMeasurementCalc", timestamp: "DateTime", start: "2013-05-01T07:29:00", 
    fields: [ 
        { name: "current_val", interpolator: "previous" },
        { name: "bottom_solar_cell_temperature", interpolator: "previous" },
        { name: "top_solar_cell_temperature", interpolator: "previous" },
        { name: "air_temperature", interpolator: "previous" } ],
    createStore: false, interval: 120*1000 });

// insert Training store aggregates
Training.addStreamAggr({ name: "tick", type: "timeSeriesTick", 
    timestamp: "DateTime", value: "current_val" });
Training.addStreamAggr({ name: "ema12m", type: "ema",
    inAggr: "tick", emaType: "previous", interval: 720*1000, initWindow: 120*1000 });
Training.addStreamAggr({ name: "ema120m", type: "ema",
    inAggr: "tick", emaType: "previous", interval: 7200*1000, initWindow: 120*1000 });
// insert buffer for generating training examples
Training.addStreamAggr({ name: "delay", type: "recordBuffer", size: buffSize});
//SensorMeasurement.add({DateTime:"2013-05-01T07:29:50",store:"SensorMeasurement",top_solar_cell_temperature:0,bottom_solar_cell_temperature:0,air_temperature:0,current_val:0});

// define feature extractors
var ftrSpace = initFtrSp();
var ftrSpaceWeatherSolar = qm.analytics.newFeatureSpace([
        {type:"numeric", source: "WeatherMeasurementCalc", field:"air_temperature"}/*,
        {type:"numeric", source: "WeatherMeasurementCalc", field:"solar_radiation"}*/
    ]);
var ftrSpaceSolarAngles = qm.analytics.newFeatureSpace([
        {type:"numeric", source: "SensorMeasurementCalc", field:"sunAltLater"},
        {type:"numeric", source: "SensorMeasurementCalc", field:"sunAzimLater"}
    ]);
var ftrSpaceWeatherTemp = qm.analytics.newFeatureSpace({type:"numeric", source: "WeatherMeasurementCalc", field:"air_temperature"});

console.log("Feature space has " + (ftrSpaceSolarAngles.dim + ftrSpaceWeatherSolar.dim) + " dimensions");

//dim of the squared ftrspace
dimSquared = numSquared*numSquared-((numSquared*numSquared)-numSquared)/2;
dimSquared2 = numSquared2*numSquared2-((numSquared2*numSquared2)-numSquared2)/2;

var linReg = qm.analytics.newRecLinReg({"dim":ftrSpace.dim, "forgetFact":0.9995, "regFact":1000});
var linRegWithTempPredSolarAutoreg = qm.analytics.newRecLinReg({"dim": ftrSpaceSolarAngles.dim + ftrSpaceWeatherSolar.dim + nPrevious, "forgetFact":0.9995, "regFact":500});
var linRegWithTempPredSolar = qm.analytics.newRecLinReg({"dim": ftrSpaceSolarAngles.dim + ftrSpaceWeatherSolar.dim, "forgetFact":0.9995, "regFact":500});
var linRegWithWeatherTemp = qm.analytics.newRecLinReg({"dim":ftrSpace.dim + ftrSpaceWeatherTemp.dim, "forgetFact":0.9995, "regFact":1000});
var linRegSquared = qm.analytics.newRecLinReg({"dim": dimSquared, "forgetFact":0.9995, "regFact":1000});
var linRegSquared2 = qm.analytics.newRecLinReg({"dim": dimSquared2, "forgetFact":0.9995, "regFact":1000});

var rememberDate = "1970-09-07T12:12:12";
var outFile = fs.openWrite("/home/administrator/Documents/qminer/QMiner/test/Examples/adv_sensors/sandbox/sensors/output.txt");
var max = 0;
var min = 999999;
var sum = 0;
var sumErr = 0;
var sumErrFcSolarAuto = 0;
var sumErrFcSolar = 0;
var sumErrTemp = 0;
var sumErrLast = 0;
var sumErrSquared = 0;
var sumErrSquared2 = 0;
var sumErrSq = 0;
var sumErrFcSolarAutoSq = 0;
var sumErrFcSolarSq = 0;
var sumErrTempSq = 0;
var sumErrLastSq = 0;
var sumErrSquaredSq = 0;
var sumErrSquared2Sq = 0;
var avg = 0;
var count = 0;

var predictBuffer = [];
var oldVals = [];
var tmpVec = []; // just to use for linreg when oldVals vector isn't full yet.
for (var i = 0; i < nPrevious; i++) tmpVec[i] = 0;
// create feature vectors from resampled store
Training.addTrigger({
    onAdd: function (val) {
        //TODO: use data form n minutes ahead to act as forecast and predict from there

        // get time of sunrise for every sensor TODO: now just adding 2 hours manually, would need to take location in account
        var sensorInfo = qm.search({$from: "SensorNode", Name: "Node_54"});
        var dateNow = new Date(val.DateTime.string + "00Z");
        var datePredictingFor = new Date(dateNow.getTime() + buffSize*2*60000);
        var sunriseTime = dateNow.sunrise(sensorInfo[0].Location[0],sensorInfo[0].Location[1]);
        sunriseTime.setHours(sunriseTime.getHours());
        var sunsetTime = dateNow.sunset(sensorInfo[0].Location[0],sensorInfo[0].Location[1]);
        sunsetTime.setHours(sunsetTime.getHours());
        console.say("Sunset: " + sunsetTime);
        // remember current emas
        var ema12m = Training.getStreamAggr("ema12m").EMA;
        var ema120m = Training.getStreamAggr("ema120m").EMA;
        //TODO: get timezones in order, in the winter time there may be problems
        dateNow.setHours(dateNow.getHours()-2);
        datePredictingFor.setHours(datePredictingFor.getHours()-2);

        var sunPosNow = compute_angle(
                sensorInfo[0].Location[0],
                sensorInfo[0].Location[1],
                '1.0',dateNow.toString());
        
        var sunPosTimeOfPrediction = compute_angle(
                sensorInfo[0].Location[0],
                sensorInfo[0].Location[1],
                '1.0',datePredictingFor.toString());

        Training.add({ 
            $id: val.$id,
            EmaShort: ema12m, 
            EmaLong: ema120m, 
            sunAltNow: sunPosNow[0],
            sunAzimNow: Math.abs(sunPosNow[1]),
            sunAltLater: sunPosTimeOfPrediction[0],
            sunAzimLater: Math.abs(sunPosTimeOfPrediction[1])
        });

        /*console.say("SUNPOS: " + sunPosTimeOfPrediction);
        console.say("DATE SUNPOS: " + datePredictingFor.toString());
        console.say("DATE NOW: " + dateNow.toString());*/

        //TODO: manage the timestamps according to lat and long
        //Learn and predict only in daytime
        if(datePredictingFor < sunriseTime || dateNow > sunsetTime){ // TODO: DON?T LOOK AT TIME NOW BUT LOOK AT TIME WE ARE PREDICTIONG FOR!
            //var prevoiusId = val.$id - 1;
            //var rec = Training[prevoiusId];
            Training.add({ 
                $id: val.$id,
                current_val_predicted: val.current_val, 
                current_pred_tempfcast_solarang_autoreg: val.current_val,
                current_pred_tempfcast_solarang: val.current_val,
                current_val_predicted_with_weather_temp: val.current_val,
                current_val_predicted_last_seen: val.current_val,
                current_val_predicted_squared: val.current_val,
                current_val_predicted_squared2: val.current_val
            });
            var trainRecId = Training.getStreamAggr("delay").first;
            
            /*
            NO learning at night
            if (trainRecId > 0) {
                var ftrV = ftrSpace.ftrVec(Training[trainRecId]);
                linReg.learn(ftrV, val.current_val); 
                linRegWithWeatherPredSolarAutoreg.learn(ftrSpaceWeatherSolar.ftrVec(WeatherResampled[trainRecId]), val.current_val); 
                ftrV = ftrSpace.ftrVec(Training[trainRecId]);
                ftrV.concat(ftrSpaceWeatherTemp.ftrVec(WeatherResampled[trainRecId]));
                linRegWithWeatherTemp.learn(ftrV, val.current_val); 
            }*/

            //JUST keep filling the buffer at night
            predictBuffer.push([
                val.current_val, 
                val.current_val, 
                val.current_val,
                val.current_val,
                val.current_val,
                val.current_val,
                val.current_val, //just insert this value as predicted for last seen prediction
                val.$id+buffSize
            ]);
            if(predictBuffer.length > buffSize){
                predictBuffer.shift();
            }


            console.say("NIGHT TIME");
        }
        else{ // IF not night then calculate
            // get vals from 2 stores for prediction

            //setup for autoregression
            //fill the vector with previous values -> fill it on every iteration without querying the db
            if(using == 1){
                if(oldVals.length >= nPrevious + buffSize){
                    //console.log("VECLENGTH: " +  oldVals.length);
                    //vector of old values used for prediction - contains values n back from current measurement
                    var oldValsCVec = linalg.newVec(oldVals.slice(oldVals.length-nPrevious, oldVals.length));
                    //vector of old values used for learning - contains values n back from end of buffer
                    //in real life these vectors would be the same
                    var endBuffValsCVec = linalg.newVec(oldVals.slice(0, nPrevious));
                    //console.log("CVECLENGTH: " +  oldValsCVec.length);
                    //console.log("BUFFVECLEN: " +  oldVals.slice(0, nPrevious).length);
                    //console.log("" + oldVals.slice(oldVals.length-nPrevious, oldVals.length));
                    //console.log("Size Spliced: " + oldVals.slice(oldVals.length-nPrevious, oldVals.length).length);
                    //console.log("CURRENT VAL: " + val.current_val);
                    oldVals.shift();
                }
                else{
                    var oldValsCVec = linalg.newVec(tmpVec);
                    var endBuffValsCVec = linalg.newVec(tmpVec);
                }
            
                oldVals.push(val.current_val);
            }

            var recWeather = WeatherResampled[val.$id+buffSize];
            if(using == 3){
                var ftrVcurr = ftrSpace.ftrVec(val);
                var prediction = linReg.predict(ftrVcurr);
            }
            else
                var prediction = 0;

            if (using == 2 || using == 1) {
                var ftrVSolAng = ftrSpaceSolarAngles.ftrVec(val);
            }
            if (using == 4) {
                //var ftrVSquaredElems = [val.air_temperature, val.top_solar_cell_temperature, val.bottom_solar_cell_temperature];
                var ftrVSquared = linalg.newVec([ // TODO: maybe use data from weather station
                    val.air_temperature * val.air_temperature,
                    val.top_solar_cell_temperature * val.top_solar_cell_temperature,
                    val.bottom_solar_cell_temperature * val.bottom_solar_cell_temperature,
                    val.air_temperature * val.top_solar_cell_temperature,
                    val.air_temperature * val.bottom_solar_cell_temperature,
                    val.top_solar_cell_temperature * val.bottom_solar_cell_temperature
                ]);
            }
            if(using == 5){
                //var ftrVSquaredElems2 = [1];
                var ftrVSquared2 = linalg.newVec([1]);
            }
            //we add predictions
            if (using == 2 || using == 1) {
                ftrVSolAng.concat(ftrSpaceWeatherSolar.ftrVec(recWeather));
                var predictionWithTempPredSolar = linRegWithTempPredSolar.predict(ftrVSolAng);
            }else{
                var predictionWithTempPredSolar = 0;
            }

            if(using == 1){
                ftrVSolAng.concat(oldValsCVec);
                var predictionWithTempPredSolarAutoreg = linRegWithTempPredSolarAutoreg.predict(ftrVSolAng);
            }else{
                var predictionWithTempPredSolarAutoreg = 0;
            }
            if(using == 6){
                ftrVcurr = ftrSpace.ftrVec(val);
                ftrVcurr.concat(ftrSpaceWeatherTemp.ftrVec(recWeather));
                var predictionWithWeatherTemp = linRegWithWeatherTemp.predict(ftrVcurr);
            }else{
                var predictionWithWeatherTemp = 0;
            }
            if (using == 4) {
                var predictionSquared = linRegSquared.predict(ftrVSquared);
            }
            else
                var predictionSquared = 0;
            if(using == 5){
                var predictionSquared2 = linRegSquared2.predict(ftrVSquared2);
            }else{
                var predictionSquared2 = 0;
            }


            predictBuffer.push([
                prediction, 
                predictionWithTempPredSolarAutoreg, 
                predictionWithWeatherTemp,
                val.current_val, //just insert this value as predicted for last seen prediction
                predictionWithTempPredSolar,
                predictionSquared, 
                predictionSquared2, 
                val.$id+buffSize
            ]);
            
            //console.log(JSON.stringify(predictBuffer));
            //console.log('Psen: ' + (prediction).toFixed(2) + ' PsenS: ' + (predictionWithWeatherSolar).toFixed(2) + ' PsenT: ' + (predictionWithWeatherTemp).toFixed(2) + ' PLast: ' + (val.current_val).toFixed(2) )
            //console.log('PbuffLen: ' + predictBuffer.length + ' PbuffSize: ' + buffSize);
            
            if(predictBuffer.length > buffSize){
                Training.add({ 
                    $id: val.$id, 
                    current_val_predicted: predictBuffer[0][0],
                    current_pred_tempfcast_solarang_autoreg: predictBuffer[0][1],
                    current_val_predicted_with_weather_temp: predictBuffer[0][2],
                    current_val_predicted_last_seen: predictBuffer[0][3],
                    current_pred_tempfcast_solarang: predictBuffer[0][4],
                    current_pred_squared: predictBuffer[0][5],
                    current_pred_squared2: predictBuffer[0][6],
                });
                
                //console.log('Prediction for: ' + predictBuffer[0][4] + ' Inserted at: ' + val.$id);
                //console.log('APsen: ' + (predictBuffer[0][0]).toFixed(2) + ' APsenS: ' + (predictBuffer[0][1]).toFixed(2) + ' APsenT: ' + (predictBuffer[0][2]).toFixed(2) + ' APLast: ' + (predictBuffer[0][3]).toFixed(2) )
                
                predictBuffer.shift();
            }

            //get Id of record n positions back - end of the buffer
            //for training
            var trainRecId = Training.getStreamAggr("delay").first;

            //console.log("ftrvecID: " + trainRecId);
            //console.log("currentID: " + val.$id);
            //console.log("sun altNow: " + Training[trainRecId].sunAltLater);
            //console.log("sun azimNow: " + Training[trainRecId].sunAzimLater);

            if (trainRecId > 0) {
                if(using == 3){
                    var ftrV = ftrSpace.ftrVec(Training[trainRecId]);
                }
                if(using == 4){
                    var ftrVecSquared = linalg.newVec([
                        Training[trainRecId].air_temperature * Training[trainRecId].air_temperature,
                        Training[trainRecId].top_solar_cell_temperature * Training[trainRecId].top_solar_cell_temperature,
                        Training[trainRecId].bottom_solar_cell_temperature * Training[trainRecId].bottom_solar_cell_temperature,
                        Training[trainRecId].air_temperature * Training[trainRecId].top_solar_cell_temperature,
                        Training[trainRecId].air_temperature * Training[trainRecId].bottom_solar_cell_temperature,
                        Training[trainRecId].top_solar_cell_temperature * Training[trainRecId].bottom_solar_cell_temperature,
                    ]);
                }
                if(using == 5){
                    var ftrVecSquared2 = linalg.newVec([1]);
                }
                if(using == 3){
                    linReg.learn(ftrV, val.current_val); 
                }
                if (using == 1 || using == 2) {
                    var ftrVSolAng = ftrSpaceSolarAngles.ftrVec(Training[trainRecId]);
                    ftrVSolAng.concat(ftrSpaceWeatherSolar.ftrVec(WeatherResampled[val.$id]));
                    linRegWithTempPredSolar.learn( ftrVSolAng, val.current_val); 
                }
                if (using == 1) {
                    ftrVSolAng.concat(endBuffValsCVec);
                    linRegWithTempPredSolarAutoreg.learn( ftrVSolAng, val.current_val); 
                }
                if(using == 6){
                    ftrV = ftrSpace.ftrVec(Training[trainRecId]);
                    ftrV.concat(ftrSpaceWeatherTemp.ftrVec(WeatherResampled[trainRecId]));
                    linRegWithWeatherTemp.learn(ftrV, val.current_val); 
                }
                if(using == 4){
                    linRegSquared.learn(ftrVecSquared, val.current_val); 
                }
                if(using == 5){
                    linRegSquared2.learn(ftrVecSquared2, val.current_val); 
                }
            }
                        // check prediction
            // changed from Training[trainRecId].current_val_predicted to val.current_val_predicted
            // WTH did I do * 1000 and /1000 
            var diff = Math.round(Math.abs(val.current_val - val.current_val_predicted) * 1000) / 1000;
            var diffWithTempPredSolarAutoreg = Math.round(Math.abs(val.current_val - val.current_pred_tempfcast_solarang_autoreg) * 1000) / 1000;
            var diffWithTempPredSolar = Math.round(Math.abs(val.current_val - val.current_pred_tempfcast_solarang) * 1000) / 1000;
            var diffWithWeatherTemp = Math.round(Math.abs(val.current_val - val.current_val_predicted_with_weather_temp) * 1000) / 1000;
            var diffLastSeen = Math.round(Math.abs(val.current_val - val.current_val_predicted_last_seen) * 1000) / 1000;
            var diffSquared = Math.round(Math.abs(val.current_val - val.current_val_predicted_squared) * 1000) / 1000;
            var diffSquared2 = Math.round(Math.abs(val.current_val - val.current_val_predicted_squared2) * 1000) / 1000;
            
            var diffSq = Math.round(Math.pow(val.current_val - val.current_val_predicted, 2));
            var diffWithTempPredSolarAutoregSq = Math.round(Math.pow(val.current_val - val.current_pred_tempfcast_solarang_autoreg, 2));
            var diffWithTempPredSolarSq = Math.round(Math.pow(val.current_val - val.current_pred_tempfcast_solarang, 2));
            var diffWithWeatherTempSq = Math.round(Math.pow(val.current_val - val.current_val_predicted_with_weather_temp, 2));
            var diffLastSeenSq = Math.round(Math.pow(val.current_val - val.current_val_predicted_last_seen, 2));
            var diffSquaredSq = Math.round(Math.pow(val.current_val - val.current_val_predicted_squared, 2));
            var diffSquared2Sq = Math.round(Math.pow(val.current_val - val.current_val_predicted_squared2, 2));

            if(!isNaN(diff)){
                Training.add({ 
                    $id: val.$id,
                    diff: diff, 
                    diff_tempfcast_solarang_autoreg: diffWithTempPredSolarAutoreg, 
                    diff_tempfcast_solarang: diffWithTempPredSolar, 
                    diff_with_weather_temp: diffWithWeatherTemp, 
                    diff_squared: diffSquared, 
                    diff_squared2: diffSquared2, 
                    diff_last_seen: diffLastSeen,
                    diff_sq: diffSq, 
                    diff_tempfcast_solarang_autoreg_sq: diffWithTempPredSolarAutoregSq, 
                    diff_tempfcast_solarang_sq: diffWithTempPredSolarSq, 
                    diff_with_weather_temp_sq: diffWithWeatherTempSq, 
                    diff_squared_sq: diffSquaredSq, 
                    diff_squared2_sq: diffSquared2Sq, 
                    diff_last_seen_sq: diffLastSeenSq
                });
            }
            console.log("Diff: " + diff + ", Value: " + val.current_val);
            console.log("DiffS: " + diffSquared);
            //console.log("DiffT: " + diffWithWeatherTemp);
            //console.log("DiffLast: " + diffLastSeen);
            //console.log("Date: " + val.DateTime.string + " Date2: " + Date.parse(rememberDate));

            if(max < val.current_val)
                max = val.current_val;
            if(min > val.current_val)
                min = val.current_val;
            count++;
            sum += val.current_val;
            sumErr += diff;
            sumErrFcSolarAuto += diffWithTempPredSolarAutoreg;
            sumErrFcSolar += diffWithTempPredSolar;
            sumErrTemp += diffWithWeatherTemp;
            sumErrLast += diffLastSeen;
            sumErrSquared += diffSquared;
            sumErrSquared2 += diffSquared2;
            sumErrSq += diffSq;
            sumErrFcSolarAutoSq += diffWithTempPredSolarAutoregSq;
            sumErrFcSolarSq += diffWithTempPredSolarSq;
            sumErrTempSq += diffWithWeatherTempSq;
            sumErrLastSq += diffLastSeenSq;
            sumErrSquaredSq += diffSquaredSq;
            sumErrSquared2Sq += diffSquared2Sq;
            avg = sum/count;
            avgErr = sumErr/count;
            avgErrFcSolarAuto = sumErrFcSolarAuto/count;
            avgErrFcSolar = sumErrFcSolar/count;
            avgErrTemp = sumErrTemp/count;
            avgErrLast = sumErrLast/count;
            avgErrSquared = sumErrSquared/count;
            avgErrSquared2 = sumErrSquared2/count;
            avgErrSq = sumErrSq/count;
            avgErrFcSolarAutoSq = sumErrFcSolarAutoSq/count;
            avgErrFcSolarSq = sumErrFcSolarSq/count;
            avgErrTempSq = sumErrTempSq/count;
            avgErrLastSq = sumErrLastSq/count;
            avgErrSquaredSq = sumErrSquaredSq/count;
            avgErrSquared2Sq = sumErrSquared2Sq/count;

            console.log("count: " + count);
            if(Date.parse(val.DateTime.string) - Date.parse(rememberDate) > 1000*60*60*24*7){
                outFile.writeLine("max: " + max + "\tmin: " + min + "\tavg: " + avg + "\tcount: " + count + "\tfrom: " + rememberDate + "\tto: " + val.DateTime.string + "\tsum: " + sum + "\tavgErr: " + avgErr + "\tavgErrFcSolarAreg: " + avgErrFcSolarAuto + "\tavgErrFcSolar: " + avgErrFcSolar + "\tavgErrTemp: " + avgErrTemp + "\tavgErrLast: " + avgErrLast + "\tavgErrSquared: " + avgErrSquared + "\tavgErrSquared2: " + avgErrSquared2+ "\tavgErrSq: " + avgErrSq + "\tavgErrFcSolarAregSq: " + avgErrFcSolarAutoSq + "\tavgErrFcSolarSq: " + avgErrFcSolarSq + "\tavgErrTempSq: " + avgErrTempSq + "\tavgErrLastSq: " + avgErrLastSq + "\tavgErrSquaredSq: " + avgErrSquaredSq + "\tavgErrSquared2Sq: " + avgErrSquared2Sq);
                outFile.flush();
                rememberDate = val.DateTime.string;
                console.log("Wrote to file!");
                max = 0;
                min = 999999;
                avg = 0;
                avgErr = 0;
                avgErrFcSolarAuto = 0;
                avgErrFcSolar = 0;
                avgErrTemp = 0;
                avgErrLast = 0;
                avgErrSquared = 0;
                avgErrSquared2 = 0;
                avgErrSq = 0;
                avgErrFcSolarAutoSq = 0;
                avgErrFcSolarSq = 0;
                avgErrTempSq = 0;
                avgErrLastSq = 0;
                avgErrSquaredSq = 0;
                avgErrSquared2Sq = 0;
                sum = 0;
                sumErr = 0;
                sumErrFcSolarAuto = 0;
                sumErrFcSolar = 0;
                sumErrTemp = 0;
                sumErrLast = 0;
                sumErrSquared = 0;
                sumErrSquared2 = 0;
                sumErrSq = 0;
                sumErrFcSolarAutoSq = 0;
                sumErrFcSolarSq = 0;
                sumErrTempSq = 0;
                sumErrLastSq = 0;
                sumErrSquaredSq = 0;
                sumErrSquared2Sq = 0;
                count = 0;
            }
        }
    }
});

/*
var measArr = [];
var sampleRec = qm.search({ "$from" : storeNm , "$limit" : 0});
var sampleftrVec = ftrSpace.ftrVec(sampleRec[0]);
var dim = sampleftrVec.length;
console.say("dim: " + dim);
    */
function initFtrSp() {
    var jsonData = [
        //{type:"multinomial", source: storeNm, field:"DateTime", datetime: true},
        {type:"numeric", source: storeNm, field:"bottom_solar_cell_temperature"},
        {type:"numeric", source: storeNm, field:"top_solar_cell_temperature"},
        {type:"numeric", source: storeNm, field:"EmaShort"},
        {type:"numeric", source: storeNm, field:"EmaLong"},
        {type:"numeric", source: storeNm, field:"air_temperature"}
    ];
    var featureSpace = qm.analytics.newFeatureSpace(jsonData);

    /*
    var recs = qm.search({ "$from" : storeNm });
    if(recs)
        var featureSpace = qm.analytics.newFeatureSpace(jsonData);
    else
        var featureSpace = false;

    featureSpace.updateRecords(recs);
    */
    return featureSpace;
}

//linear regression experiments
//http://localhost:8080/sensors/lin_reg?data={%22source%22:%22SensorMeasurement%22,%22fieldNm%22:%22Value%22}
/*
http.onGet("lin_reg", function (req, resp) {    
    //jsonData = JSON.parse(req.args.data);
    var storeNm = "SensorMeasurement";
    jsonData = [
        {type:"multinomial", source: storeNm, field:"DateTime"},
        {type:"numeric", source: storeNm, field:"bottom_solar_cell_temperature"},
        {type:"numeric", source: storeNm, field:"top_solar_cell_temperature"},
        {type:"numeric", source: storeNm, field:"air_temperature"}
    ];

    var ftrSpace = setFtrGen(jsonData, storeNm);

    var rec = qm.search({ "$from" : storeNm });
    //console.say(JSON.stringify(rec));
    var ftrVec = ftrSpace.ftrVec(rec[0]);
    var dim = ftrVec.length;
    console.say("dim: " + dim);
    
    var linReg = qm.analytics.newRecLinReg({"dim":dim, "forgetFact":1.0});
    
    //linReg.learn(ftrVec, 0.5);

    
    var recs = qm.search({ "$from" : storeNm });

    //var recs2 = qm.search({ "$from" : jsonData.source, "$limit":3, "$offset":4});
    //learn from first 300 measurements, for 5 meas ahead
    for (var iter = 0; iter < 300; iter++) {
        if(iter - 5 >= 0)
            linReg.learn(ftrSpace.ftrVec(rec[iter-5]), rec[iter].current_val);
    }
    console.say(linReg.predict(ftrSpace.ftrVec(rec[300])) + "");
    jsonp(req, resp, ftrVec);
});*/

//homemade buffer
/*
http.onGet("addSMeasAndUpdate", function (req, resp) {
    var data = JSON.parse(req.args.data);
    var predictNInAdvance = 6;
    var newRecId = 0;    

    if(measArr.length > predictNInAdvance-1){
        //get correct record, by id
        var recOldest = qm.search({"$from":storeNm, "$id": measArr[0]});
        console.say("OK recOldest");  
        var recSecondOldest = qm.search({"$from":storeNm, "$id": measArr[1]});
        console.say("OK recSecondOldest");  
        var recNewest = qm.search({"$from":storeNm, "$id": measArr[predictNInAdvance-1]});
        console.say("OK recNewest ");  
        //update linReg alg with new record, and learn for predictNInAdvance steps ahead
        linReg.learn(ftrSpace.ftrVec(recOldest[0]), recNewest[0].current_val);
        console.say("OK learn");  
        var predVal = linReg.predict(ftrSpace.ftrVec(recSecondOldest[0]));
        console.say("OK predict");  
        data.current_val_predicted = predVal;
        newRecId = SensorMeasurement.add(data);
        measArr.shift();
    }
    else{
        newRecId = SensorMeasurement.add(data);    
    }
    measArr.push(newRecId);
   
    console.say("OK addSensorMeasurement");  

    return jsonp(req, resp, "OK");
}); */

http.onGet("queryLastMeasurementAndPredict", function (req, resp) {    
    //jsonData = JSON.parse(req.args.data);
    //console.say("" + JSON.stringify(jsonData));
    //var recs = qm.search(jsonData);
    var result = []; 

    var recs = qm.search({ "$from" : storeNm , "$limit" : 0, "$sort":{"DateTime" : -1}});
    if (recs.length) {
        var Weatherrec = WeatherResampled[recs[0].$id];

        result.push({
            value: recs[0].current_val, 
            pred_value: recs[0].current_val_predicted, 
            pred_value_fctemp_solar_autoreg: recs[0].current_pred_tempfcast_solarang_autoreg, 
            pred_value_fctemp_solar: recs[0].current_pred_tempfcast_solarang, 
            pred_value_squared: recs[0].current_pred_squared, 
            pred_value_squared2: recs[0].current_pred_squared2, 
            pred_value_weather_temp: recs[0].current_val_predicted_last_seen, //TODO: change back to temp
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
function aggregateCurrent() {    
    jsonData = { name: "tick", type: "timeSeriesTick", timestamp: "DateTime", value: "current_val", window:{unit: "day", value: 7}};
    var aggregator = Training.addStreamAggr(jsonData);
    console.log("Added weekAgg");
}
function getCurrentAgg() {    
    var res = Training.getStreamAggr("weekAgg");
    console.log(JSON.stringify(res));
    return res;
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