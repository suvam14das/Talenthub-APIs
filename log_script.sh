#!/bin/bash

FILE=./logs/talenthub.log
if test -f "$FILE"; then
	echo "$FILE exists. Hence deleting previous existing log files"
	rm -f $FILE
	echo "$FILE is successfully deleted"
fi

touch $FILE
echo "Retreiving log data from server"
heroku logs --source app --tail --app talenthub-api | sed 's/\x1b\[[0-9;]*m//g'  >> $FILE
