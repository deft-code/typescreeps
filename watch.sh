#!/bin/bash

while true; do
  inotifywait -r -e close_write src/ && gulp ${1};
done;
