#!/bin/bash

# Test Payment Verification Script
# Usage: ./scripts/test-verification.sh <payment_id>

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if payment ID is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Missing payment ID${NC}"
  echo "Usage: ./scripts/test-verification.sh <payment_id>"
  exit 1
fi

PAYMENT_ID=$1
API_URL="http://6d5e8be64324.ngrok-free.app/api/payments/verify"

echo -e "${YELLOW}🔍 Testing Payment Verification${NC}"
echo "================================"
echo ""
echo -e "Payment ID: ${GREEN}$PAYMENT_ID${NC}"
echo ""

# Note: This requires authentication
echo -e "${YELLOW}⚠️  Note: You need to be authenticated to use this API${NC}"
echo "Please use one of these methods instead:"
echo ""
echo "1. Open this URL in your browser (while logged in):"
echo -e "   ${GREEN}http://localhost:3000/dashboard?payment_redirect=true&payment_id=$PAYMENT_ID${NC}"
echo ""
echo "2. Use the TypeScript test script:"
echo -e "   ${GREEN}npx tsx scripts/test-payment-verification.ts $PAYMENT_ID${NC}"
echo ""
echo "3. Use Postman/Insomnia with your auth cookie"
echo ""
