#!/bin/bash

# 解决网络不稳定问题，持续构建，直到构建成功


while true; do
    make dev
    if [ $? -eq 0 ]; then
        echo "make dev succeeded"
        break
    else
        echo "make dev failed, retrying in 5 seconds..."
        sleep 5
    fi
done