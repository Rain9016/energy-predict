CURRENT_PATH=`pwd`
export QMINER_HOME=$CURRENT_PATH/../../../build/
export PATH=$PATH:$CURRENT_PATH/../../../build/

rm -f lock
qm config -conf=sensors.conf
qm create -conf=sensors.conf -def=sensors.def
qm start -conf=sensors.conf -server -jsmemstat=1000

