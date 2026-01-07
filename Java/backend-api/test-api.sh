#!/bin/bash
echo "Testing API with key..."
curl -H "X-API-Key: tutorly-key-1" http://localhost:8080/api/admins
echo -e "\n\nDone"
