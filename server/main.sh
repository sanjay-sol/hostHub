#!/bin/bash

export GIT_URL = "$GIT_URL"

git clone "$GIT_URL" /home/app/output

exec node script.js