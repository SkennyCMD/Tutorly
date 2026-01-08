#!/bin/bash

echo "Testing API with HTTPS and generated key..."
echo ""

# Test HTTPS endpoint (ignore self-signed certificate warning)
echo "1. Testing HTTPS on port 8443:"
curl -k -H "X-API-Key: MLkOj0KWeVxppf7sJifwRS3gwukG0Mhu" https://localhost:8443/api/admins

echo -e "\n"
echo "2. Testing without API key (should fail):"
curl -k https://localhost:8443/api/admins

echo -e "\n\nDone"
